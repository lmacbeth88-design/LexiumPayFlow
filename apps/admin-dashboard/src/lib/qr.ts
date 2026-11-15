import { formatDate, formatMoney, formatPeriod } from "@/lib/format";
import { CONCEPT_LABEL } from "@/lib/labels";
import type { PaymentRow } from "@/lib/metrics";

export type QrChannel = "whatsapp" | "email" | "sms";

export interface QrDelivery {
  id: string;
  requestId: string;
  channel: QrChannel;
  recipient: string;
  sentAt: string;
  status: "enviado" | "programado";
}

export const QR_CHANNEL_LABEL: Record<QrChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Correo",
  sms: "SMS",
};

export function qrPayload(row: PaymentRow): string {
  return (
    row.request.codiQrPayload ??
    row.request.paymentUrl ??
    row.request.reference
  );
}

export function qrRecipient(row: PaymentRow, channel: QrChannel): string {
  if (channel === "email") {
    return row.guardianEmail ?? "";
  }
  return row.guardianPhone ?? "";
}

export function qrFileName(row: PaymentRow): string {
  return `QR-${row.request.reference}.png`;
}

export function qrMessage(row: PaymentRow): string {
  return [
    `Hola ${row.guardianName ?? "tutor"},`,
    `te compartimos el QR para pagar ${CONCEPT_LABEL[row.request.concept]} de ${row.studentName} por ${formatMoney(row.request.amountCents)}.`,
    `Referencia: ${row.request.reference}. Vence: ${formatDate(row.request.dueDate)}.`,
    `Periodo: ${formatPeriod(row.request.period)}.`,
  ].join(" ");
}

export function seedDeliveries(rows: PaymentRow[]): QrDelivery[] {
  return rows.slice(0, 3).map((row, index) => {
    const channel = (["whatsapp", "email", "sms"] as const)[index % 3]!;
    return {
      id: `qr_seed_${String(index + 1).padStart(2, "0")}`,
      requestId: row.request.id,
      channel,
      recipient:
        qrRecipient(row, channel) ||
        row.guardianName ||
        row.studentName,
      sentAt: row.request.updatedAt,
      status: "enviado",
    };
  });
}
