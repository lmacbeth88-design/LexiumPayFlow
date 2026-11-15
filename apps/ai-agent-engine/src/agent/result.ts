import {
  DomainError,
  type AgentToolResult,
  type ToolError,
} from "@lexium/shared-contracts";

export async function toToolResult<T>(
  fn: () => Promise<T>,
): Promise<AgentToolResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof DomainError) {
      const failure: ToolError = {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      };
      return { ok: false, error: failure };
    }
    throw error;
  }
}
