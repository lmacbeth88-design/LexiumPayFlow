import { z } from "zod";
import {
  CurrencySchema,
  GuardianIdSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  PaymentRequestIdSchema,
  PeriodSchema,
  PositiveAmountCentsSchema,
  SchoolIdSchema,
  StudentIdSchema,
  TransactionIdSchema,
} from "./common";

export const PaymentConceptSchema = z.enum([
  "colegiatura",
  "inscripcion",
  "uniformes",
  "transporte",
  "otro",
]);

export type PaymentConcept = z.infer<typeof PaymentConceptSchema>;

export const PaymentMethodSchema = z.enum(["codi", "spei"]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentRequestStatusSchema = z.enum([
  "pending",
  "sent",
  "paid",
  "expired",
  "cancelled",
]);

export type PaymentRequestStatus = z.infer<typeof PaymentRequestStatusSchema>;

export const PaymentRequestSchema = z.object({
  id: PaymentRequestIdSchema,
  schoolId: SchoolIdSchema,
  studentId: StudentIdSchema,
  payerId: GuardianIdSchema,
  concept: PaymentConceptSchema,
  period: PeriodSchema,
  description: z.string().min(1),
  amountCents: PositiveAmountCentsSchema,
  currency: CurrencySchema,
  status: PaymentRequestStatusSchema,
  method: PaymentMethodSchema,
  reference: z.string().min(4),
  codiQrPayload: z.string().optional(),
  paymentUrl: z.string().url().optional(),
  dueDate: IsoDateSchema,
  expiresAt: IsoDateTimeSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  paidAt: IsoDateTimeSchema.optional(),
  cancelledAt: IsoDateTimeSchema.optional(),
  cancellationReason: z.string().optional(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

export const PaymentTransactionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "rejected",
]);

export type PaymentTransactionStatus = z.infer<
  typeof PaymentTransactionStatusSchema
>;

export const PaymentTransactionSchema = z.object({
  id: TransactionIdSchema,
  paymentRequestId: PaymentRequestIdSchema.nullable(),
  schoolId: SchoolIdSchema,
  amountCents: PositiveAmountCentsSchema,
  currency: CurrencySchema,
  method: PaymentMethodSchema,
  status: PaymentTransactionStatusSchema,
  reconciled: z
    .boolean()
    .describe("true cuando el webhook coincidió con una solicitud y monto"),
  bankReference: z.string().nullable(),
  payerName: z.string().nullable(),
  paidAt: IsoDateTimeSchema.nullable(),
  receivedAt: IsoDateTimeSchema,
  webhookEventId: z.string().min(1),
});

export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;
