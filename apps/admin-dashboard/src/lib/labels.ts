import type {
  BalanceStatus,
  EducationLevel,
  LedgerEntryType,
  PaymentConcept,
  PaymentRequestStatus,
  PaymentTransactionStatus,
} from "@/lib/types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export const CONCEPT_LABEL: Record<PaymentConcept, string> = {
  colegiatura: "Colegiatura",
  inscripcion: "Inscripción",
  uniformes: "Uniformes",
  transporte: "Transporte",
  otro: "Otro",
};

export const REQUEST_STATUS_LABEL: Record<PaymentRequestStatus, string> = {
  pending: "Pendiente",
  sent: "Enviada",
  paid: "Pagada",
  expired: "Vencida",
  cancelled: "Cancelada",
};

export const REQUEST_STATUS_TONE: Record<PaymentRequestStatus, Tone> = {
  pending: "warning",
  sent: "info",
  paid: "success",
  expired: "danger",
  cancelled: "neutral",
};

export const BALANCE_STATUS_LABEL: Record<BalanceStatus, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
  overdue: "Vencido",
};

export const BALANCE_STATUS_TONE: Record<BalanceStatus, Tone> = {
  pending: "warning",
  partial: "info",
  paid: "success",
  overdue: "danger",
};

export const TRANSACTION_STATUS_LABEL: Record<PaymentTransactionStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  rejected: "Rechazada",
};

export const TRANSACTION_STATUS_TONE: Record<PaymentTransactionStatus, Tone> = {
  pending: "warning",
  confirmed: "success",
  rejected: "danger",
};

export const LEDGER_TYPE_LABEL: Record<LedgerEntryType, string> = {
  "payment_request.created": "Solicitud creada",
  "payment_request.cancelled": "Solicitud cancelada",
  "webhook.received": "Webhook recibido",
  "payment.confirmed": "Pago confirmado",
  "payment.rejected": "Pago rechazado",
  "receipt.issued": "Recibo emitido",
  "reminder.sent": "Recordatorio enviado",
};

export const LEDGER_TYPE_TONE: Record<LedgerEntryType, Tone> = {
  "payment_request.created": "info",
  "payment_request.cancelled": "neutral",
  "webhook.received": "info",
  "payment.confirmed": "success",
  "payment.rejected": "danger",
  "receipt.issued": "success",
  "reminder.sent": "warning",
};

export const LEVEL_LABEL: Record<EducationLevel, string> = {
  preescolar: "Preescolar",
  primaria: "Primaria",
  secundaria: "Secundaria",
  bachillerato: "Bachillerato",
};
