import { AgentToolName } from "@lexium/shared-contracts";
import { describe, expect, it } from "vitest";
import { MockCoreBackend } from "../mocks/mock-core-backend";
import {
  handleCancelPaymentRequest,
  handleCreateBulkPaymentRequests,
  handleCreatePaymentRequest,
  handleSearchStudents,
  type AgentContext,
} from "./handlers";
import { defaultAgentPolicy } from "./policy";
import { toToolResult } from "./result";
import { createAgentTools } from "./tools";

const NOW = new Date("2026-03-05T18:00:00.000Z");
const SCHOOL_ID = "sch_benitojuarez";

function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    backend: new MockCoreBackend({ now: NOW }),
    schoolId: SCHOOL_ID,
    now: NOW,
    ...overrides,
  };
}

describe("handlers del agente", () => {
  it("rechaza montos individuales fuera de política", async () => {
    const context = makeContext();

    await expect(
      handleCreatePaymentRequest(context, {
        studentId: "stu_001",
        concept: "colegiatura",
        amountCents: 5_000_001,
        dueDate: "2026-03-10",
      }),
    ).rejects.toMatchObject({ code: "POLICY_VIOLATION" });
  });

  it("rechaza lotes que exceden el número de alumnos permitido", async () => {
    const context = makeContext({
      policy: { ...defaultAgentPolicy, maxBulkPayments: 2 },
    });

    await expect(
      handleCreateBulkPaymentRequests(context, {
        studentIds: ["stu_001", "stu_002", "stu_004"],
        concept: "colegiatura",
        dueDate: "2026-03-10",
      }),
    ).rejects.toMatchObject({ code: "POLICY_VIOLATION" });
  });

  it("estima el monto del lote desde los saldos antes de cobrar", async () => {
    const context = makeContext({
      policy: { ...defaultAgentPolicy, maxBulkAmountCents: 100 },
    });

    await expect(
      handleCreateBulkPaymentRequests(context, {
        studentIds: ["stu_001"],
        concept: "colegiatura",
        dueDate: "2026-03-10",
      }),
    ).rejects.toMatchObject({ code: "POLICY_VIOLATION" });
  });

  it("no permite que el LLM cambie de escuela por su cuenta", async () => {
    const context = makeContext();

    await expect(
      handleSearchStudents(context, {
        query: "sofia",
        schoolId: "sch_otra",
      }),
    ).rejects.toMatchObject({ code: "POLICY_VIOLATION" });
  });

  it("convierte errores de dominio en resultados ok:false para el LLM", async () => {
    const context = makeContext();
    const result = await toToolResult(() =>
      handleCancelPaymentRequest(context, {
        paymentRequestId: "pay_seed_paid_001",
        reason: "Intento inválido",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STATE_TRANSITION");
    }
  });

  it("registra exactamente las herramientas contratadas", () => {
    const tools = createAgentTools(makeContext());

    expect(Object.keys(tools).sort()).toEqual(
      Object.values(AgentToolName).sort(),
    );
  });
});
