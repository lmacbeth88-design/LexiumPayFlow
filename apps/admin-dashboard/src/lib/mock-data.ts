import type {
  Balance,
  DashboardData,
  EducationLevel,
  Guardian,
  LedgerEntry,
  PaymentConcept,
  PaymentRequest,
  PaymentRequestStatus,
  PaymentTransaction,
  Receipt,
  School,
  Student,
} from "@/lib/types";
import { CONCEPT_LABEL } from "@/lib/labels";

export const NOW = "2026-11-14T18:00:00.000Z";
export const CURRENT_PERIOD = "2026-11";
export const PREVIOUS_PERIOD = "2026-10";
export const CURRENT_DUE_DATE = "2026-11-10";
export const PREVIOUS_DUE_DATE = "2026-10-10";

const LEVEL_AMOUNT_CENTS: Record<EducationLevel, number> = {
  preescolar: 280_000,
  primaria: 350_000,
  secundaria: 420_000,
  bachillerato: 480_000,
};

const school: School = {
  id: "sch_benitojuarez",
  name: "Colegio Benito Juárez",
  campus: "Campus Centro",
  cycle: "2026-2027",
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
    email: "patricia.vega@example.com",
  },
  {
    id: "grd_006",
    studentIds: ["stu_007"],
    fullName: "Andrea Ríos Campos",
    relationship: "madre",
    phone: "+525512345606",
    email: "andrea.rios@example.com",
  },
  {
    id: "grd_007",
    studentIds: ["stu_008"],
    fullName: "Jorge Ortiz Medina",
    relationship: "padre",
    phone: "+525512345607",
    email: "jorge.ortiz@example.com",
  },
  {
    id: "grd_008",
    studentIds: ["stu_009"],
    fullName: "Rosa Peña Aguilar",
    relationship: "madre",
    phone: "+525512345608",
    email: "rosa.pena@example.com",
  },
  {
    id: "grd_009",
    studentIds: ["stu_010"],
    fullName: "Miguel Navarro Duarte",
    relationship: "padre",
    phone: "+525512345609",
    email: "miguel.navarro@example.com",
  },
  {
    id: "grd_010",
    studentIds: ["stu_011"],
    fullName: "Claudia Bravo Núñez",
    relationship: "madre",
    phone: "+525512345610",
    email: "claudia.bravo@example.com",
  },
  {
    id: "grd_011",
    studentIds: ["stu_012"],
    fullName: "Arturo Domínguez Lara",
    relationship: "padre",
    phone: "+525512345611",
    email: "arturo.dominguez@example.com",
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
    createdAt: "2026-07-16T15:00:00.000Z",
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
    createdAt: "2026-07-16T15:00:00.000Z",
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
    createdAt: "2026-07-16T15:00:00.000Z",
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
    createdAt: "2026-07-16T15:00:00.000Z",
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
    createdAt: "2026-07-16T15:00:00.000Z",
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
    createdAt: "2026-07-16T15:00:00.000Z",
  },
  {
    id: "stu_007",
    schoolId: school.id,
    firstName: "Camila",
    lastNamePaternal: "Mendoza",
    lastNameMaternal: "Ríos",
    fullName: "Camila Mendoza Ríos",
    level: "preescolar",
    grade: "3°",
    group: "A",
    status: "active",
    guardianIds: ["grd_006"],
    createdAt: "2026-07-16T15:00:00.000Z",
  },
  {
    id: "stu_008",
    schoolId: school.id,
    firstName: "Sebastián",
    lastNamePaternal: "Ortiz",
    lastNameMaternal: "Luna",
    fullName: "Sebastián Ortiz Luna",
    level: "primaria",
    grade: "4°",
    group: "B",
    status: "active",
    guardianIds: ["grd_007"],
    createdAt: "2026-07-16T15:00:00.000Z",
  },
  {
    id: "stu_009",
    schoolId: school.id,
    firstName: "Ximena",
    lastNamePaternal: "Castillo",
    lastNameMaternal: "Peña",
    fullName: "Ximena Castillo Peña",
    level: "secundaria",
    grade: "1°",
    group: "A",
    status: "active",
    guardianIds: ["grd_008"],
    createdAt: "2026-07-16T15:00:00.000Z",
  },
  {
    id: "stu_010",
    schoolId: school.id,
    firstName: "Leonardo",
    lastNamePaternal: "Navarro",
    lastNameMaternal: "Gil",
    fullName: "Leonardo Navarro Gil",
    level: "bachillerato",
    grade: "2°",
    group: "B",
    status: "active",
    guardianIds: ["grd_009"],
    createdAt: "2026-07-16T15:00:00.000Z",
  },
  {
    id: "stu_011",
    schoolId: school.id,
    firstName: "Renata",
    lastNamePaternal: "Solís",
    lastNameMaternal: "Bravo",
    fullName: "Renata Solís Bravo",
    level: "primaria",
    grade: "2°",
    group: "A",
    status: "active",
    guardianIds: ["grd_010"],
    createdAt: "2026-07-16T15:00:00.000Z",
  },
  {
    id: "stu_012",
    schoolId: school.id,
    firstName: "Iker",
    lastNamePaternal: "Domínguez",
    lastNameMaternal: "Paz",
    fullName: "Iker Domínguez Paz",
    level: "preescolar",
    grade: "2°",
    group: "B",
    status: "active",
    guardianIds: ["grd_011"],
    createdAt: "2026-07-16T15:00:00.000Z",
  },
];

