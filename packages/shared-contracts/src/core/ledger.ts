import { z } from "zod";
import { IsoDateTimeSchema, PaymentRequestIdSchema } from "./common";

export const LedgerEntryTypeSchema = z.enum([
  "payment_request.created",
  "payment_request.cancelled",
  "webhook.received",
  "payment.confirmed",
  "payment.rejected",
  "receipt.issued",
  "reminder.sent",
]);

export type LedgerEntryType = z.infer<typeof LedgerEntryTypeSchema>;

export const LedgerEntrySchema = z.object({
  sequence: z.number().int().nonnegative(),
  prevHash: z.string().length(64).nullable(),
  hash: z.string().length(64),
  type: LedgerEntryTypeSchema,
  paymentRequestId: PaymentRequestIdSchema.nullable(),
  payload: z.record(z.unknown()),
  createdAt: IsoDateTimeSchema,
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
