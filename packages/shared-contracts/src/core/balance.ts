import { z } from "zod";
import {
  BalanceIdSchema,
  IsoDateSchema,
  PeriodSchema,
  StudentIdSchema,
} from "./common";
import { PaymentConceptSchema } from "./payment";

export const BalanceStatusSchema = z.enum([
  "pending",
  "partial",
  "paid",
  "overdue",
]);

export type BalanceStatus = z.infer<typeof BalanceStatusSchema>;

export const BalanceSchema = z.object({
  id: BalanceIdSchema,
  studentId: StudentIdSchema,
  concept: PaymentConceptSchema,
  period: PeriodSchema,
  description: z.string().min(1),
  amountDueCents: z.number().int().nonnegative(),
  amountPaidCents: z.number().int().nonnegative(),
  dueDate: IsoDateSchema,
  status: BalanceStatusSchema,
});

export type Balance = z.infer<typeof BalanceSchema>;
