import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

type AuditEvent = {
  operationId?: string;
  entityType: string;
  entityId: string;
  eventType: string;
  previousState: unknown;
  newState: unknown;
  source: string;
  transactionId?: string | null;
  actor: string;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashAuditEvent(event: Record<string, unknown>): string {
  return createHash("sha256").update(stableStringify(event)).digest("hex");
}

export async function appendAuditEvent(client: PoolClient, event: AuditEvent): Promise<void> {
  const schoolId = process.env.SCHOOL_ID;
  if (!schoolId) throw new Error("SCHOOL_ID no está configurado");

  await client.query("SELECT pg_advisory_xact_lock(724019381)");
  const last = await client.query<{ event_hash: string }>(
    "SELECT event_hash FROM audit_ledger WHERE school_id = $1 ORDER BY sequence DESC LIMIT 1",
    [schoolId],
  );
  const previousHash = last.rows[0]?.event_hash ?? "GENESIS";
  const operationId = event.operationId ?? randomUUID();
  const occurredAt = new Date().toISOString();
  const canonicalEvent = {
    operationId,
    schoolId,
    entityType: event.entityType,
    entityId: event.entityId,
    eventType: event.eventType,
    previousState: event.previousState,
    newState: event.newState,
    source: event.source,
    transactionId: event.transactionId ?? null,
    actor: event.actor,
    occurredAt,
    previousHash,
  };
  const eventHash = hashAuditEvent(canonicalEvent);

  await client.query(
    `INSERT INTO audit_ledger (
       operation_id, school_id, entity_type, entity_id, event_type, previous_state,
       new_state, source, transaction_id, actor, occurred_at, previous_hash, event_hash
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      operationId,
      schoolId,
      event.entityType,
      event.entityId,
      event.eventType,
      JSON.stringify(event.previousState),
      JSON.stringify(event.newState),
      event.source,
      event.transactionId ?? null,
      event.actor,
      occurredAt,
      previousHash,
      eventHash,
    ],
  );
}
