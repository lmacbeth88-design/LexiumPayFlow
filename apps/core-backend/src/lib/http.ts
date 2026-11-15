export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function errorResponse(error: unknown): Response {
  console.error(error);
  return json({ error: "Error interno del servidor" }, 500);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "El cuerpo debe ser JSON válido");
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }
  if (error instanceof SyntaxError) {
    return json({ error: "El cuerpo debe ser JSON válido" }, 400);
  }
  return errorResponse(error);
}
