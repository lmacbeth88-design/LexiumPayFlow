import type {
  CancelPaymentRequestOutput,
  CreateBulkPaymentRequestsOutput,
  CreatePaymentRequestOutput,
  GetLedgerAuditOutput,
  GetPaymentStatusOutput,
  GetReconciliationSummaryOutput,
  GetStudentAccountOutput,
  ListPendingPaymentsOutput,
  SearchStudentsOutput,
  SendPaymentRemindersOutput,
} from "../agent/tools";
import type { IsoDate, PaymentRequestId, Period, StudentId } from "../core/common";
import type { PaymentConcept, PaymentMethod } from "../core/payment";

export interface SearchStudentsQuery {
  schoolId: string;
  query: string;
  limit?: number;
}

export interface GetStudentAccountQuery {
  schoolId: string;
  studentId: string;
}

export interface ListPendingPaymentsQuery {
  schoolId: string;
  concept?: PaymentConcept;
  dueBefore?: IsoDate;
  limit?: number;
}

export interface CreatePaymentRequestCommand {
  schoolId: string;
  studentId: StudentId;
  concept: PaymentConcept;
  amountCents: number;
  description?: string;
  dueDate: IsoDate;
  method?: PaymentMethod;
}

export interface CreateBulkPaymentRequestsCommand {
  schoolId: string;
  studentIds: StudentId[];
  concept: PaymentConcept;
  amountCents?: number;
  description?: string;
  dueDate: IsoDate;
  method?: PaymentMethod;
}

export interface GetPaymentStatusQuery {
  schoolId: string;
  paymentRequestId?: PaymentRequestId;
  reference?: string;
}

export interface SendPaymentRemindersCommand {
  schoolId: string;
  paymentRequestIds: PaymentRequestId[];
  channel?: "whatsapp" | "sms" | "email";
  message?: string;
}

export interface CancelPaymentRequestCommand {
  schoolId: string;
  paymentRequestId: PaymentRequestId;
  reason: string;
}

export interface GetReconciliationSummaryQuery {
  schoolId: string;
  from: IsoDate;
  to: IsoDate;
}

export interface GetLedgerAuditQuery {
  schoolId: string;
  paymentRequestId: PaymentRequestId;
}

export interface CoreBackendPort {
  searchStudents(query: SearchStudentsQuery): Promise<SearchStudentsOutput>;
  getStudentAccount(
    query: GetStudentAccountQuery,
  ): Promise<GetStudentAccountOutput>;
  listPendingPayments(
    query: ListPendingPaymentsQuery,
  ): Promise<ListPendingPaymentsOutput>;
  createPaymentRequest(
    command: CreatePaymentRequestCommand,
  ): Promise<CreatePaymentRequestOutput>;
  createBulkPaymentRequests(
    command: CreateBulkPaymentRequestsCommand,
  ): Promise<CreateBulkPaymentRequestsOutput>;
  getPaymentStatus(
    query: GetPaymentStatusQuery,
  ): Promise<GetPaymentStatusOutput>;
  sendPaymentReminders(
    command: SendPaymentRemindersCommand,
  ): Promise<SendPaymentRemindersOutput>;
  cancelPaymentRequest(
    command: CancelPaymentRequestCommand,
  ): Promise<CancelPaymentRequestOutput>;
  getReconciliationSummary(
    query: GetReconciliationSummaryQuery,
  ): Promise<GetReconciliationSummaryOutput>;
  getLedgerAudit(query: GetLedgerAuditQuery): Promise<GetLedgerAuditOutput>;
}

export interface BillingPeriod {
  period: Period;
  from: IsoDate;
  to: IsoDate;
}