const paidCurrent = new Set(["stu_002", "stu_005", "stu_007", "stu_010", "stu_011"]);
const partialCurrent = new Map([["stu_003", 200_000]]);

const balances: Balance[] = [];
let balanceSequence = 0;

function pushBalance(input: {
  studentId: string;
  concept: PaymentConcept;
  period: string;
  dueDate: string;
  amountDueCents: number;
  amountPaidCents?: number;
  status?: Balance["status"];
}) {
  balanceSequence += 1;
  const amountPaidCents = input.amountPaidCents ?? 0;
  balances.push({
    id: `bal_${balanceSequence.toString().padStart(3, "0")}`,
    studentId: input.studentId,
    concept: input.concept,
    period: input.period,
    description: `${CONCEPT_LABEL[input.concept]} ${input.period}`,
    amountDueCents: input.amountDueCents,
    amountPaidCents,
    dueDate: input.dueDate,
    status:
      input.status ??
      (amountPaidCents >= input.amountDueCents
        ? "paid"
        : amountPaidCents > 0
          ? "partial"
          : "pending"),
  });
}

for (const student of students) {
  const amount = LEVEL_AMOUNT_CENTS[student.level];
  const partial = partialCurrent.get(student.id);
  const paid = paidCurrent.has(student.id) ? amount : (partial ?? 0);
  pushBalance({
    studentId: student.id,
    concept: "colegiatura",
    period: CURRENT_PERIOD,
    dueDate: CURRENT_DUE_DATE,
    amountDueCents: amount,
    amountPaidCents: paid,
    status: paid >= amount ? "paid" : paid > 0 ? "partial" : "pending",
  });
}

pushBalance({
  studentId: "stu_003",
  concept: "colegiatura",
  period: PREVIOUS_PERIOD,
  dueDate: PREVIOUS_DUE_DATE,
  amountDueCents: LEVEL_AMOUNT_CENTS.secundaria,
  status: "overdue",
});
pushBalance({
  studentId: "stu_006",
  concept: "colegiatura",
  period: PREVIOUS_PERIOD,
  dueDate: PREVIOUS_DUE_DATE,
  amountDueCents: LEVEL_AMOUNT_CENTS.primaria,
  status: "overdue",
});
pushBalance({
  studentId: "stu_009",
  concept: "colegiatura",
  period: PREVIOUS_PERIOD,
  dueDate: PREVIOUS_DUE_DATE,
  amountDueCents: LEVEL_AMOUNT_CENTS.secundaria,
  status: "overdue",
});
pushBalance({
  studentId: "stu_004",
  concept: "uniformes",
  period: CURRENT_PERIOD,
  dueDate: "2026-11-15",
  amountDueCents: 185_000,
  status: "pending",
});
pushBalance({
  studentId: "stu_008",
  concept: "transporte",
  period: CURRENT_PERIOD,
  dueDate: "2026-11-20",
  amountDueCents: 95_000,
  status: "pending",
});

