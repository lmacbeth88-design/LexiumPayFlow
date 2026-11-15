import { z } from "zod";

export const IsoDateTimeSchema = z.string().datetime({ offset: true }).describe(
  "Fecha y hora ISO-8601 con zona horaria",
);

export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado: YYYY-MM-DD")
  .describe("Fecha ISO-8601 sin hora");

export const PeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato esperado: YYYY-MM")
  .describe("Periodo escolar o de cobranza (año-mes)");

export const CurrencySchema = z.literal("MXN");

export const PositiveAmountCentsSchema = z
  .number()
  .int()
  .positive()
  .describe("Monto en centavos de peso mexicano (MXN). $3,500.00 = 350000");

export type IsoDate = z.infer<typeof IsoDateSchema>;
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type Currency = z.infer<typeof CurrencySchema>;

export const idSchema = (prefix: string) =>
  z
    .string()
    .regex(
      new RegExp(`^${prefix}_[A-Za-z0-9-]+$`),
      `Se esperaba un identificador con prefijo ${prefix}_`,
    );

export const SchoolIdSchema = idSchema("sch");
export const StudentIdSchema = idSchema("stu");
export const GuardianIdSchema = idSchema("grd");
export const BalanceIdSchema = idSchema("bal");
export const PaymentRequestIdSchema = idSchema("pay");
export const TransactionIdSchema = idSchema("txn");
export const ReceiptIdSchema = idSchema("rcp");

export type SchoolId = z.infer<typeof SchoolIdSchema>;
export type StudentId = z.infer<typeof StudentIdSchema>;
export type GuardianId = z.infer<typeof GuardianIdSchema>;
export type BalanceId = z.infer<typeof BalanceIdSchema>;
export type PaymentRequestId = z.infer<typeof PaymentRequestIdSchema>;
export type TransactionId = z.infer<typeof TransactionIdSchema>;
export type ReceiptId = z.infer<typeof ReceiptIdSchema>;
