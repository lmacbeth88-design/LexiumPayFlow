import type {
  Balance,
  DashboardData,
  Guardian,
  PaymentRequest,
  PaymentTransaction,
  Student,
  StudentSummary,
} from "@/lib/types";
import type { Tone } from "@/lib/labels";
import { formatMoney } from "@/lib/format";

export interface PaymentRow {
  request: PaymentRequest;
  student: Student;
  studentName: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
}

export interface TransactionRow {
  transaction: PaymentTransaction;
  studentName: string | null;
  requestReference: string | null;
}

export interface StudentAccount {
  summary: StudentSummary;
  guardian: Guardian | null;
  balances: Balance[];
  totals: {
    dueCents: number;
    paidCents: number;
    overdueCents: number;
  };
}

export interface DashboardMetrics {
  expectedCents: number;
  collectedCents: number;
  pendingCents: number;
  overdueCents: number;
  collectionRate: number;
  activeRequests: number;
  totalRequests: number;
  unmatchedTransactions: number;
  reconciliationRate: number;
  studentsWithDebt: number;
  overdueStudents: number;
  averageTicketCents: number;
}

export interface AlertItem {
  title: string;
  detail: string;
  tone: Tone;
  href: string;
}

function balanceDue(balance: Balance): number {
  return Math.max(0, balance.amountDueCents - balance.amountPaidCents);
}

function guardianMap(guardians: Guardian[]): Map<string, Guardian> {
  const map = new Map<string, Guardian>();
  for (const guardian of guardians) {
    for (const studentId of guardian.studentIds) {
      map.set(studentId, guardian);
    }
  }
  return map;
}

export function getStudentSummaries(data: DashboardData): StudentSummary[] {
  const studentsById = new Map(data.students.map((student) => [student.id, student]));
  const guardiansByStudent = guardianMap(data.guardians);
  const dueByStudent = new Map<string, number>();

  for (const balance of data.balances) {
    dueByStudent.set(
      balance.studentId,
      (dueByStudent.get(balance.studentId) ?? 0) + balanceDue(balance),
    );
  }

  return data.students.map((student) => {
    const guardian = guardiansByStudent.get(student.id) ?? null;
    return {
      id: student.id,
      fullName: student.fullName,
      level: student.level,
      grade: student.grade,
      group: student.group,
      status: student.status,
      guardianName: guardian?.fullName ?? null,
      guardianPhone: guardian?.phone ?? null,
      balanceDueCents: dueByStudent.get(student.id) ?? 0,
    };
  });
}

export function getPaymentRows(data: DashboardData): PaymentRow[] {
  const studentsById = new Map(data.students.map((student) => [student.id, student]));
  const guardiansByStudent = guardianMap(data.guardians);
  return data.paymentRequests
    .map((request) => {
      const student = studentsById.get(request.studentId);
      if (!student) {
        return null;
      }
      const guardian = guardiansByStudent.get(student.id) ?? null;
      return {
        request,
        student,
        studentName: student.fullName,
        guardianName: guardian?.fullName ?? null,
        guardianPhone: guardian?.phone ?? null,
        guardianEmail: guardian?.email ?? null,
      };
    })
    .filter((row): row is PaymentRow => row !== null)
    .sort((a, b) => b.request.createdAt.localeCompare(a.request.createdAt));
}

export function getTransactionRows(data: DashboardData): TransactionRow[] {
  const requestsById = new Map(
    data.paymentRequests.map((request) => [request.id, request]),
  );
  const studentsById = new Map(data.students.map((student) => [student.id, student]));
  return data.transactions
    .map((transaction) => {
      const request = transaction.paymentRequestId
        ? requestsById.get(transaction.paymentRequestId)
        : undefined;
      const student = request ? studentsById.get(request.studentId) : undefined;
      return {
        transaction,
        studentName: student?.fullName ?? null,
        requestReference: request?.reference ?? null,
      };
    })
    .sort((a, b) => b.transaction.receivedAt.localeCompare(a.transaction.receivedAt));
}

export function getStudentAccounts(data: DashboardData): StudentAccount[] {
  const summaries = getStudentSummaries(data);
  const guardiansByStudent = guardianMap(data.guardians);
  const balancesByStudent = new Map<string, Balance[]>();

  for (const balance of data.balances) {
    const list = balancesByStudent.get(balance.studentId) ?? [];
    list.push(balance);
    balancesByStudent.set(balance.studentId, list);
  }

  return data.students.map((student, index) => {
    const balances = (balancesByStudent.get(student.id) ?? []).sort(
      (a, b) => b.dueDate.localeCompare(a.dueDate),
    );
    const guardian = guardiansByStudent.get(student.id) ?? null;
    const totals = balances.reduce(
      (acc, balance) => {
        acc.dueCents += balance.amountDueCents;
        acc.paidCents += balance.amountPaidCents;
        if (balance.status === "overdue") {
          acc.overdueCents += balanceDue(balance);
        }
        return acc;
      },
      { dueCents: 0, paidCents: 0, overdueCents: 0 },
    );
    return {
      summary: summaries[index]!,
      guardian,
      balances,
      totals,
    };
  });
}

