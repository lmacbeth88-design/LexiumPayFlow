import { getConfig } from "@/lib/config";
import { inTransaction, query } from "@/lib/db";
import { appendAuditEvent } from "@/lib/ledger";
import { handleError, HttpError, json, readJson } from "@/lib/http";
import { updateObligationSchema } from "@/lib/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { id } = await params;
    const result = await query(
      `SELECT id, student_name AS "studentName", student_reference AS "studentReference",
              concept, amount_cents AS "amountCents", currency, status,
              due_at AS "dueAt", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM obligations WHERE id = $1 AND school_id = $2 AND archived_at IS NULL`,
      [id, getConfig().SCHOOL_ID],
    );
    if (!result.rowCount) throw new HttpError(404, "Obligación no encontrada");
    return json({ data: result.rows[0] });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { id } = await params;
    const parsed = updateObligationSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, parsed.error.message);
    const values = parsed.data;
    const result = await inTransaction(async (client) => {
      const previous = await client.query(
        `SELECT id, student_name AS "studentName", student_reference AS "studentReference",
                concept, amount_cents AS "amountCents", currency, status,
                due_at AS "dueAt", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM obligations WHERE id = $1 AND school_id = $2 AND archived_at IS NULL FOR UPDATE`,
        [id, getConfig().SCHOOL_ID],
      );
      if (!previous.rowCount) throw new HttpError(404, "Obligación no encontrada");

      const current = previous.rows[0];
      const updated = await client.query(
        `UPDATE obligations SET
           student_name = $3, student_reference = $4, concept = $5, amount_cents = $6,
           due_at = $7, updated_at = now()
         WHERE id = $1 AND school_id = $2
         RETURNING id, student_name AS "studentName", student_reference AS "studentReference",
                   concept, amount_cents AS "amountCents", currency, status,
                   due_at AS "dueAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          id,
          getConfig().SCHOOL_ID,
          values.studentName ?? current.studentName,
          values.studentReference !== undefined ? values.studentReference : current.studentReference,
          values.concept ?? current.concept,
          values.amountCents ?? current.amountCents,
          values.dueAt !== undefined ? values.dueAt : current.dueAt,
        ],
      );
      await appendAuditEvent(client, {
        entityType: "obligation",
        entityId: id,
        eventType: "obligation.updated",
        previousState: current,
        newState: updated.rows[0],
        source: "api",
        actor: "api",
      });
      return updated.rows[0];
    });
    return json({ data: result });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { id } = await params;
    await inTransaction(async (client) => {
      const previous = await client.query(
        `SELECT id, student_name AS "studentName", student_reference AS "studentReference",
                concept, amount_cents AS "amountCents", currency, status,
                due_at AS "dueAt", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM obligations WHERE id = $1 AND school_id = $2 AND archived_at IS NULL FOR UPDATE`,
        [id, getConfig().SCHOOL_ID],
      );
      if (!previous.rowCount) throw new HttpError(404, "Obligación no encontrada");

      await client.query(
        "UPDATE obligations SET archived_at = now(), updated_at = now() WHERE id = $1 AND school_id = $2",
        [id, getConfig().SCHOOL_ID],
      );
      await appendAuditEvent(client, {
        entityType: "obligation",
        entityId: id,
        eventType: "obligation.archived",
        previousState: previous.rows[0],
        newState: { ...previous.rows[0], archived: true },
        source: "api",
        actor: "api",
      });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