const guardianByStudentId = new Map<string, Guardian>();
for (const guardian of guardians) {
  for (const studentId of guardian.studentIds) {
    guardianByStudentId.set(studentId, guardian);
  }
}

function makeRequest(input: {
  id: string;
  studentId: string;
  concept: PaymentConcept;
  amountCents: number;
  status: PaymentRequestStatus;
  reference: string;
  period?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  description?: string;
}): PaymentRequest {
  const guardian = guardianByStudentId.get(input.studentId);
  if (!guardian) {
    throw new Error(`Tutor no encontrado para ${input.studentId}`);
  }
  const period = input.period ?? CURRENT_PERIOD;
  return {
    id: input.id,
    schoolId: school.id,
    studentId: input.studentId,
    payerId: guardian.id,
    concept: input.concept,
    period,
    description: input.description ?? `${CONCEPT_LABEL[input.concept]} ${period}`,
    amountCents: input.amountCents,
    currency: "MXN",
    status: input.status,
    method: "codi",
    reference: input.reference,
    codiQrPayload: `00020101021238570010CODI.${input.reference}530303905802MX5913LEXIUM PAYFLOW6006CDMX6304DEMO`,
    paymentUrl: `https://pay.lexium.mx/demo/${input.id}`,
    dueDate: input.dueDate,
    expiresAt: `${input.dueDate}T23:59:59.000Z`,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    ...(input.paidAt ? { paidAt: input.paidAt } : {}),
    ...(input.cancelledAt ? { cancelledAt: input.cancelledAt } : {}),
    ...(input.cancellationReason
      ? { cancellationReason: input.cancellationReason }
      : {}),
  };
}

