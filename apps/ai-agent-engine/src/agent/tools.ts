import {
  AgentToolName,
  CancelPaymentRequestInputSchema,
  CreateBulkPaymentRequestsInputSchema,
  CreatePaymentRequestInputSchema,
  GetLedgerAuditInputSchema,
  GetPaymentStatusInputSchema,
  GetReconciliationSummaryInputSchema,
  GetStudentAccountInputSchema,
  ListPendingPaymentsInputSchema,
  SearchStudentsInputSchema,
  SendPaymentRemindersInputSchema,
} from "@lexium/shared-contracts";
import { tool } from "ai";
import {
  handleCancelPaymentRequest,
  handleCreateBulkPaymentRequests,
  handleCreatePaymentRequest,
  handleGetLedgerAudit,
  handleGetPaymentStatus,
  handleGetReconciliationSummary,
  handleGetStudentAccount,
  handleListPendingPayments,
  handleSearchStudents,
  handleSendPaymentReminders,
  type AgentContext,
} from "./handlers";
import { toToolResult } from "./result";

export function createAgentTools(context: AgentContext) {
  return {
    [AgentToolName.searchStudents]: tool({
      description:
        "Busca alumnos por nombre, apellido o matrícula. Devuelve coincidencias con nivel, grupo, tutor y saldo pendiente. Úsala antes de cobrar para validar el alumno o el universo de cobranza.",
      inputSchema: SearchStudentsInputSchema,
      execute: (input) =>
        toToolResult(() => handleSearchStudents(context, input)),
    }),

    [AgentToolName.getStudentAccount]: tool({
      description:
        "Consulta la ficha financiera de un alumno: tutor principal, saldos por concepto/periodo y totales pendientes, pagados y vencidos. Requiere el id del alumno obtenido con search_students.",
      inputSchema: GetStudentAccountInputSchema,
      execute: (input) =>
        toToolResult(() => handleGetStudentAccount(context, input)),
    }),

    [AgentToolName.listPendingPayments]: tool({
      description:
        "Lista solicitudes de pago activas (pendientes o enviadas), con alumno, concepto, monto, vencimiento y referencia. Sirve para saber a quién cobrar o recordar.",
      inputSchema: ListPendingPaymentsInputSchema,
      execute: (input) =>
        toToolResult(() => handleListPendingPayments(context, input)),
    }),

    [AgentToolName.createPaymentRequest]: tool({
      description:
        "Crea una solicitud de pago CoDi/SPEI para un alumno. El monto se envía en centavos y la fecha de vencimiento en YYYY-MM-DD. Devuelve la solicitud con referencia y QR CoDi. No confirma pagos.",
      inputSchema: CreatePaymentRequestInputSchema,
      execute: (input) =>
        toToolResult(() => handleCreatePaymentRequest(context, input)),
    }),

    [AgentToolName.createBulkPaymentRequests]: tool({
      description:
        "Crea solicitudes de pago para varios alumnos en un solo lote. Si se omite amountCents, usa el saldo pendiente de cada alumno para el concepto y periodo de la fecha de vencimiento. Omite alumnos sin saldo o con una solicitud activa duplicada. Confirma el resumen con el usuario antes de ejecutar.",
      inputSchema: CreateBulkPaymentRequestsInputSchema,
      execute: (input) =>
        toToolResult(() =>
          handleCreateBulkPaymentRequests(context, input),
        ),
    }),

    [AgentToolName.getPaymentStatus]: tool({
      description:
        "Consulta el estado de una solicitud de pago por id o referencia CoDi/SPEI. Devuelve transacciones, recibo emitido y validación del ledger SHA-256. Úsala siempre antes de afirmar que un pago fue recibido.",
      inputSchema: GetPaymentStatusInputSchema,
      execute: (input) =>
        toToolResult(() => handleGetPaymentStatus(context, input)),
    }),

    [AgentToolName.sendPaymentReminders]: tool({
      description:
        "Envía recordatorios de pago a los tutores de solicitudes activas por WhatsApp, SMS o correo. Marca las solicitudes pendientes como enviadas y registra el evento en el ledger.",
      inputSchema: SendPaymentRemindersInputSchema,
      execute: (input) =>
        toToolResult(() => handleSendPaymentReminders(context, input)),
    }),

    [AgentToolName.cancelPaymentRequest]: tool({
      description:
        "Cancela una solicitud de pago pendiente o enviada. Requiere un motivo de al menos 5 caracteres. No se pueden cancelar solicitudes pagadas, expiradas o ya canceladas.",
      inputSchema: CancelPaymentRequestInputSchema,
      execute: (input) =>
        toToolResult(() => handleCancelPaymentRequest(context, input)),
    }),

    [AgentToolName.getReconciliationSummary]: tool({
      description:
        "Resume la conciliación de un rango de fechas: monto esperado, cobrado, pendiente, transacciones y pagos no conciliados (webhooks sin solicitud o monto coincidente).",
      inputSchema: GetReconciliationSummaryInputSchema,
      execute: (input) =>
        toToolResult(() => handleGetReconciliationSummary(context, input)),
    }),

    [AgentToolName.getLedgerAudit]: tool({
      description:
        "Consulta la bitácora inmutable de una solicitud de pago y verifica la integridad de la cadena de hashes SHA-256. Úsala para auditoría y trazabilidad.",
      inputSchema: GetLedgerAuditInputSchema,
      execute: (input) =>
        toToolResult(() => handleGetLedgerAudit(context, input)),
    }),
  };
}

export type AgentTools = ReturnType<typeof createAgentTools>;
