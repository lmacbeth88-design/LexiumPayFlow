import { z } from "zod";

const optionalDate = z.iso.datetime().optional();

export const createObligationSchema = z.object({
  studentName: z.string().trim().min(1).max(200),
  studentReference: z.string().trim().max(120).optional(),
  concept: z.string().trim().min(1).max(240),
  amountCents: z.number().int().positive().max(100_000_000),
  dueAt: optionalDate,
});

export const updateObligationSchema = z
  .object({
    studentName: z.string().trim().min(1).max(200).optional(),
    studentReference: z.string().trim().max(120).nullable().optional(),
    concept: z.string().trim().min(1).max(240).optional(),
    amountCents: z.number().int().positive().max(100_000_000).optional(),
    dueAt: z.iso.datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Debe incluir al menos un campo para actualizar");

export const createPaymentRequestSchema = z.object({
  obligationId: z.uuid(),
});
