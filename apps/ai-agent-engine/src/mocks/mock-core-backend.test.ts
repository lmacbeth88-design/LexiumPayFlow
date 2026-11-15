import { describe, expect, it } from "vitest";
import { MockCoreBackend } from "./mock-core-backend";

const NOW = new Date("2026-03-05T18:00:00.000Z");
const SCHOOL_ID = "sch_benitojuarez";

function makeBackend(): MockCoreBackend {
  return new MockCoreBackend({ now: NOW });
}

describe("MockCoreBackend", () => {
  it("busca alumnos ignorando acentos y mayúsculas", async () => {
    const backend = makeBackend();
    const result = await backend.searchStudents({
      schoolId: SCHOOL_ID,
      query: "ramirez",
    });

    expect(result.totalMatches).toBe(2);
    expect(result.students.map((student) => student.id).sort()).toEqual([
      "stu_001",
      "stu_002",
    ]);
  });

  it("devuelve la ficha financiera del alumno con saldo y tutor", async () => {
    const backend = makeBackend();
    const account = await backend.getStudentAccount({
      schoolId: SCHOOL_ID,
      studentId: "stu_001",
    });

    expect(account.student.fullName).toBe("Sofía Ramírez López");
    expect(account.guardian?.fullName).toBe("María López Hernández");
    expect(account.totals.dueCents).toBe(350_000);
    expect(account.balances).toHaveLength(1);
  });

  it("crea una solicitud y la registra en el ledger encadenado", async () => {
    const backend = makeBackend();
    const { paymentRequest } = await backend.createPaymentRequest({
      schoolId: SCHOOL_ID,
      studentId: "stu_001",
      concept: "colegiatura",
      amountCents: 350_000,
      dueDate: "2026-03-10",
    });

    expect(paymentRequest.status).toBe("pending");
    expect(paymentRequest.period).toBe("2026-03");
    expect(paymentRequest.reference).toMatch(/^CODI-/);
    expect(backend.getLedger().at(-1)?.paymentRequestId).toBe(
      paymentRequest.id,
    );

    const audit = await backend.getLedgerAudit({
      schoolId: SCHOOL_ID,
      paymentRequestId: paymentRequest.id,
    });
    expect(audit.chainValid).toBe(true);
  });

  it("cobra en lote usando saldos y omite pagados o duplicados", async () => {
    const backend = makeBackend();
    const result = await backend.createBulkPaymentRequests({
      schoolId: SCHOOL_ID,
      studentIds: [
        "stu_001",
        "stu_002",
        "stu_003",
        "stu_004",
        "stu_005",
        "stu_006",
      ],
      concept: "colegiatura",
      dueDate: "2026-03-10",
    });

    expect(result.created).toHaveLength(4);
    expect(result.skipped.map((item) => item.studentId).sort()).toEqual([
      "stu_003",
      "stu_005",
    ]);
    expect(result.totals).toEqual({
      count: 4,
      amountCents: 1_470_000,
    });

    const secondRun = await backend.createBulkPaymentRequests({
      schoolId: SCHOOL_ID,
      studentIds: ["stu_001", "stu_002"],
      concept: "colegiatura",
      dueDate: "2026-03-10",
    });
    expect(secondRun.created).toHaveLength(0);
    expect(secondRun.skipped).toHaveLength(2);
  });

  it("simula el webhook de pago, emite recibo y concilia", async () => {
    const backend = makeBackend();
    const { paymentRequest } = await backend.createPaymentRequest({
      schoolId: SCHOOL_ID,
      studentId: "stu_001",
      concept: "colegiatura",
      amountCents: 350_000,
      dueDate: "2026-03-10",
    });

    backend.simulatePayment(paymentRequest.id, { paidAt: NOW });

    const status = await backend.getPaymentStatus({
      schoolId: SCHOOL_ID,
      paymentRequestId: paymentRequest.id,
    });

    expect(status.paymentRequest.status).toBe("paid");
    expect(status.transactions).toHaveLength(1);
    expect(status.transactions[0]?.reconciled).toBe(true);
    expect(status.receipt?.paymentRequestId).toBe(paymentRequest.id);
    expect(status.ledger.chainValid).toBe(true);
    expect(status.ledger.entries).toBe(4);
  });

  it("solo cancela solicitudes activas", async () => {
    const backend = makeBackend();
    const { paymentRequest } = await backend.createPaymentRequest({
      schoolId: SCHOOL_ID,
      studentId: "stu_002",
      concept: "colegiatura",
      amountCents: 350_000,
      dueDate: "2026-03-10",
    });

    const cancelled = await backend.cancelPaymentRequest({
      schoolId: SCHOOL_ID,
      paymentRequestId: paymentRequest.id,
      reason: "Error de captura del alumno",
    });
    expect(cancelled.paymentRequest.status).toBe("cancelled");

    await expect(
      backend.cancelPaymentRequest({
        schoolId: SCHOOL_ID,
        paymentRequestId: paymentRequest.id,
        reason: "Segundo intento de cancelación",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
  });

  it("resume conciliación con pendientes y pagos no identificados", async () => {
    const backend = makeBackend();
    const summary = await backend.getReconciliationSummary({
      schoolId: SCHOOL_ID,
      from: "2026-03-01",
      to: "2026-03-31",
    });

    expect(summary.counts.totalRequests).toBe(3);
    expect(summary.counts.paid).toBe(1);
    expect(summary.counts.pending).toBe(2);
    expect(summary.totals.collectedCents).toBe(480_000);
    expect(summary.totals.pendingCents).toBe(605_000);
    expect(summary.totals.unmatchedCents).toBe(350_000);
    expect(summary.counts.unmatchedTransactions).toBe(1);
  });

  it("envía recordatorios y mueve la solicitud a enviada", async () => {
    const backend = makeBackend();
    const result = await backend.sendPaymentReminders({
      schoolId: SCHOOL_ID,
      paymentRequestIds: ["pay_seed_pending_001"],
      channel: "email",
    });

    expect(result.sent).toHaveLength(1);
    expect(result.sent[0]?.to).toBe("lucia.ruiz@example.com");
    expect(backend.getPaymentRequest("pay_seed_pending_001")?.status).toBe(
      "sent",
    );

    const failed = await backend.sendPaymentReminders({
      schoolId: SCHOOL_ID,
      paymentRequestIds: ["pay_seed_paid_001"],
    });
    expect(failed.failed).toHaveLength(1);
  });
});
