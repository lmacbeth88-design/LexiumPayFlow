import type { CoreBackendPort } from "@lexium/shared-contracts";
import { generateText, stepCountIs } from "ai";
import type { AgentModel } from "./model";
import { resolveModel } from "./model";
import {
  defaultAgentPolicy,
  type AgentPolicy,
} from "./policy";
import { buildSystemPrompt } from "./prompts";
import { createAgentTools } from "./tools";

export interface AgentTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AgentToolCall {
  toolName: string;
  input: unknown;
}

export interface RunAgentOptions {
  backend: CoreBackendPort;
  schoolId: string;
  schoolName?: string;
  messages: AgentTurn[];
  model?: AgentModel;
  now?: Date;
  policy?: AgentPolicy;
  maxSteps?: number;
  temperature?: number;
}

export interface RunAgentResult {
  text: string;
  toolCalls: AgentToolCall[];
  steps: number;
  finishReason: string;
}

export async function runAgent(
  options: RunAgentOptions,
): Promise<RunAgentResult> {
  const now = options.now ?? new Date();
  const policy = options.policy ?? defaultAgentPolicy;
  const tools = createAgentTools({
    backend: options.backend,
    schoolId: options.schoolId,
    now,
    policy,
    ...(options.schoolName ? { schoolName: options.schoolName } : {}),
  });

  const result = await generateText({
    model: options.model ?? resolveModel(),
    system: buildSystemPrompt({
      schoolId: options.schoolId,
      now,
      policy,
      ...(options.schoolName ? { schoolName: options.schoolName } : {}),
    }),
    messages: options.messages,
    tools,
    stopWhen: stepCountIs(options.maxSteps ?? 8),
    temperature: options.temperature ?? 0,
  });

  const toolCalls: AgentToolCall[] = result.steps.flatMap((step) =>
    step.toolCalls.map((call) => ({
      toolName: call.toolName,
      input: (call as { input?: unknown }).input,
    })),
  );

  return {
    text: result.text,
    toolCalls,
    steps: result.steps.length,
    finishReason: result.finishReason,
  };
}
