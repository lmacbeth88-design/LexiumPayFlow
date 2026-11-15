import { randomUUID } from "node:crypto";
import { getConfig } from "@/lib/config";
import { inTransaction, query } from "@/lib/db";
import { appendAuditEvent } from "@/lib/ledger";
import { handleError, HttpError, json, readJson } from "@/lib/http";
import { createObligationSchema } from "@/lib/schemas";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") ?? "50");
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new HttpError(400, "limit debe ser un entero entre 1 y 100");
    }
    if (status && !["pending", "paid", "cancelled"].includes(status)) {
      throw new HttpError(400, "status no es válido");
    }
    const result = await query(
      `SELECT id, student_name AS "studentName", student_reference AS "studentReference",
              concept, amount_cents AS "amountCents", currency, status,
              due_at AS "dueAt", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM obligations
       WHERE school_id = $1 AND archived_at IS NULL AND ($2::text IS NULL OR status = $2)
       ORDER BY created_at DESC LIMIT $3`,
      [getConfig().SCHOOL_ID, status, limit],
    );
    return json({ data: result.rows });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = createObligationSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, parsed.error.message);

    const config = getConfig();
    const id = randomUUID();
    const values = parsed.data;
    const obligation = await inTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO obligations
           (id, school_id, student_name, student_reference, concept, amount_cents, due_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, student_name AS "studentName", student_reference AS "studentReference",
                   concept, amount_cents AS "amountCents", currency, status,
                   due_at AS "dueAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          id,
          config.SCHOOL_ID,
          values.studentName,
          values.studentReference ?? null,
          values.concept,
          values.amountCents,
          values.dueAt ?? null,
        ],
      );
      await appendAuditEvent(client, {
        entityType: "obligation",
        entityId: id,
        eventType: "obligation.created",
        previousState: null,
        newState: result.rows[0],
        source: "api",
        actor: "api",
      });
      return result.rows[0];
    });
    return json({ data: obligation }, 201);
  } catch (error) {
    return handleError(error);
  }
}
