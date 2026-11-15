import { z } from "zod";
import {
  CurrencySchema,
  IsoDateSchema,
  PaymentRequestIdSchema,
  PositiveAmountCentsSchema,
  SchoolIdSchema,
  StudentIdSchema,
} from "../core/common";
import { BalanceSchema } from "../core/balance";
import { DomainErrorCodeSchema } from "../core/errors";
import { LedgerEntrySchema } from "../core/ledger";
import {
  PaymentConceptSchema,
  PaymentMethodSchema,
  PaymentRequestSchema,
  PaymentRequestStatusSchema,
  PaymentTransactionSchema,
} from "../core/payment";
import { ReceiptSchema } from "../core/receipt";
import { GuardianSchema, StudentSummarySchema } from "../core/student";

export const AgentToolName = {
  searchStudents: "search_students",
  getStudentAccount: "get_student_account",
  listPendingPayments: "list_pending_payments",
  createPaymentRequest: "create_payment_request",
  createBulkPaymentRequests: "create_bulk_payment_requests",
  getPaymentStatus: "get_payment_status",
  sendPaymentReminders: "send_payment_reminders",
  cancelPaymentRequest: "cancel_payment_request",
  getReconciliationSummary: "get_reconciliation_summary",
  getLedgerAudit: "get_ledger_audit",
} as const;

export type AgentToolName =
  (typeof AgentToolName)[keyof typeof AgentToolName];

const SchoolIdOverrideSchema = SchoolIdSchema.optional().describe(
  "Opcional. Solo debe usarse si el contexto ya autorizó otra escuela.",
);

export const SearchStudentsInputSchema = z.object({
  query: z
    .string()
    .min(2)
    .describe("Nombre, apellido o matrícula del alumno a buscar."),
  limit: z.number().int().min(1).max(25).optional(),
  schoolId: SchoolIdOverrideSchema,
});

export const GetStudentAccountInputSchema = z.object({
  studentId: StudentIdSchema,
  schoolId: SchoolIdOverrideSchema,
});

export const ListPendingPaymentsInputSchema = z.object({
  concept: PaymentConceptSchema.optional(),
  dueBefore: IsoDateSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
  schoolId: SchoolIdOverrideSchema,
});

export const CreatePaymentRequestInputSchema = z.object({
  studentId: StudentIdSchema,
  concept: PaymentConceptSchema,
  amountCents: PositiveAmountCentsSchema,
  description: z.string().min(1).max(200).optional(),
  dueDate: IsoDateSchema,
  method: PaymentMethodSchema.optional().describe(
    "Método de pago. Por defecto CoDi.",
  ),
  schoolId: SchoolIdOverrideSchema,
});

export const CreateBulkPaymentRequestsInputSchema = z.object({
  studentIds: z.array(StudentIdSchema).min(1).max(200),
  concept: PaymentConceptSchema,
  amountCents: PositiveAmountCentsSchema.optional().describe(
    "Si se omite, se usa el saldo pendiente de cada alumno para el concepto y periodo.",
  ),
  description: z.string().min(1).max(200).optional(),
  dueDate: IsoDateSchema,
  method: PaymentMethodSchema.optional(),
  schoolId: SchoolIdOverrideSchema,
});

export const GetPaymentStatusInputSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema.optional(),
  reference: z
    .string()
    .min(4)
    .optional()
    .describe("Referencia CoDi/SPEI impresa o compartida al padre de familia."),
  schoolId: SchoolIdOverrideSchema,
});

export const ReminderChannelSchema = z.enum(["whatsapp", "sms", "email"]);

export const SendPaymentRemindersInputSchema = z.object({
  paymentRequestIds: z.array(PaymentRequestIdSchema).min(1).max(200),
  channel: ReminderChannelSchema.optional(),
  message: z.string().min(1).max(500).optional(),
  schoolId: SchoolIdOverrideSchema,
});

export const CancelPaymentRequestInputSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema,
  reason: z.string().min(5).max(280),
  schoolId: SchoolIdOverrideSchema,
});

export const GetReconciliationSummaryInputSchema = z.object({
  from: IsoDateSchema,
  to: IsoDateSchema,
  schoolId: SchoolIdOverrideSchema,
});

export const GetLedgerAuditInputSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema,
  schoolId: SchoolIdOverrideSchema,
});

export type SearchStudentsInput = z.infer<typeof SearchStudentsInputSchema>;
export type GetStudentAccountInput = z.infer<
  typeof GetStudentAccountInputSchema
>;
export type ListPendingPaymentsInput = z.infer<
  typeof ListPendingPaymentsInputSchema
>;
export type CreatePaymentRequestInput = z.infer<
  typeof CreatePaymentRequestInputSchema
>;
export type CreateBulkPaymentRequestsInput = z.infer<
  typeof CreateBulkPaymentRequestsInputSchema
>;
export type GetPaymentStatusInput = z.infer<
  typeof GetPaymentStatusInputSchema
>;
export type ReminderChannel = z.infer<typeof ReminderChannelSchema>;
export type SendPaymentRemindersInput = z.infer<
  typeof SendPaymentRemindersInputSchema
>;
export type CancelPaymentRequestInput = z.infer<
  typeof CancelPaymentRequestInputSchema
>;
export type GetReconciliationSummaryInput = z.infer<
  typeof GetReconciliationSummaryInputSchema
>;
export type GetLedgerAuditInput = z.infer<typeof GetLedgerAuditInputSchema>;