const paymentRequests: PaymentRequest[] = [
  makeRequest({
    id: "pay_001",
    studentId: "stu_005",
    concept: "colegiatura",
    amountCents: 480_000,
    status: "paid",
    reference: "CODI-8841-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-01T15:30:00.000Z",
    updatedAt: "2026-11-05T16:20:00.000Z",
    paidAt: "2026-11-05T16:20:00.000Z",
  }),
  makeRequest({
    id: "pay_002",
    studentId: "stu_002",
    concept: "colegiatura",
    amountCents: 350_000,
    status: "paid",
    reference: "CODI-8842-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-02T14:10:00.000Z",
    updatedAt: "2026-11-07T18:05:00.000Z",
    paidAt: "2026-11-07T18:05:00.000Z",
  }),
  makeRequest({
    id: "pay_003",
    studentId: "stu_007",
    concept: "colegiatura",
    amountCents: 280_000,
    status: "paid",
    reference: "CODI-8843-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-02T16:45:00.000Z",
    updatedAt: "2026-11-08T15:12:00.000Z",
    paidAt: "2026-11-08T15:12:00.000Z",
  }),
  makeRequest({
    id: "pay_004",
    studentId: "stu_003",
    concept: "colegiatura",
    amountCents: 420_000,
    status: "sent",
    reference: "CODI-8844-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-03T13:20:00.000Z",
    updatedAt: "2026-11-03T13:45:00.000Z",
  }),
  makeRequest({
    id: "pay_005",
    studentId: "stu_004",
    concept: "uniformes",
    amountCents: 185_000,
    status: "sent",
    reference: "CODI-8845-2026",
    dueDate: "2026-11-15",
    createdAt: "2026-11-04T17:05:00.000Z",
    updatedAt: "2026-11-04T17:30:00.000Z",
  }),
  makeRequest({
    id: "pay_006",
    studentId: "stu_008",
    concept: "transporte",
    amountCents: 95_000,
    status: "pending",
    reference: "CODI-8846-2026",
    dueDate: "2026-11-20",
    createdAt: "2026-11-06T15:00:00.000Z",
    updatedAt: "2026-11-06T15:00:00.000Z",
  }),
  makeRequest({
    id: "pay_007",
    studentId: "stu_009",
    concept: "colegiatura",
    amountCents: 420_000,
    status: "pending",
    reference: "CODI-8847-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-07T16:20:00.000Z",
    updatedAt: "2026-11-07T16:20:00.000Z",
  }),
  makeRequest({
    id: "pay_008",
    studentId: "stu_006",
    concept: "colegiatura",
    amountCents: 350_000,
    status: "expired",
    reference: "CODI-8848-2026",
    period: PREVIOUS_PERIOD,
    dueDate: PREVIOUS_DUE_DATE,
    createdAt: "2026-10-01T14:00:00.000Z",
    updatedAt: "2026-10-26T00:00:00.000Z",
  }),
  makeRequest({
    id: "pay_009",
    studentId: "stu_011",
    concept: "colegiatura",
    amountCents: 350_000,
    status: "cancelled",
    reference: "CODI-8849-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-03T18:40:00.000Z",
    updatedAt: "2026-11-04T12:00:00.000Z",
    cancelledAt: "2026-11-04T12:00:00.000Z",
    cancellationReason: "Solicitud duplicada",
  }),
  makeRequest({
    id: "pay_010",
    studentId: "stu_012",
    concept: "colegiatura",
    amountCents: 280_000,
    status: "sent",
    reference: "CODI-8850-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-08T15:30:00.000Z",
    updatedAt: "2026-11-08T15:40:00.000Z",
  }),
  makeRequest({
    id: "pay_011",
    studentId: "stu_010",
    concept: "colegiatura",
    amountCents: 480_000,
    status: "paid",
    reference: "CODI-8851-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-09T14:15:00.000Z",
    updatedAt: "2026-11-11T19:05:00.000Z",
    paidAt: "2026-11-11T19:05:00.000Z",
  }),
  makeRequest({
    id: "pay_012",
    studentId: "stu_001",
    concept: "colegiatura",
    amountCents: 350_000,
    status: "sent",
    reference: "CODI-8852-2026",
    dueDate: CURRENT_DUE_DATE,
    createdAt: "2026-11-10T13:10:00.000Z",
    updatedAt: "2026-11-10T13:25:00.000Z",
  }),
];

