import {
  DomainError,
  type Balance,
  type CancelPaymentRequestCommand,
  type CancelPaymentRequestOutput,
  type CoreBackendPort,
  type CreateBulkPaymentRequestsCommand,
  type CreateBulkPaymentRequestsOutput,
  type CreatePaymentRequestCommand,
  type CreatePaymentRequestOutput,
  type FailedReminder,
  type GetLedgerAuditOutput,
  type GetLedgerAuditQuery,
  type GetPaymentStatusOutput,
  type GetPaymentStatusQuery,
  type GetReconciliationSummaryOutput,
  type GetReconciliationSummaryQuery,
  type GetStudentAccountOutput,
  type GetStudentAccountQuery,
  type Guardian,
  type LedgerEntry,
  type ListPendingPaymentsOutput,
  type ListPendingPaymentsQuery,
  type PaymentConcept,
  type PaymentRequest,
  type PaymentTransaction,
  type Receipt,
  type School,
  type SearchStudentsOutput,
  type SearchStudentsQuery,
  type SendPaymentRemindersCommand,
  type SendPaymentRemindersOutput,
  type SentReminder,
  type SkippedStudent,
  type Student,
  type StudentSummary,
} from "@lexium/shared-contracts";
import {
  buildMockFixtures,
  CONCEPT_LABEL,
  type MockFixtures,
} from "./fixtures";
import { LedgerChain } from "./ledger";

const DAY_MS = 86_400_000;

export interface MockCoreBackendOptions {
  now?: Date;
  fixtures?: MockFixtures;
}

export interface SimulatePaymentOptions {
  bankReference?: string;
  payerName?: string;
  paidAt?: Date;
}

