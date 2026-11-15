import type {
  Balance,
  Guardian,
  LedgerEntry,
  PaymentConcept,
  PaymentRequest,
  PaymentTransaction,
  Receipt,
  School,
  Student,
} from "@lexium/shared-contracts";
import { LedgerChain } from "./ledger";

const DAY_MS = 86_400_000;

export const MOCK_SCHOOL_ID = "sch_benitojuarez";
export const MOCK_SCHOOL_NAME = "Colegio Benito Juárez";

export const CONCEPT_LABEL: Record<PaymentConcept, string> = {
  colegiatura: "Colegiatura",
  inscripcion: "Inscripción",
  uniformes: "Uniformes",
  transporte: "Transporte",
  otro: "Otro",
};

const LEVEL_AMOUNT_CENTS = {
  preescolar: 280_000,
  primaria: 350_000,
  secundaria: 420_000,
  bachillerato: 480_000,
} as const;

export interface MockFixtures {
  school: School;
  guardians: Guardian[];
  students: Student[];
  balances: Balance[];
  paymentRequests: PaymentRequest[];
  transactions: PaymentTransaction[];
  receipts: Receipt[];
  ledger: LedgerEntry[];
}

function shiftMonths(date: Date, delta: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + delta);
  return shifted;
}

function isoDateOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function periodOf(date: Date): string {
  return isoDateOf(date).slice(0, 7);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysAgo(now: Date, days: number, hours = 0): Date {
  return new Date(now.getTime() - (days * DAY_MS + hours * 3_600_000));
}

function schoolCycle(now: Date): string {
  const year = now.getUTCMonth() + 1 >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${year}-${year + 1}`;
}

export function buildMockFixtures(now: Date): MockFixtures {
  const currentPeriod = periodOf(now);
  const previousPeriod = periodOf(shiftMonths(now, -1));
  const currentDueDate = `${currentPeriod}-10`;
  const currentLateDueDate = `${currentPeriod}-15`;
  const previousDueDate = `${previousPeriod}-10`;
  const studentCreatedAt = daysAgo(now, 120).toISOString();
  const ledger = new LedgerChain();

  const school: School = {
    id: MOCK_SCHOOL_ID,
    name: MOCK_SCHOOL_NAME,
    campus: "Campus Centro",
    cycle: schoolCycle(now),
    timezone: "America/Mexico_City",
  };

  const guardians: Guardian[] = [
    {
      id: "grd_001",
      studentIds: ["stu_001", "stu_002"],
      fullName: "María López Hernández",
      relationship: "madre",
      phone: "+525512345601",
      email: "maria.lopez@example.com",
    },
    {
      id: "grd_002",
      studentIds: ["stu_003"],
      fullName: "Roberto Torres Salinas",
      relationship: "padre",
      phone: "+525512345602",
      email: "roberto.torres@example.com",
    },
    {
      id: "grd_003",
      studentIds: ["stu_004"],
      fullName: "Lucía Ruiz Mendoza",
      relationship: "madre",
      phone: "+525512345603",
      email: "lucia.ruiz@example.com",
    },
    {
      id: "grd_004",
      studentIds: ["stu_005"],
      fullName: "Fernando Flores Ortiz",
      relationship: "padre",
      phone: "+525512345604",
      email: "fernando.flores@example.com",
    },
    {
      id: "grd_005",
      studentIds: ["stu_006"],
      fullName: "Patricia Vega Romero",
      relationship: "madre",
      phone: "+525512345605",
    },
  ];

  const students: Student[] = [
    {
      id: "stu_001",
      schoolId: school.id,
      firstName: "Sofía",
      lastNamePaternal: "Ramírez",
      lastNameMaternal: "López",
      fullName: "Sofía Ramírez López",
      level: "primaria",
      grade: "3°",
      group: "A",
      status: "active",
      guardianIds: ["grd_001"],
      createdAt: studentCreatedAt,
    },
    {
      id: "stu_002",
      schoolId: school.id,
      firstName: "Mateo",
      lastNamePaternal: "Ramírez",
      lastNameMaternal: "López",
      fullName: "Mateo Ramírez López",
      level: "primaria",
      grade: "1°",
      group: "B",
      status: "active",
      guardianIds: ["grd_001"],
      createdAt: studentCreatedAt,
    },
    {
      id: "stu_003",
      schoolId: school.id,
      firstName: "Valentina",
      lastNamePaternal: "Torres",
      lastNameMaternal: "Ruiz",
      fullName: "Valentina Torres Ruiz",
      level: "secundaria",
      grade: "2°",
      group: "A",
      status: "active",
      guardianIds: ["grd_002"],
      createdAt: studentCreatedAt,
    },
    {
      id: "stu_004",
      schoolId: school.id,
      firstName: "Diego",
      lastNamePaternal: "Hernández",
      lastNameMaternal: "Cruz",
      fullName: "Diego Hernández Cruz",
      level: "secundaria",
      grade: "3°",
      group: "B",
      status: "active",
      guardianIds: ["grd_003"],
      createdAt: studentCreatedAt,
    },
    {
      id: "stu_005",
      schoolId: school.id,
      firstName: "Regina",
      lastNamePaternal: "Flores",
      lastNameMaternal: "Núñez",
      fullName: "Regina Flores Núñez",
      level: "bachillerato",
      grade: "1°",
      group: "A",
      status: "active",
      guardianIds: ["grd_004"],
      createdAt: studentCreatedAt,
    },
    {
      id: "stu_006",
      schoolId: school.id,
      firstName: "Emilio",
      lastNamePaternal: "Sánchez",
      lastNameMaternal: "Vega",
      fullName: "Emilio Sánchez Vega",
      level: "primaria",
      grade: "6°",
      group: "A",
      status: "active",
      guardianIds: ["grd_005"],
      createdAt: studentCreatedAt,
    },
  ];

  const balances: Balance[] = [];
  let balanceSequence = 0;

  const pushBalance = (input: {
    student: Student;
    concept: PaymentConcept;
    period: string;
    dueDate: string;
    amountCents: number;
    amountPaidCents?: number;
    status?: Balance["status"];
  }): Balance => {
    balanceSequence += 1;
    const amountPaidCents = input.amountPaidCents ?? 0;
    const balance: Balance = {
      id: `bal_${balanceSequence.toString().padStart(3, "0")}`,
      studentId: input.student.id,
      concept: input.concept,
      period: input.period,
      description: `${CONCEPT_LABEL[input.concept]} ${input.period}`,
      amountDueCents: input.amountCents,
      amountPaidCents,
      dueDate: input.dueDate,
      status:
        input.status ??
        (amountPaidCents >= input.amountCents
          ? "paid"
          : amountPaidCents > 0
            ? "partial"
            : "pending"),
    };
    balances.push(balance);
    return balance;
  };

  for (const student of students) {
    const baseAmount = LEVEL_AMOUNT_CENTS[student.level];
    const isPaid = student.id === "stu_005";

    pushBalance({
      student,
      concept: "colegiatura",
      period: currentPeriod,
      dueDate: currentDueDate,
      amountCents: baseAmount,
      amountPaidCents: isPaid ? baseAmount : 0,
      status: isPaid ? "paid" : "pending",
    });
  }

  pushBalance({
    student: students[2]!,
    concept: "colegiatura",
    period: previousPeriod,
    dueDate: previousDueDate,
    amountCents: LEVEL_AMOUNT_CENTS.secundaria,
    status: "overdue",
  });

  pushBalance({
    student: students[5]!,
    concept: "colegiatura",
    period: previousPeriod,
    dueDate: previousDueDate,
    amountCents: LEVEL_AMOUNT_CENTS.primaria,
    status: "overdue",
  });

  pushBalance({
    student: students[3]!,
    concept: "uniformes",
    period: currentPeriod,
    dueDate: currentLateDueDate,
    amountCents: 185_000,
    status: "pending",
  });

  const studentById = new Map(students.map((student) => [student.id, student]));
  const guardianByStudentId = new Map<string, Guardian>();
  for (const guardian of guardians) {
    for (const studentId of guardian.studentIds) {
      guardianByStudentId.set(studentId, guardian);
    }
  }

  const buildRequest = (input: {
    id: string;
    studentId: string;
    concept: PaymentConcept;
    amountCents: number;
    status: PaymentRequest["status"];
    reference: string;
    createdAt: Date;
    updatedAt: Date;
    dueDate: string;
    period: string;
    paidAt?: Date;
  }): PaymentRequest => {
    const student = studentById.get(input.studentId);
    const guardian = guardianByStudentId.get(input.studentId);
    if (!student || !guardian) {
      throw new Error(`Fixture inválida: alumno o tutor inexistente ${input.studentId}`);
    }

    return {
      id: input.id,
      schoolId: school.id,
      studentId: student.id,
      payerId: guardian.id,
      concept: input.concept,
      period: input.period,
      description: `${CONCEPT_LABEL[input.concept]} ${input.period}`,
      amountCents: input.amountCents,
      currency: "MXN",
      status: input.status,
      method: "codi",
      reference: input.reference,
      codiQrPayload: `00020101021238570010CODI.${input.reference}530303905802MX5913LEXIUM PAYFLOW6006CDMX6304DEMO`,
      paymentUrl: `https://pay.lexium.mx/demo/${input.id}`,
      dueDate: input.dueDate,
      expiresAt: addDays(input.createdAt, 15).toISOString(),
      createdAt: input.createdAt.toISOString(),
      updatedAt: input.updatedAt.toISOString(),
      ...(input.paidAt ? { paidAt: input.paidAt.toISOString() } : {}),
    };
  };

  const paidAt = daysAgo(now, 4);
  const paidRequest = buildRequest({
    id: "pay_seed_paid_001",
    studentId: "stu_005",
    concept: "colegiatura",
    amountCents: LEVEL_AMOUNT_CENTS.bachillerato,
    status: "paid",
    reference: "CODI-SEED-PAID-001",
    createdAt: daysAgo(now, 5),
    updatedAt: paidAt,
    dueDate: currentDueDate,
    period: currentPeriod,
    paidAt,
  });

  const sentRequest = buildRequest({
    id: "pay_seed_sent_001",
    studentId: "stu_003",
    concept: "colegiatura",
    amountCents: LEVEL_AMOUNT_CENTS.secundaria,
    status: "sent",
    reference: "CODI-SEED-SENT-001",
    createdAt: daysAgo(now, 2),
    updatedAt: daysAgo(now, 2),
    dueDate: currentDueDate,
    period: currentPeriod,
  });

  const pendingUniformRequest = buildRequest({
    id: "pay_seed_pending_001",
    studentId: "stu_004",
    concept: "uniformes",
    amountCents: 185_000,
    status: "pending",
    reference: "CODI-SEED-PENDING-001",
    createdAt: daysAgo(now, 1),
    updatedAt: daysAgo(now, 1),
    dueDate: currentLateDueDate,
    period: currentPeriod,
  });

  const paymentRequests: PaymentRequest[] = [
    paidRequest,
    sentRequest,
    pendingUniformRequest,
  ];

  const transactions: PaymentTransaction[] = [
    {
      id: "txn_seed_paid_001",
      paymentRequestId: paidRequest.id,
      schoolId: school.id,
      amountCents: paidRequest.amountCents,
      currency: "MXN",
      method: "codi",
      status: "confirmed",
      reconciled: true,
      bankReference: "SPEI-8891-2026",
      payerName: "FERNANDO FLORES ORTIZ",
      paidAt: paidAt.toISOString(),
      receivedAt: paidAt.toISOString(),
      webhookEventId: "evt_seed_paid_001",
    },
    {
      id: "txn_seed_unmatched_001",
      paymentRequestId: null,
      schoolId: school.id,
      amountCents: 350_000,
      currency: "MXN",
      method: "spei",
      status: "confirmed",
      reconciled: false,
      bankReference: "SPEI-UNKNOWN-9821",
      payerName: "JORGE MARTINEZ",
      paidAt: daysAgo(now, 0, 12).toISOString(),
      receivedAt: daysAgo(now, 0, 12).toISOString(),
      webhookEventId: "evt_seed_unmatched_001",
    },
  ];

  ledger.append(
    "payment_request.created",
    paidRequest.id,
    {
      amountCents: paidRequest.amountCents,
      concept: paidRequest.concept,
      reference: paidRequest.reference,
    },
    paidRequest.createdAt,
  );
  ledger.append(
    "webhook.received",
    paidRequest.id,
    {
      amountCents: paidRequest.amountCents,
      bankReference: "SPEI-8891-2026",
      reconciled: true,
    },
    paidAt.toISOString(),
  );
  ledger.append(
    "payment.confirmed",
    paidRequest.id,
    { amountCents: paidRequest.amountCents, method: "codi" },
    paidAt.toISOString(),
  );
  const receiptEntry = ledger.append(
    "receipt.issued",
    paidRequest.id,
    { amountCents: paidRequest.amountCents, folio: "RC-0001" },
    paidAt.toISOString(),
  );

  ledger.append(
    "payment_request.created",
    sentRequest.id,
    {
      amountCents: sentRequest.amountCents,
      concept: sentRequest.concept,
      reference: sentRequest.reference,
    },
    sentRequest.createdAt,
  );
  ledger.append(
    "payment_request.created",
    pendingUniformRequest.id,
    {
      amountCents: pendingUniformRequest.amountCents,
      concept: pendingUniformRequest.concept,
      reference: pendingUniformRequest.reference,
    },
    pendingUniformRequest.createdAt,
  );
  ledger.append(
    "webhook.received",
    null,
    {
      amountCents: 350_000,
      bankReference: "SPEI-UNKNOWN-9821",
      reconciled: false,
    },
    daysAgo(now, 0, 12).toISOString(),
  );

  const receipts: Receipt[] = [
    {
      id: "rcp_seed_001",
      paymentRequestId: paidRequest.id,
      schoolId: school.id,
      studentId: paidRequest.studentId,
      folio: "RC-0001",
      amountCents: paidRequest.amountCents,
      currency: "MXN",
      issuedAt: paidAt.toISOString(),
      pdfUrl: "https://receipts.lexium.mx/demo/rcp_seed_001.pdf",
      ledgerHash: receiptEntry.hash,
    },
  ];

  return {
    school,
    guardians,
    students,
    balances,
    paymentRequests,
    transactions,
    receipts,
    ledger: ledger.all(),
  };
}
