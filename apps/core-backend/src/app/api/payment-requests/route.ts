import { randomUUID } from "node:crypto";
import { getConfig } from "@/lib/config";
import { inTransaction, query } from "@/lib/db";
import { appendAuditEvent } from "@/lib/ledger";
import { handleError, HttpError, json, readJson } from "@/lib/http";
import { createPaymentRequestSchema } from "@/lib/schemas";
import { createCodiRequest, PeyApiError } from "@/lib/pey";

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();
  let paymentRequestId: string | undefined;
  try {
    const parsed = createPaymentRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, parsed.error.message);
    const config = getConfig();
    const { obligationId } = parsed.data;

    const obligationResult = await query(
      `SELECT id, concept, amount_cents AS "amountCents", status
       FROM obligations
       WHERE id = $1 AND school_id = $2 AND archived_at IS NULL`,
      [obligationId, config.SCHOOL_ID],
    );
    const obligation = obligationResult.rows[0];
    if (!obligation) throw new HttpError(404, "Obligación no encontrada");
    if (obligation.status !== "pending") {
      throw new HttpError(409, "Solo se pueden cobrar obligaciones pendientes");
    }

    paymentRequestId = randomUUID();
    const reference = `PF-${paymentRequestId}`;
    await inTransaction(async (client) => {
      await client.query(
        `INSERT INTO payment_requests (id, school_id, obligation_id, reference, status)
         VALUES ($1,$2,$3,$4,'creating')`,
        [paymentRequestId, config.SCHOOL_ID, obligationId, reference],
      );
      await appendAuditEvent(client, {
        operationId: requestId,
        entityType: "payment_request",
        entityId: paymentRequestId!,
        eventType: "payment_request.prepared",
        previousState: null,
        newState: { obligationId, reference, amountCents: obligation.amountCents },
        source: "api",
        actor: "api",
      });
    });

    const peyPayment = await createCodiRequest({
      amountCents: obligation.amountCents,
      currency: "MXN",
      concept: obligation.concept,
      reference,
      callbackUrl: config.PEY_CALLBACK_URL,
    });

    const result = await inTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE payment_requests
         SET status = 'requested', provider_transaction_id = $3, payment_url = $4,
             qr_code = $5, provider_response = $6, updated_at = now()
         WHERE id = $1 AND school_id = $2
         RETURNING id, obligation_id AS "obligationId", reference, status,
                   provider_transaction_id AS "transactionId", payment_url AS "paymentUrl",
                   qr_code AS "qrCode", created_at AS "createdAt"`,
        [
          paymentRequestId,
          config.SCHOOL_ID,
          peyPayment.transactionId,
          peyPayment.paymentUrl,
          peyPayment.qrCode,
          JSON.stringify(peyPayment.rawResponse),
        ],
      );
      await appendAuditEvent(client, {
        operationId: requestId,
        entityType: "payment_request",
        entityId: paymentRequestId!,
        eventType: "payment_request.created",
        previousState: { status: "creating" },
        newState: updated.rows[0],
        source: "pey_api",
        transactionId: peyPayment.transactionId,
        actor: "api",
      });
      return updated.rows[0];
    });
    return json({ data: result }, 201);
  } catch (error) {
    if (paymentRequestId) {
      try {
        await inTransaction(async (client) => {
          await client.query(
            `UPDATE payment_requests SET status = 'failed', updated_at = now()
             WHERE id = $1 AND school_id = $2 AND status = 'creating'`,
            [paymentRequestId, getConfig().SCHOOL_ID],
          );
          await appendAuditEvent(client, {
            operationId: requestId,
            entityType: "payment_request",
            entityId: paymentRequestId!,
            eventType: "payment_request.failed",
            previousState: { status: "creating" },
            newState: { status: "failed" },
            source: "pey_api",
            actor: "api",
          });
        });
      } catch (ledgerError) {
        console.error("No se pudo registrar el fallo de la solicitud Pey", ledgerError);
      }
    }
    if (error instanceof PeyApiError) {
      console.error(error);
      return json({ error: "No fue posible crear la solicitud de pago con Pey" }, 502);
    }
    return handleError(error);
  }
}