export interface SimulatedPayment {
  paymentRequest: PaymentRequest;
  transaction: PaymentTransaction;
  receipt: Receipt;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function datePart(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function isActive(request: PaymentRequest): boolean {
  return request.status === "pending" || request.status === "sent";
}

function remainingOf(balance: Balance): number {
  return Math.max(0, balance.amountDueCents - balance.amountPaidCents);
}

export class MockCoreBackend implements CoreBackendPort {
  private readonly now: Date;
  private readonly school: School;
  private readonly guardians = new Map<string, Guardian>();
  private readonly students = new Map<string, Student>();
  private readonly balances: Balance[];
  private readonly requests = new Map<string, PaymentRequest>();
  private readonly transactions: PaymentTransaction[];
  private readonly receiptsByRequestId = new Map<string, Receipt>();
  private readonly ledger: LedgerChain;
  private sequence = 1_000;

  constructor(options: MockCoreBackendOptions = {}) {
    this.now = options.now ?? new Date();
    const fixtures = options.fixtures ?? buildMockFixtures(this.now);

    this.school = fixtures.school;
    this.balances = fixtures.balances.map((balance) => ({ ...balance }));
    this.transactions = fixtures.transactions.map((transaction) => ({
      ...transaction,
    }));

    for (const guardian of fixtures.guardians) {
      this.guardians.set(guardian.id, guardian);
    }
    for (const student of fixtures.students) {
      this.students.set(student.id, student);
    }
    for (const request of fixtures.paymentRequests) {
      this.requests.set(request.id, request);
    }
    for (const receipt of fixtures.receipts) {
      this.receiptsByRequestId.set(receipt.paymentRequestId, receipt);
    }

    this.ledger = new LedgerChain();
    for (const entry of fixtures.ledger) {
      this.ledger.append(
        entry.type,
        entry.paymentRequestId,
        entry.payload,
        entry.createdAt,
      );
    }
  }

  getSchool(): School {
    return this.school;
  }

  getLedger(): LedgerEntry[] {
    return this.ledger.all();
  }

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  getBalances(): Balance[] {
    return this.balances.map((balance) => ({ ...balance }));
  }

  getPaymentRequest(paymentRequestId: string): PaymentRequest | undefined {
    return this.requests.get(paymentRequestId);
  }

  async searchStudents(
    query: SearchStudentsQuery,
  ): Promise<SearchStudentsOutput> {
    this.ensureSchool(query.schoolId);
    const needle = normalizeText(query.query);
    const limit = query.limit ?? 10;

    const matches = [...this.students.values()]
      .filter(
        (student) =>
          normalizeText(student.fullName).includes(needle) ||
          normalizeText(student.id).includes(needle),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));

    return {
      students: matches
        .slice(0, limit)
        .map((student) => this.buildStudentSummary(student)),
      totalMatches: matches.length,
    };
  }

  async getStudentAccount(
    query: GetStudentAccountQuery,
  ): Promise<GetStudentAccountOutput> {
    this.ensureSchool(query.schoolId);
    const student = this.getStudent(query.studentId);
    const guardian = this.getPrimaryGuardian(student) ?? null;
    const balances = this.balances
      .filter((balance) => balance.studentId === student.id)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const today = this.now.toISOString().slice(0, 10);
    const dueCents = balances.reduce(
      (total, balance) =>
        balance.status === "paid" ? total : total + remainingOf(balance),
      0,
    );
    const paidCents = balances.reduce(
      (total, balance) => total + balance.amountPaidCents,
      0,
    );
    const overdueCents = balances.reduce(
      (total, balance) =>
        balance.status !== "paid" && balance.dueDate < today
          ? total + remainingOf(balance)
          : total,
      0,
    );

    return {
      student: this.buildStudentSummary(student),
      guardian,
      balances,
      totals: { dueCents, paidCents, overdueCents },
    };
  }

  async listPendingPayments(
    query: ListPendingPaymentsQuery,
  ): Promise<ListPendingPaymentsOutput> {
    this.ensureSchool(query.schoolId);
    const limit = query.limit ?? 50;

    const matches = [...this.requests.values()]
      .filter((request) => isActive(request))
      .filter((request) =>
        query.concept ? request.concept === query.concept : true,
      )
      .filter((request) =>
        query.dueBefore ? request.dueDate <= query.dueBefore : true,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      items: matches.slice(0, limit).map((request) => ({
        paymentRequestId: request.id,
        studentId: request.studentId,
        studentName: this.studentName(request.studentId),
        concept: request.concept,
        description: request.description,
        amountCents: request.amountCents,
        currency: request.currency,
        status: request.status,
        dueDate: request.dueDate,
        reference: request.reference,
      })),
      totalDueCents: matches.reduce(
        (total, request) => total + request.amountCents,
        0,
      ),
      count: matches.length,
    };
  }

  async createPaymentRequest(
    command: CreatePaymentRequestCommand,
  ): Promise<CreatePaymentRequestOutput> {
    this.ensureSchool(command.schoolId);
    const request = this.createRequest(command);
    return { paymentRequest: request };
  }

  async createBulkPaymentRequests(
    command: CreateBulkPaymentRequestsCommand,
  ): Promise<CreateBulkPaymentRequestsOutput> {
    this.ensureSchool(command.schoolId);
    const created: PaymentRequest[] = [];
    const skipped: SkippedStudent[] = [];
    const period = command.dueDate.slice(0, 7);

    for (const studentId of command.studentIds) {
      const student = this.students.get(studentId);

      if (!student) {
        skipped.push({
          studentId,
          reason: "Alumno no encontrado en la escuela.",
        });
        continue;
      }

      const activeRequest = [...this.requests.values()].find(
        (request) =>
          request.studentId === studentId &&
          request.concept === command.concept &&
          request.period === period &&
          isActive(request),
      );

      if (activeRequest) {
        skipped.push({
          studentId,
          studentName: student.fullName,
          reason: `Ya existe una solicitud activa (${activeRequest.reference}) para ${CONCEPT_LABEL[command.concept]} ${period}.`,
        });
        continue;
      }

      let amountCents = command.amountCents;
      if (amountCents === undefined) {
        const balance = this.findBalance(studentId, command.concept, period);
        if (!balance || remainingOf(balance) <= 0) {
          skipped.push({
            studentId,
            studentName: student.fullName,
            reason: `Sin saldo pendiente de ${CONCEPT_LABEL[command.concept]} para ${period}.`,
          });
          continue;
        }
        amountCents = remainingOf(balance);
      }

      try {
        const request = this.createRequest({
          schoolId: command.schoolId,
          studentId,
          concept: command.concept,
          amountCents,
          ...(command.description ? { description: command.description } : {}),
          dueDate: command.dueDate,
          ...(command.method ? { method: command.method } : {}),
        });
        created.push(request);
      } catch (error) {
        if (error instanceof DomainError) {
          skipped.push({
            studentId,
            studentName: student.fullName,
            reason: error.message,
          });
          continue;
        }
        throw error;
      }
    }

    return {
      created,
      skipped,
      totals: {
        count: created.length,
        amountCents: created.reduce(
          (total, request) => total + request.amountCents,
          0,
        ),
      },
    };
  }

  async getPaymentStatus(
    query: GetPaymentStatusQuery,
  ): Promise<GetPaymentStatusOutput> {
    this.ensureSchool(query.schoolId);
    const request = this.findRequest(query);

    if (!request) {
      throw new DomainError(
        "NOT_FOUND",
        "No se encontró una solicitud de pago con esos datos.",
      );
    }

    const entries = this.ledger
      .all()
      .filter((entry) => entry.paymentRequestId === request.id);

    return {
      paymentRequest: request,
      studentName: this.studentName(request.studentId),
      transactions: this.transactions
        .filter((transaction) => transaction.paymentRequestId === request.id)
        .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt)),
      receipt: this.receiptsByRequestId.get(request.id) ?? null,
      ledger: {
        chainValid: this.ledger.verify(),
        entries: entries.length,
      },
    };
  }

  async sendPaymentReminders(
    command: SendPaymentRemindersCommand,
  ): Promise<SendPaymentRemindersOutput> {
    this.ensureSchool(command.schoolId);
    const channel = command.channel ?? "whatsapp";
    const sent: SentReminder[] = [];
    const failed: FailedReminder[] = [];
    const nowIso = this.now.toISOString();

    for (const paymentRequestId of command.paymentRequestIds) {
      const request = this.requests.get(paymentRequestId);

      if (!request || request.schoolId !== command.schoolId) {
        failed.push({
          paymentRequestId,
          reason: "Solicitud de pago no encontrada.",
        });
        continue;
      }

      if (!isActive(request)) {
        failed.push({
          paymentRequestId,
          reason: `La solicitud está en estado ${request.status} y ya no admite recordatorios.`,
        });
        continue;
      }

      const student = this.students.get(request.studentId);
      const guardian = student ? this.getPrimaryGuardian(student) : undefined;
      const destination =
        channel === "email" ? guardian?.email : guardian?.phone;

      if (!student || !guardian || !destination) {
        failed.push({
          paymentRequestId,
          reason: `El tutor no tiene ${channel === "email" ? "correo" : "teléfono"} registrado para el canal ${channel}.`,
        });
        continue;
      }

      const updated: PaymentRequest = {
        ...request,
        status: "sent",
        updatedAt: nowIso,
      };
      this.requests.set(paymentRequestId, updated);
      this.ledger.append(
        "reminder.sent",
        paymentRequestId,
        {
          channel,
          to: destination,
          message: command.message ?? null,
        },
        nowIso,
      );

      sent.push({
        paymentRequestId,
        studentName: student.fullName,
        to: destination,
        channel,
      });
    }

    return { sent, failed };
  }

  async cancelPaymentRequest(
    command: CancelPaymentRequestCommand,
  ): Promise<CancelPaymentRequestOutput> {
    this.ensureSchool(command.schoolId);
    const request = this.requests.get(command.paymentRequestId);

    if (!request || request.schoolId !== command.schoolId) {
      throw new DomainError(
        "NOT_FOUND",
        "Solicitud de pago no encontrada.",
      );
    }

    if (!isActive(request)) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        `Solo se pueden cancelar solicitudes pendientes o enviadas. Estado actual: ${request.status}.`,
      );
    }

    const nowIso = this.now.toISOString();
    const updated: PaymentRequest = {
      ...request,
      status: "cancelled",
      cancelledAt: nowIso,
      cancellationReason: command.reason,
      updatedAt: nowIso,
    };
    this.requests.set(updated.id, updated);
    this.ledger.append(
      "payment_request.cancelled",
      updated.id,
      { reason: command.reason },
      nowIso,
    );

    return { paymentRequest: updated };
  }

  async getReconciliationSummary(
    query: GetReconciliationSummaryQuery,
  ): Promise<GetReconciliationSummaryOutput> {
    this.ensureSchool(query.schoolId);

    if (query.from > query.to) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "La fecha inicial no puede ser posterior a la fecha final.",
      );
    }

    const requestsInRange = [...this.requests.values()].filter(
      (request) =>
        request.schoolId === query.schoolId &&
        request.dueDate >= query.from &&
        request.dueDate <= query.to,
    );
    const activeRequests = requestsInRange.filter(
      (request) => request.status !== "cancelled",
    );

    const transactionsInRange = this.transactions.filter(
      (transaction) =>
        transaction.schoolId === query.schoolId &&
        datePart(transaction.receivedAt) >= query.from &&
        datePart(transaction.receivedAt) <= query.to,
    );
    const unmatchedTransactions = transactionsInRange.filter(
      (transaction) => !transaction.reconciled,
    );

    return {
      schoolId: query.schoolId,
      period: { from: query.from, to: query.to },
      totals: {
        expectedCents: activeRequests.reduce(
          (total, request) => total + request.amountCents,
          0,
        ),
        collectedCents: transactionsInRange
          .filter(
            (transaction) =>
              transaction.status === "confirmed" && transaction.reconciled,
          )
          .reduce((total, transaction) => total + transaction.amountCents, 0),
        pendingCents: activeRequests
          .filter((request) => isActive(request))
          .reduce((total, request) => total + request.amountCents, 0),
        unmatchedCents: unmatchedTransactions.reduce(
          (total, transaction) => total + transaction.amountCents,
          0,
        ),
      },
      counts: {
        totalRequests: requestsInRange.length,
        paid: requestsInRange.filter((request) => request.status === "paid")
          .length,
        pending: requestsInRange.filter((request) => isActive(request)).length,
        expired: requestsInRange.filter(
          (request) => request.status === "expired",
        ).length,
        cancelled: requestsInRange.filter(
          (request) => request.status === "cancelled",
        ).length,
        transactions: transactionsInRange.length,
        unmatchedTransactions: unmatchedTransactions.length,
      },
      unmatchedTransactions,
    };
  }

  async getLedgerAudit(
    query: GetLedgerAuditQuery,
  ): Promise<GetLedgerAuditOutput> {
    this.ensureSchool(query.schoolId);
    const request = this.requests.get(query.paymentRequestId);

    if (!request || request.schoolId !== query.schoolId) {
      throw new DomainError(
        "NOT_FOUND",
        "Solicitud de pago no encontrada.",
      );
    }

    return {
      paymentRequestId: request.id,
      entries: this.ledger
        .all()
        .filter((entry) => entry.paymentRequestId === request.id),
      chainValid: this.ledger.verify(),
      checkedEntries: this.ledger.size(),
    };
  }

  simulatePayment(
    paymentRequestId: string,
    options: SimulatePaymentOptions = {},
  ): SimulatedPayment {
    const request = this.requests.get(paymentRequestId);

    if (!request) {
      throw new DomainError("NOT_FOUND", "Solicitud de pago no encontrada.");
    }
    if (request.status === "paid") {
      throw new DomainError("CONFLICT", "La solicitud ya fue pagada.");
    }
    if (!isActive(request)) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        `No se puede pagar una solicitud en estado ${request.status}.`,
      );
    }

    const paidAt = options.paidAt ?? this.now;
    const paidAtIso = paidAt.toISOString();
    const student = this.getStudent(request.studentId);
    const guardian = this.getPrimaryGuardian(student);

    const updated: PaymentRequest = {
      ...request,
      status: "paid",
      paidAt: paidAtIso,
      updatedAt: paidAtIso,
    };
    this.requests.set(updated.id, updated);

    const transaction: PaymentTransaction = {
      id: this.nextId("txn"),
      paymentRequestId: updated.id,
      schoolId: updated.schoolId,
      amountCents: updated.amountCents,
      currency: updated.currency,
      method: updated.method,
      status: "confirmed",
      reconciled: true,
      bankReference:
        options.bankReference ?? `SPEI-MOCK-${this.sequence.toString(36).toUpperCase()}`,
      payerName: options.payerName ?? guardian?.fullName ?? null,
      paidAt: paidAtIso,
      receivedAt: paidAtIso,
      webhookEventId: this.nextId("evt"),
    };
    this.transactions.push(transaction);

    this.ledger.append(
      "webhook.received",
      updated.id,
      {
        amountCents: transaction.amountCents,
        bankReference: transaction.bankReference,
        reconciled: true,
      },
      paidAtIso,
    );
    this.ledger.append(
      "payment.confirmed",
      updated.id,
      {
        amountCents: transaction.amountCents,
        method: transaction.method,
      },
      paidAtIso,
    );

    const folio = `RC-${paidAt.getUTCFullYear()}-${this.sequence
      .toString()
      .padStart(4, "0")}`;
    const receiptEntry = this.ledger.append(
      "receipt.issued",
      updated.id,
      { amountCents: updated.amountCents, folio },
      paidAtIso,
    );
    const receipt: Receipt = {
      id: this.nextId("rcp"),
      paymentRequestId: updated.id,
      schoolId: updated.schoolId,
      studentId: updated.studentId,
      folio,
      amountCents: updated.amountCents,
      currency: updated.currency,
      issuedAt: paidAtIso,
      pdfUrl: `https://receipts.lexium.mx/mock/${updated.id}.pdf`,
      ledgerHash: receiptEntry.hash,
    };
    this.receiptsByRequestId.set(updated.id, receipt);

    const balanceIndex = this.balances.findIndex(
      (balance) =>
        balance.studentId === updated.studentId &&
        balance.concept === updated.concept &&
        balance.period === updated.period,
    );
    if (balanceIndex >= 0) {
      const balance = this.balances[balanceIndex]!;
      const amountPaidCents = Math.min(
        balance.amountDueCents,
        balance.amountPaidCents + updated.amountCents,
      );
      this.balances[balanceIndex] = {
        ...balance,
        amountPaidCents,
        status:
          amountPaidCents >= balance.amountDueCents ? "paid" : "partial",
      };
    }

    return { paymentRequest: updated, transaction, receipt };
  }

  private createRequest(
    command: CreatePaymentRequestCommand,
  ): PaymentRequest {
    const student = this.getStudent(command.studentId);
    const guardian = this.getPrimaryGuardian(student);

    if (!guardian) {
      throw new DomainError(
        "CONFLICT",
        "El alumno no tiene un tutor registrado para recibir la solicitud de pago.",
      );
    }

    const period = command.dueDate.slice(0, 7);
    const id = this.nextId("pay");
    const reference = `CODI-${this.sequence.toString(36).toUpperCase()}`;
    const nowIso = this.now.toISOString();

    const request: PaymentRequest = {
      id,
      schoolId: command.schoolId,
      studentId: student.id,
      payerId: guardian.id,
      concept: command.concept,
      period,
      description:
        command.description ?? `${CONCEPT_LABEL[command.concept]} ${period}`,
      amountCents: command.amountCents,
      currency: "MXN",
      status: "pending",
      method: command.method ?? "codi",
      reference,
      codiQrPayload: `00020101021238570010CODI.${reference}530303905802MX5913LEXIUM PAYFLOW6006CDMX6304DEMO`,
      paymentUrl: `https://pay.lexium.mx/mock/${id}`,
      dueDate: command.dueDate,
      expiresAt: addDays(this.now, 15).toISOString(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.requests.set(id, request);
    this.ledger.append(
      "payment_request.created",
      id,
      {
        amountCents: request.amountCents,
        concept: request.concept,
        reference: request.reference,
        studentId: request.studentId,
      },
      nowIso,
    );

    return request;
  }

  private findBalance(
    studentId: string,
    concept: PaymentConcept,
    period: string,
  ): Balance | undefined {
    return this.balances.find(
      (balance) =>
        balance.studentId === studentId &&
        balance.concept === concept &&
        balance.period === period &&
        balance.status !== "paid",
    );
  }

  private findRequest(query: GetPaymentStatusQuery): PaymentRequest | undefined {
    if (!query.paymentRequestId && !query.reference) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Proporciona paymentRequestId o reference para consultar el estado.",
      );
    }
    if (query.paymentRequestId) {
      return this.requests.get(query.paymentRequestId);
    }
    return [...this.requests.values()].find(
      (request) => request.reference === query.reference,
    );
  }

  private ensureSchool(schoolId: string): void {
    if (schoolId !== this.school.id) {
      throw new DomainError(
        "NOT_FOUND",
        `Escuela ${schoolId} no encontrada en el backend simulado.`,
      );
    }
  }

  private getStudent(studentId: string): Student {
    const student = this.students.get(studentId);
    if (!student) {
      throw new DomainError("NOT_FOUND", "Alumno no encontrado.");
    }
    return student;
  }

  private getPrimaryGuardian(student: Student): Guardian | undefined {
    for (const guardianId of student.guardianIds) {
      const guardian = this.guardians.get(guardianId);
      if (guardian) {
        return guardian;
      }
    }
    return undefined;
  }

  private studentName(studentId: string): string {
    return this.students.get(studentId)?.fullName ?? "Alumno desconocido";
  }

  private buildStudentSummary(student: Student): StudentSummary {
    const guardian = this.getPrimaryGuardian(student);
    const balanceDueCents = this.balances
      .filter(
        (balance) =>
          balance.studentId === student.id && balance.status !== "paid",
      )
      .reduce((total, balance) => total + remainingOf(balance), 0);

    return {
      id: student.id,
      fullName: student.fullName,
      level: student.level,
      grade: student.grade,
      group: student.group,
      status: student.status,
      guardianName: guardian?.fullName ?? null,
      guardianPhone: guardian?.phone ?? null,
      balanceDueCents,
    };
  }

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence.toString(36)}`;
  }
}
