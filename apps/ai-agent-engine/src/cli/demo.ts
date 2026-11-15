import type {
  AgentToolResult,
  CreateBulkPaymentRequestsOutput,
  GetLedgerAuditOutput,
  GetPaymentStatusOutput,
  GetReconciliationSummaryOutput,
  SearchStudentsOutput,
} from "@lexium/shared-contracts";
import { AgentToolName } from "@lexium/shared-contracts";
import { runAgent } from "../agent/create-agent";
import { createAgentTools } from "../agent/tools";
import { MockCoreBackend } from "../mocks/mock-core-backend";

const DEMO_NOW = new Date("2026-03-05T18:00:00.000Z");
const SCHOOL_ID = "sch_benitojuarez";
const SCHOOL_NAME = "Colegio Benito Juárez";

type LooseTool = {
  execute?: (
    input: unknown,
    options: { toolCallId: string; messages: never[] },
  ) => Promise<unknown>;
};

function unwrap<T>(result: unknown): T {
  const toolResult = result as AgentToolResult<T>;
  if (!toolResult.ok) {
    throw new Error(`[${toolResult.error.code}] ${toolResult.error.message}`);
  }
  return toolResult.data;
}

async function runToolScenario(): Promise<void> {
  const backend = new MockCoreBackend({ now: DEMO_NOW });
  const rawTools = createAgentTools({
    backend,
    schoolId: SCHOOL_ID,
    schoolName: SCHOOL_NAME,
    now: DEMO_NOW,
  });
  const tools = rawTools as unknown as Record<string, LooseTool>;
  let callSequence = 0;

  const call = async (name: string, input: unknown): Promise<unknown> => {
    callSequence += 1;
    const current = tools[name];
    if (!current?.execute) {
      throw new Error(`Herramienta no encontrada: ${name}`);
    }
    return current.execute(input, {
      toolCallId: `demo_${callSequence}`,
      messages: [],
    });
  };

  const print = (title: string, value: unknown): void => {
    console.log(`\n=== ${title} ===`);
    console.log(JSON.stringify(value, null, 2));
  };

  const students = unwrap<SearchStudentsOutput>(
    await call(AgentToolName.searchStudents, { query: "ramirez" }),
  );
  print("1. Alumnos encontrados", students);

  const bulk = unwrap<CreateBulkPaymentRequestsOutput>(
    await call(AgentToolName.createBulkPaymentRequests, {
      studentIds: students.students.map((student) => student.id),
      concept: "colegiatura",
      dueDate: "2026-03-10",
    }),
  );
  print("2. Cobro masivo de colegiaturas", bulk);

  const firstPayment = bulk.created[0];
  if (!firstPayment) {
    throw new Error("El escenario no generó solicitudes de pago.");
  }

  const simulated = backend.simulatePayment(firstPayment.id);
  print("3. Webhook simulado", {
    paymentRequestId: simulated.paymentRequest.id,
    status: simulated.paymentRequest.status,
    transaction: simulated.transaction,
    receipt: simulated.receipt,
  });

  const status = unwrap<GetPaymentStatusOutput>(
    await call(AgentToolName.getPaymentStatus, {
      reference: firstPayment.reference,
    }),
  );
  print("4. Estado y trazabilidad del pago", status);

  const reconciliation = unwrap<GetReconciliationSummaryOutput>(
    await call(AgentToolName.getReconciliationSummary, {
      from: "2026-03-01",
      to: "2026-03-31",
    }),
  );
  print("5. Conciliación del periodo", reconciliation);

  const audit = unwrap<GetLedgerAuditOutput>(
    await call(AgentToolName.getLedgerAudit, {
      paymentRequestId: firstPayment.id,
    }),
  );
  print("6. Auditoría del ledger", audit);
}

async function runAgentMode(prompt: string): Promise<void> {
  const backend = new MockCoreBackend({ now: DEMO_NOW });

  const result = await runAgent({
    backend,
    schoolId: SCHOOL_ID,
    schoolName: SCHOOL_NAME,
    now: DEMO_NOW,
    messages: [{ role: "user", content: prompt }],
  });

  console.log("\n=== Respuesta del agente ===");
  console.log(result.text);
  console.log("\nHerramientas invocadas:");
  console.log(JSON.stringify(result.toolCalls, null, 2));
}

const agentMode = process.argv.includes("--agent");
const prompt = process.argv
  .slice(2)
  .filter((argument) => argument !== "--agent")
  .join(" ");

if (agentMode) {
  runAgentMode(
    prompt ||
      "¿Cuánto se ha cobrado en marzo y qué pagos siguen pendientes?",
  ).catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Error desconocido al ejecutar el agente.",
    );
    process.exitCode = 1;
  });
} else {
  runToolScenario().catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Error desconocido al ejecutar el escenario.",
    );
    process.exitCode = 1;
  });
}
