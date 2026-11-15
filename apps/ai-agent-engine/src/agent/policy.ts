import { DomainError } from "@lexium/shared-contracts";

export interface AgentPolicy {
  maxSingleAmountCents: number;
  maxBulkPayments: number;
  maxBulkAmountCents: number;
  minCancellationReasonLength: number;
}

export const defaultAgentPolicy: AgentPolicy = {
  maxSingleAmountCents: 5_000_000,
  maxBulkPayments: 100,
  maxBulkAmountCents: 50_000_000,
  minCancellationReasonLength: 5,
};

function pesos(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function assertSingleAmount(
  policy: AgentPolicy,
  amountCents: number,
): void {
  if (amountCents > policy.maxSingleAmountCents) {
    throw new DomainError(
      "POLICY_VIOLATION",
      `El monto ${pesos(amountCents)} excede el límite operativo de ${pesos(policy.maxSingleAmountCents)} por solicitud.`,
    );
  }
}

export function assertBulkSize(policy: AgentPolicy, count: number): void {
  if (count > policy.maxBulkPayments) {
    throw new DomainError(
      "POLICY_VIOLATION",
      `La operación incluye ${count} alumnos y el límite es ${policy.maxBulkPayments} por lote. Divide la cobranza en varios lotes.`,
    );
  }
}

export function assertBulkAmount(
  policy: AgentPolicy,
  amountCents: number,
): void {
  if (amountCents > policy.maxBulkAmountCents) {
    throw new DomainError(
      "POLICY_VIOLATION",
      `El monto estimado del lote ${pesos(amountCents)} excede el límite de ${pesos(policy.maxBulkAmountCents)}.`,
    );
  }
}

export function assertCancellationReason(
  policy: AgentPolicy,
  reason: string,
): void {
  if (reason.trim().length < policy.minCancellationReasonLength) {
    throw new DomainError(
      "POLICY_VIOLATION",
      `El motivo de cancelación debe tener al menos ${policy.minCancellationReasonLength} caracteres.`,
    );
  }
}