export function getMetrics(data: DashboardData): DashboardMetrics {
  const expectedCents = data.balances.reduce(
    (sum, balance) => sum + balance.amountDueCents,
    0,
  );
  const collectedCents = data.balances.reduce(
    (sum, balance) => sum + balance.amountPaidCents,
    0,
  );
  const pendingCents = data.balances
    .filter((balance) => balance.status === "pending" || balance.status === "partial")
    .reduce((sum, balance) => sum + balanceDue(balance), 0);
  const overdueCents = data.balances
    .filter((balance) => balance.status === "overdue")
    .reduce((sum, balance) => sum + balanceDue(balance), 0);

  const activeRequests = data.paymentRequests.filter(
    (request) => request.status === "pending" || request.status === "sent",
  ).length;
  const confirmedTransactions = data.transactions.filter(
    (transaction) => transaction.status === "confirmed",
  );
  const reconciledTransactions = confirmedTransactions.filter(
    (transaction) => transaction.reconciled,
  );
  const paidRequests = data.paymentRequests.filter(
    (request) => request.status === "paid",
  );
  const paidTotal = paidRequests.reduce(
    (sum, request) => sum + request.amountCents,
    0,
  );

  const studentSummaries = getStudentSummaries(data);
  const studentsWithDebt = studentSummaries.filter(
    (student) => student.balanceDueCents > 0,
  ).length;
  const overdueStudents = new Set(
    data.balances
      .filter((balance) => balance.status === "overdue")
      .map((balance) => balance.studentId),
  ).size;

  return {
    expectedCents,
    collectedCents,
    pendingCents,
    overdueCents,
    collectionRate: expectedCents === 0 ? 0 : collectedCents / expectedCents,
    activeRequests,
    totalRequests: data.paymentRequests.length,
    unmatchedTransactions: confirmedTransactions.filter(
      (transaction) => !transaction.reconciled,
    ).length,
    reconciliationRate:
      confirmedTransactions.length === 0
        ? 0
        : reconciledTransactions.length / confirmedTransactions.length,
    studentsWithDebt,
    overdueStudents,
    averageTicketCents:
      paidRequests.length === 0 ? 0 : Math.round(paidTotal / paidRequests.length),
  };
}

export function getReconciliationSummary(data: DashboardData, period: string) {
  const requests = data.paymentRequests.filter(
    (request) => request.period === period,
  );
  const expectedCents = requests
    .filter((request) => request.status !== "cancelled")
    .reduce((sum, request) => sum + request.amountCents, 0);
  const confirmed = data.transactions.filter(
    (transaction) => transaction.status === "confirmed",
  );
  const reconciled = confirmed.filter((transaction) => transaction.reconciled);
  const unmatched = confirmed.filter((transaction) => !transaction.reconciled);
  const collectedCents = reconciled.reduce(
    (sum, transaction) => sum + transaction.amountCents,
    0,
  );
  const unmatchedCents = unmatched.reduce(
    (sum, transaction) => sum + transaction.amountCents,
    0,
  );

  return {
    expectedCents,
    collectedCents,
    pendingCents: Math.max(0, expectedCents - collectedCents),
    unmatchedCents,
    counts: {
      totalRequests: requests.length,
      paid: requests.filter((request) => request.status === "paid").length,
      pending: requests.filter(
        (request) => request.status === "pending" || request.status === "sent",
      ).length,
      expired: requests.filter((request) => request.status === "expired").length,
      cancelled: requests.filter((request) => request.status === "cancelled")
        .length,
      transactions: confirmed.length,
      unmatchedTransactions: unmatched.length,
    },
    unmatched,
  };
}

export function getAlerts(data: DashboardData): AlertItem[] {
  const metrics = getMetrics(data);
  const alerts: AlertItem[] = [];

  if (metrics.unmatchedTransactions > 0) {
    alerts.push({
      title: `${metrics.unmatchedTransactions} pagos sin conciliar`,
      detail:
        "Hay transferencias confirmadas que no coinciden con una solicitud. Revísalas antes de cerrar el corte.",
      tone: "danger",
      href: "/conciliacion",
    });
  }

  if (metrics.overdueStudents > 0) {
    alerts.push({
      title: `${metrics.overdueStudents} alumnos con saldo vencido`,
      detail: `${formatMoney(metrics.overdueCents)} acumulados en colegiaturas de octubre.`,
      tone: "warning",
      href: "/cobranza?status=expired",
    });
  }

  if (data.ledgerValid) {
    alerts.push({
      title: "Ledger íntegro",
      detail: `La cadena SHA-256 validó ${data.ledger.length} asientos sin discrepancias.`,
      tone: "success",
      href: "/auditoria",
    });
  }

  return alerts;
}
