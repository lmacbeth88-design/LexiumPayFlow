import { z } from "zod";

export const DomainErrorCodeSchema = z.enum([
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "INVALID_STATE_TRANSITION",
  "POLICY_VIOLATION",
  "CONFLICT",
  "UPSTREAM_ERROR",
]);

export type DomainErrorCode = z.infer<typeof DomainErrorCodeSchema>;

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: unknown;

  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}
