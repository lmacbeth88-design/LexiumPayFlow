import { z } from "zod";
import {
  CurrencySchema,
  IsoDateTimeSchema,
  PaymentRequestIdSchema,
  PositiveAmountCentsSchema,
  ReceiptIdSchema,
  SchoolIdSchema,
  StudentIdSchema,
} from "./common";

export const ReceiptSchema = z.object({
  id: ReceiptIdSchema,
  paymentRequestId: PaymentRequestIdSchema,
  schoolId: SchoolIdSchema,
  studentId: StudentIdSchema,
  folio: z.string().min(3),
  amountCents: PositiveAmountCentsSchema,
  currency: CurrencySchema,
  issuedAt: IsoDateTimeSchema,
  pdfUrl: z.string().url().nullable(),
  ledgerHash: z.string().length(64),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
