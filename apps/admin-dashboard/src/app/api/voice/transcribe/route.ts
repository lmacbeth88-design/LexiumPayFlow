export const runtime = "nodejs";

const NVIDIA_TRANSCRIPTIONS_URL =
  "https://integrate.api.nvidia.com/v1/audio/transcriptions";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + 256 * 1024;
const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/flac": "flac",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-wav": "wav",
};

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return errorResponse("Origen de solicitud no permitido.", 403);
      }
    } catch {
      return errorResponse("Origen de solicitud no permitido.", 403);
    }
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("El audio supera el límite de 25 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Se requiere una solicitud multipart/form-data válida.", 400);
  }

  const audio = formData.get("file");
  if (!(audio instanceof File)) {
    return errorResponse("Adjunta un archivo de audio en el campo «file».", 400);
  }
  if (audio.size === 0) {
    return errorResponse("El archivo de audio está vacío.", 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse("El audio supera el límite de 25 MB.", 413);
  }

  const mimeType = audio.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = AUDIO_EXTENSIONS[mimeType];
  if (!extension) {
    return errorResponse("Formato de audio no compatible.", 415);
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse(
      "Falta NVIDIA_NIM_API_KEY en la configuración del servidor.",
      503,
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.append(
    "file",
    new Blob([await audio.arrayBuffer()], { type: mimeType }),
    `recording.${extension}`,
  );
  upstreamForm.append(
    "model",
    process.env.NVIDIA_NIM_MODEL?.trim() || "openai/whisper-large-v3",
  );
  upstreamForm.append(
    "language",
    process.env.NVIDIA_NIM_LANGUAGE?.trim() || "es",
  );
  upstreamForm.append("response_format", "json");

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(NVIDIA_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return errorResponse("NVIDIA NIM tardó demasiado en transcribir el audio.", 504);
    }
    return errorResponse("No se pudo conectar con NVIDIA NIM.", 502);
  }

  if (!upstreamResponse.ok) {
    if (upstreamResponse.status === 429) {
      return errorResponse("NVIDIA NIM alcanzó su límite de solicitudes; intenta más tarde.", 429);
    }
    if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
      return errorResponse("NVIDIA NIM rechazó la clave configurada.", 502);
    }
    return errorResponse(
      `NVIDIA NIM no pudo transcribir el audio (HTTP ${upstreamResponse.status}).`,
      502,
    );
  }

  let result: unknown;
  try {
    result = await upstreamResponse.json();
  } catch {
    return errorResponse("NVIDIA NIM devolvió una respuesta inválida.", 502);
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("text" in result) ||
    typeof result.text !== "string"
  ) {
    return errorResponse("NVIDIA NIM no devolvió texto de transcripción.", 502);
  }

  return Response.json({ text: result.text.trim() });
}