const transactions: PaymentTransaction[] = [
  {
    id: "txn_001",
    paymentRequestId: "pay_001",
    schoolId: school.id,
    amountCents: 480_000,
    currency: "MXN",
    method: "codi",
    status: "confirmed",
    reconciled: true,
    bankReference: "SPEI-8891-2026",
    payerName: "FERNANDO FLORES ORTIZ",
    paidAt: "2026-11-05T16:20:00.000Z",
    receivedAt: "2026-11-05T16:21:00.000Z",
    webhookEventId: "evt_001",
  },
  {
    id: "txn_002",
    paymentRequestId: "pay_002",
    schoolId: school.id,
    amountCents: 350_000,
    currency: "MXN",
    method: "codi",
    status: "confirmed",
    reconciled: true,
    bankReference: "SPEI-8892-2026",
    payerName: "MARIA LOPEZ HERNANDEZ",
    paidAt: "2026-11-07T18:05:00.000Z",
    receivedAt: "2026-11-07T18:06:00.000Z",
    webhookEventId: "evt_002",
  },
  {
    id: "txn_003",
    paymentRequestId: "pay_003",
    schoolId: school.id,
    amountCents: 280_000,
    currency: "MXN",
    method: "codi",
    status: "confirmed",
    reconciled: true,
    bankReference: "SPEI-8893-2026",
    payerName: "ANDREA RIOS CAMPOS",
    paidAt: "2026-11-08T15:12:00.000Z",
    receivedAt: "2026-11-08T15:13:00.000Z",
    webhookEventId: "evt_003",
  },
  {
    id: "txn_004",
    paymentRequestId: "pay_011",
    schoolId: school.id,
    amountCents: 480_000,
    currency: "MXN",
    method: "spei",
    status: "confirmed",
    reconciled: true,
    bankReference: "SPEI-8894-2026",
    payerName: "MIGUEL NAVARRO DUARTE",
    paidAt: "2026-11-11T19:05:00.000Z",
    receivedAt: "2026-11-11T19:06:00.000Z",
    webhookEventId: "evt_004",
  },
  {
    id: "txn_005",
    paymentRequestId: null,
    schoolId: school.id,
    amountCents: 350_000,
    currency: "MXN",
    method: "spei",
    status: "confirmed",
    reconciled: false,
    bankReference: "SPEI-UNKNOWN-9821",
    payerName: "JORGE MARTINEZ",
    paidAt: "2026-11-14T14:12:00.000Z",
    receivedAt: "2026-11-14T14:13:00.000Z",
    webhookEventId: "evt_unmatched_001",
  },
  {
    id: "txn_006",
    paymentRequestId: null,
    schoolId: school.id,
    amountCents: 185_000,
    currency: "MXN",
    method: "spei",
    status: "confirmed",
    reconciled: false,
    bankReference: "SPEI-UNKNOWN-9822",
    payerName: "LUCIA RUIZ MENDOZA",
    paidAt: "2026-11-13T18:40:00.000Z",
    receivedAt: "2026-11-13T18:41:00.000Z",
    webhookEventId: "evt_unmatched_002",
  },
];

const ledgerHashes = Array.from({ length: 14 }, (_, index) =>
  (index + 1).toString(16).padStart(2, "0").repeat(32),
);

function ledgerEntry(input: {
  sequence: number;
  type: LedgerEntry["type"];
  paymentRequestId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}): LedgerEntry {
  return {
    sequence: input.sequence,
    prevHash: input.sequence === 0 ? null : ledgerHashes[input.sequence - 1]!,
    hash: ledgerHashes[input.sequence]!,
    type: input.type,
    paymentRequestId: input.paymentRequestId as LedgerEntry["paymentRequestId"],
    payload: input.payload,
    createdAt: input.createdAt,
  };
}

