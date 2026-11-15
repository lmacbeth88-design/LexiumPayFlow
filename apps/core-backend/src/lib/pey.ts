import { getConfig } from "./config";

export type PeyRequest = {
  amountCents: number;
  currency: "MXN";
  concept: string;
  reference: string;
  callbackUrl: string;
};

export type PeyPayment = {
  transactionId: string;
  paymentUrl: string;
  qrCode: string | null;
  rawResponse: unknown;
};

export class PeyApiError extends Error {}

export async function createCodiRequest(payload: PeyRequest): Promise<PeyPayment> {
  const config = getConfig();
  const endpoint = new URL(config.PEY_CODI_REQUEST_PATH, config.PEY_API_BASE_URL);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.PEY_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": payload.reference,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PeyApiError(`Pey respondió HTTP ${response.status}`);
  }
  if (body === null || typeof body !== "object") {
    throw new PeyApiError("Pey devolvió una respuesta JSON inválida");
  }

  const data = body as Record<string, unknown>;
  if (
    typeof data.transactionId !== "string" ||
    typeof data.paymentUrl !== "string" ||
    (data.qrCode !== undefined && data.qrCode !== null && typeof data.qrCode !== "string")
  ) {
    throw new PeyApiError("Respuesta de Pey incompatible: se esperan transactionId y paymentUrl");
  }
  return {
    transactionId: data.transactionId,
    paymentUrl: data.paymentUrl,
    qrCode: typeof data.qrCode === "string" ? data.qrCode : null,
    rawResponse: body,
  };
}
