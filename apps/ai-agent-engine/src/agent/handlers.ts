import {
  DomainError,
  type CancelPaymentRequestInput,
  type CancelPaymentRequestOutput,
  type CoreBackendPort,
  type CreateBulkPaymentRequestsInput,
  type CreateBulkPaymentRequestsOutput,
  type CreatePaymentRequestInput,
  type CreatePaymentRequestOutput,
  type GetLedgerAuditInput,
  type GetLedgerAuditOutput,
  type GetPaymentStatusInput,
  type GetPaymentStatusOutput,
  type GetReconciliationSummaryInput,
  type GetReconciliationSummaryOutput,
  type GetStudentAccountInput,
  type GetStudentAccountOutput,
  type ListPendingPaymentsInput,
  type ListPendingPaymentsOutput,
  type SearchStudentsInput,
  type SearchStudentsOutput,
  type SendPaymentRemindersInput,
  type SendPaymentRemindersOutput,
} from "@lexium/shared-contracts";
import {
  assertBulkAmount,
  assertBulkSize,
  assertCancellationReason,
  assertSingleAmount,
  defaultAgentPolicy,
  type AgentPolicy,
} from "./policy";

export interface AgentContext {
  backend: CoreBackendPort;
  schoolId: string;
  schoolName?: string;
  now?: Date;
  policy?: AgentPolicy;
}

function policyOf(context: AgentContext): AgentPolicy {
  return context.policy ?? defaultAgentPolicy;
}

function resolveSchoolId(
  context: AgentContext,
  requestedSchoolId: string | undefined,
): string {
  if (requestedSchoolId && requestedSchoolId !== context.schoolId) {
    throw new DomainError(
      "POLICY_VIOLATION",
      "El agente no puede operar sobre una escuela distinta a la del contexto autorizado.",
    );
  }
  return context.schoolId;
}

export async function handleSearchStudents(
  context: AgentContext,
  input: SearchStudentsInput,
): Promise<SearchStudentsOutput> {
  return context.backend.searchStudents({
    schoolId: resolveSchoolId(context, input.schoolId),
    query: input.query,
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  });
}

export async function handleGetStudentAccount(
  context: AgentContext,
  input: GetStudentAccountInput,
): Promise<GetStudentAccountOutput> {
  return context.backend.getStudentAccount({
    schoolId: resolveSchoolId(context, input.schoolId),
    studentId: input.studentId,
  });
}

export async function handleListPendingPayments(
  context: AgentContext,
  input: ListPendingPaymentsInput,
): Promise<ListPendingPaymentsOutput> {
  return context.backend.listPendingPayments({
    schoolId: resolveSchoolId(context, input.schoolId),
    ...(input.concept !== undefined ? { concept: input.concept } : {}),
    ...(input.dueBefore !== undefined ? { dueBefore: input.dueBefore } : {}),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  });
}

export async function handleCreatePaymentRequest(
  context: AgentContext,
  input: CreatePaymentRequestInput,
): Promise<CreatePaymentRequestOutput> {
  assertSingleAmount(policyOf(context), input.amountCents);

  return context.backend.createPaymentRequest({
    schoolId: resolveSchoolId(context, input.schoolId),
    studentId: input.studentId,
    concept: input.concept,
    amountCents: input.amountCents,
    dueDate: input.dueDate,
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.method !== undefined ? { method: input.method } : {}),
  });
}

export async function handleCreateBulkPaymentRequests(
  context: AgentContext,
  input: CreateBulkPaymentRequestsInput,
): Promise<CreateBulkPaymentRequestsOutput> {
  const policy = policyOf(context);
  const schoolId = resolveSchoolId(context, input.schoolId);
  assertBulkSize(policy, input.studentIds.length);

  const period = input.dueDate.slice(0, 7);
  let estimatedAmountCents = 0;

  if (input.amountCents !== undefined) {
    estimatedAmountCents = input.amountCents * input.studentIds.length;
  } else {
    const accounts = await Promise.all(
      input.studentIds.map(async (studentId) => {
        try {
          return await context.backend.getStudentAccount({
            schoolId,
            studentId,
          });
        } catch {
          return null;
        }
      }),
    );

    for (const account of accounts) {
      if (!account) {
        continue;
      }
      estimatedAmountCents += account.balances
        .filter(
          (balance) =>
            balance.concept === input.concept &&
            balance.period === period &&
            balance.status !== "paid",
        )
        .reduce(
          (total, balance) =>
            total +
            Math.max(0, balance.amountDueCents - balance.amountPaidCents),
          0,
        );
    }
  }

  assertBulkAmount(policy, estimatedAmountCents);

  return context.backend.createBulkPaymentRequests({
    schoolId,
    studentIds: input.studentIds,
    concept: input.concept,
    dueDate: input.dueDate,
    ...(input.amountCents !== undefined
      ? { amountCents: input.amountCents }
      : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.method !== undefined ? { method: input.method } : {}),
  });
}

export async function handleGetPaymentStatus(
  context: AgentContext,
  input: GetPaymentStatusInput,
): Promise<GetPaymentStatusOutput> {
  if (!input.paymentRequestId && !input.reference) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Proporciona el identificador de la solicitud o su referencia CoDi/SPEI.",
    );
  }

  return context.backend.getPaymentStatus({
    schoolId: resolveSchoolId(context, input.schoolId),
    ...(input.paymentRequestId !== undefined
      ? { paymentRequestId: input.paymentRequestId }
      : {}),
    ...(input.reference !== undefined ? { reference: input.reference } : {}),
  });
}

export async function handleSendPaymentReminders(
  context: AgentContext,
  input: SendPaymentRemindersInput,
): Promise<SendPaymentRemindersOutput> {
  return context.backend.sendPaymentReminders({
    schoolId: resolveSchoolId(context, input.schoolId),
    paymentRequestIds: input.paymentRequestIds,
    ...(input.channel !== undefined ? { channel: input.channel } : {}),
    ...(input.message !== undefined ? { message: input.message } : {}),
  });
}

export async function handleCancelPaymentRequest(
  context: AgentContext,
  input: CancelPaymentRequestInput,
): Promise<CancelPaymentRequestOutput> {
  assertCancellationReason(policyOf(context), input.reason);

  return context.backend.cancelPaymentRequest({
    schoolId: resolveSchoolId(context, input.schoolId),
    paymentRequestId: input.paymentRequestId,
    reason: input.reason,
  });
}

export async function handleGetReconciliationSummary(
  context: AgentContext,
  input: GetReconciliationSummaryInput,
): Promise<GetReconciliationSummaryOutput> {
  if (input.from > input.to) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "La fecha inicial no puede ser posterior a la fecha final.",
    );
  }

  return context.backend.getReconciliationSummary({
    schoolId: resolveSchoolId(context, input.schoolId),
    from: input.from,
    to: input.to,
  });
}

export async function handleGetLedgerAudit(
  context: AgentContext,
  input: GetLedgerAuditInput,
): Promise<GetLedgerAuditOutput> {
  return context.backend.getLedgerAudit({
    schoolId: resolveSchoolId(context, input.schoolId),
    paymentRequestId: input.paymentRequestId,
  });
}