const ledger: LedgerEntry[] = [
  ledgerEntry({
    sequence: 0,
    type: "payment_request.created",
    paymentRequestId: "pay_001",
    payload: { amountCents: 480_000, concept: "colegiatura", reference: "CODI-8841-2026" },
    createdAt: "2026-11-01T15:30:00.000Z",
  }),
  ledgerEntry({
    sequence: 1,
    type: "webhook.received",
    paymentRequestId: "pay_001",
    payload: { amountCents: 480_000, bankReference: "SPEI-8891-2026", reconciled: true },
    createdAt: "2026-11-05T16:21:00.000Z",
  }),
  ledgerEntry({
    sequence: 2,
    type: "payment.confirmed",
    paymentRequestId: "pay_001",
    payload: { amountCents: 480_000, method: "codi" },
    createdAt: "2026-11-05T16:22:00.000Z",
  }),
  ledgerEntry({
    sequence: 3,
    type: "receipt.issued",
    paymentRequestId: "pay_001",
    payload: { amountCents: 480_000, folio: "RC-0001" },
    createdAt: "2026-11-05T16:23:00.000Z",
  }),
  ledgerEntry({
    sequence: 4,
    type: "payment_request.created",
    paymentRequestId: "pay_002",
    payload: { amountCents: 350_000, concept: "colegiatura", reference: "CODI-8842-2026" },
    createdAt: "2026-11-02T14:10:00.000Z",
  }),
  ledgerEntry({
    sequence: 5,
    type: "webhook.received",
    paymentRequestId: "pay_002",
    payload: { amountCents: 350_000, bankReference: "SPEI-8892-2026", reconciled: true },
    createdAt: "2026-11-07T18:06:00.000Z",
  }),
  ledgerEntry({
    sequence: 6,
    type: "payment.confirmed",
    paymentRequestId: "pay_002",
    payload: { amountCents: 350_000, method: "codi" },
    createdAt: "2026-11-07T18:07:00.000Z",
  }),
  ledgerEntry({
    sequence: 7,
    type: "receipt.issued",
    paymentRequestId: "pay_002",
    payload: { amountCents: 350_000, folio: "RC-0002" },
    createdAt: "2026-11-07T18:08:00.000Z",
  }),
  ledgerEntry({
    sequence: 8,
    type: "payment_request.created",
    paymentRequestId: "pay_004",
    payload: { amountCents: 420_000, concept: "colegiatura", reference: "CODI-8844-2026" },
    createdAt: "2026-11-03T13:20:00.000Z",
  }),
  ledgerEntry({
    sequence: 9,
    type: "reminder.sent",
    paymentRequestId: "pay_004",
    payload: { channel: "whatsapp", to: "Roberto Torres Salinas" },
    createdAt: "2026-11-12T16:00:00.000Z",
  }),
  ledgerEntry({
    sequence: 10,
    type: "payment_request.created",
    paymentRequestId: "pay_005",
    payload: { amountCents: 185_000, concept: "uniformes", reference: "CODI-8845-2026" },
    createdAt: "2026-11-04T17:05:00.000Z",
  }),
  ledgerEntry({
    sequence: 11,
    type: "webhook.received",
    paymentRequestId: null,
    payload: { amountCents: 350_000, bankReference: "SPEI-UNKNOWN-9821", reconciled: false },
    createdAt: "2026-11-14T14:13:00.000Z",
  }),
  ledgerEntry({
    sequence: 12,
    type: "payment_request.created",
    paymentRequestId: "pay_007",
    payload: { amountCents: 420_000, concept: "colegiatura", reference: "CODI-8847-2026" },
    createdAt: "2026-11-07T16:20:00.000Z",
  }),
  ledgerEntry({
    sequence: 13,
    type: "payment_request.cancelled",
    paymentRequestId: "pay_009",
    payload: { reason: "Solicitud duplicada", amountCents: 350_000 },
    createdAt: "2026-11-04T12:00:00.000Z",
  }),
];

const receipts: Receipt[] = [
  {
    id: "rcp_001",
    paymentRequestId: "pay_001",
    schoolId: school.id,
    studentId: "stu_005",
    folio: "RC-0001",
    amountCents: 480_000,
    currency: "MXN",
    issuedAt: "2026-11-05T16:23:00.000Z",
    pdfUrl: "https://receipts.lexium.mx/demo/rcp_001.pdf",
    ledgerHash: ledgerHashes[3]!,
  },
  {
    id: "rcp_002",
    paymentRequestId: "pay_002",
    schoolId: school.id,
    studentId: "stu_002",
    folio: "RC-0002",
    amountCents: 350_000,
    currency: "MXN",
    issuedAt: "2026-11-07T18:08:00.000Z",
    pdfUrl: "https://receipts.lexium.mx/demo/rcp_002.pdf",
    ledgerHash: ledgerHashes[7]!,
  },
];

export const dashboardData: DashboardData = {
  school,
  guardians,
  students,
  balances,
  paymentRequests,
  transactions,
  receipts,
  ledger,
  ledgerValid: true,
  now: NOW,
  weeklyCollection: [
    { label: "Sem 1", expectedCents: 1_120_000, collectedCents: 780_000 },
    { label: "Sem 2", expectedCents: 980_000, collectedCents: 610_000 },
    { label: "Sem 3", expectedCents: 1_260_000, collectedCents: 840_000 },
    { label: "Sem 4", expectedCents: 1_080_000, collectedCents: 720_000 },
    { label: "Sem 5", expectedCents: 860_000, collectedCents: 540_000 },
  ],
};