export const SearchStudentsOutputSchema = z.object({
  students: z.array(StudentSummarySchema),
  totalMatches: z.number().int().nonnegative(),
});

export type SearchStudentsOutput = z.infer<
  typeof SearchStudentsOutputSchema
>;

export const GetStudentAccountOutputSchema = z.object({
  student: StudentSummarySchema,
  guardian: GuardianSchema.nullable(),
  balances: z.array(BalanceSchema),
  totals: z.object({
    dueCents: z.number().int().nonnegative(),
    paidCents: z.number().int().nonnegative(),
    overdueCents: z.number().int().nonnegative(),
  }),
});

export type GetStudentAccountOutput = z.infer<
  typeof GetStudentAccountOutputSchema
>;

export const PendingPaymentItemSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema,
  studentId: StudentIdSchema,
  studentName: z.string().min(1),
  concept: PaymentConceptSchema,
  description: z.string().min(1),
  amountCents: PositiveAmountCentsSchema,
  currency: CurrencySchema,
  status: PaymentRequestStatusSchema,
  dueDate: IsoDateSchema,
  reference: z.string().min(4),
});

export type PendingPaymentItem = z.infer<typeof PendingPaymentItemSchema>;

export const ListPendingPaymentsOutputSchema = z.object({
  items: z.array(PendingPaymentItemSchema),
  totalDueCents: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

export type ListPendingPaymentsOutput = z.infer<
  typeof ListPendingPaymentsOutputSchema
>;

export const CreatePaymentRequestOutputSchema = z.object({
  paymentRequest: PaymentRequestSchema,
});

export type CreatePaymentRequestOutput = z.infer<
  typeof CreatePaymentRequestOutputSchema
>;

export const SkippedStudentSchema = z.object({
  studentId: StudentIdSchema,
  studentName: z.string().optional(),
  reason: z.string().min(1),
});

export type SkippedStudent = z.infer<typeof SkippedStudentSchema>;

export const CreateBulkPaymentRequestsOutputSchema = z.object({
  created: z.array(PaymentRequestSchema),
  skipped: z.array(SkippedStudentSchema),
  totals: z.object({
    count: z.number().int().nonnegative(),
    amountCents: z.number().int().nonnegative(),
  }),
});

export type CreateBulkPaymentRequestsOutput = z.infer<
  typeof CreateBulkPaymentRequestsOutputSchema
>;

export const GetPaymentStatusOutputSchema = z.object({
  paymentRequest: PaymentRequestSchema,
  studentName: z.string().min(1),
  transactions: z.array(PaymentTransactionSchema),
  receipt: ReceiptSchema.nullable(),
  ledger: z.object({
    chainValid: z.boolean(),
    entries: z.number().int().nonnegative(),
  }),
});

export type GetPaymentStatusOutput = z.infer<
  typeof GetPaymentStatusOutputSchema
>;

export const SentReminderSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema,
  studentName: z.string().min(1),
  to: z.string().min(1),
  channel: ReminderChannelSchema,
});

export type SentReminder = z.infer<typeof SentReminderSchema>;

export const FailedReminderSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema,
  reason: z.string().min(1),
});

export type FailedReminder = z.infer<typeof FailedReminderSchema>;

export const SendPaymentRemindersOutputSchema = z.object({
  sent: z.array(SentReminderSchema),
  failed: z.array(FailedReminderSchema),
});

export type SendPaymentRemindersOutput = z.infer<
  typeof SendPaymentRemindersOutputSchema
>;

export const CancelPaymentRequestOutputSchema = z.object({
  paymentRequest: PaymentRequestSchema,
});

export type CancelPaymentRequestOutput = z.infer<
  typeof CancelPaymentRequestOutputSchema
>;

export const ReconciliationTotalsSchema = z.object({
  expectedCents: z.number().int().nonnegative(),
  collectedCents: z.number().int().nonnegative(),
  pendingCents: z.number().int().nonnegative(),
  unmatchedCents: z.number().int().nonnegative(),
});

export const GetReconciliationSummaryOutputSchema = z.object({
  schoolId: SchoolIdSchema,
  period: z.object({
    from: IsoDateSchema,
    to: IsoDateSchema,
  }),
  totals: ReconciliationTotalsSchema,
  counts: z.object({
    totalRequests: z.number().int().nonnegative(),
    paid: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    expired: z.number().int().nonnegative(),
    cancelled: z.number().int().nonnegative(),
    transactions: z.number().int().nonnegative(),
    unmatchedTransactions: z.number().int().nonnegative(),
  }),
  unmatchedTransactions: z.array(PaymentTransactionSchema),
});

export type GetReconciliationSummaryOutput = z.infer<
  typeof GetReconciliationSummaryOutputSchema
>;

export const GetLedgerAuditOutputSchema = z.object({
  paymentRequestId: PaymentRequestIdSchema,
  entries: z.array(LedgerEntrySchema),
  chainValid: z.boolean(),
  checkedEntries: z.number().int().nonnegative(),
});

export type GetLedgerAuditOutput = z.infer<
  typeof GetLedgerAuditOutputSchema
>;

export const ToolErrorSchema = z.object({
  code: DomainErrorCodeSchema,
  message: z.string().min(1),
  details: z.unknown().optional(),
});

export type ToolError = z.infer<typeof ToolErrorSchema>;

export type AgentToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ToolError };
