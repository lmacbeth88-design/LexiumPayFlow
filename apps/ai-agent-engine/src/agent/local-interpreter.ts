export type DashboardMetric =
  | "collected"
  | "pending"
  | "overdue"
  | "active"
  | "unmatched";

export type DashboardCommand =
  | { type: "navigate"; href: string; label: string }
  | { type: "summary"; metric: DashboardMetric }
  | { type: "reset_view" }
  | { type: "export_pdf" }
  | { type: "financial_action"; action: "create" | "cancel" | "remind" }
  | { type: "unknown" };

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function interpretDashboardCommand(input: string): DashboardCommand {
  const text = normalize(input);
  if (!text) return { type: "unknown" };

  if (/\b(limpia|limpiar|restablece|reinicia)\b/.test(text)) {
    return { type: "reset_view" };
  }
  if (/\b(pdf|imprime|imprimir|exporta|exportar|reporte)\b/.test(text)) {
    return { type: "export_pdf" };
  }

  const hasFinancialTarget = /\b(solicitud|solicitudes|cobro|cobros|pago|pagos|qr|codi|recordatorio|recordatorios)\b/.test(text);
  if (hasFinancialTarget) {
    if (/\b(cancela|cancelar|anula|anular)\b/.test(text)) {
      return { type: "financial_action", action: "cancel" };
    }
    if (/\b(recordatorio|recordatorios|avisa|avisar|notifica|notificar)\b/.test(text)) {
      return { type: "financial_action", action: "remind" };
    }
    if (/\b(crea|crear|genera|generar|emite|emitir|manda|mandar|envia|enviar|cobra|cobrar)\b/.test(text)) {
      return { type: "financial_action", action: "create" };
    }
  }

  if (/\b(vencid[oa]s?|moros[oa]s?|atrasad[oa]s?)\b/.test(text)) {
    return { type: "summary", metric: "overdue" };
  }
  if (/\b(pendiente|pendientes|debe|deben|deuda|adeudo|adeudan)\b/.test(text)) {
    return { type: "summary", metric: "pending" };
  }
  if (/\b(sin conciliar|no conciliad[oa]s?)\b/.test(text)) {
    return { type: "summary", metric: "unmatched" };
  }
  if (/\b(cobrad[oa]s?|recaudad[oa]s?)\b/.test(text)) {
    return { type: "summary", metric: "collected" };
  }
  if (/\b(solicitudes activas|cobros activos)\b/.test(text)) {
    return { type: "summary", metric: "active" };
  }

  const routes = [
    { href: "/conciliacion", label: "Conciliación", terms: /\b(conciliacion|conciliar)\b/ },
    { href: "/auditoria", label: "Auditoría", terms: /\b(auditoria|ledger|bitacora)\b/ },
    { href: "/alumnos", label: "Alumnos", terms: /\b(alumnos|estudiantes|tutores)\b/ },
    { href: "/qr", label: "Códigos QR", terms: /\b(qr|codigo qr|codigos qr)\b/ },
    { href: "/cobranza", label: "Cobranza", terms: /\b(cobranza|solicitudes|pagos)\b/ },
    { href: "/", label: "Resumen", terms: /\b(resumen|inicio|principal|dashboard)\b/ },
  ];
  const route = routes.find(({ terms }) => terms.test(text));
  if (route) {
    return { type: "navigate", href: route.href, label: route.label };
  }

  return { type: "unknown" };
}
