import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { POST } from "./route.ts";

const originalApiKey = process.env.NVIDIA_NIM_API_KEY;
const originalModel = process.env.NVIDIA_NIM_MODEL;
const originalLanguage = process.env.NVIDIA_NIM_LANGUAGE;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.NVIDIA_NIM_API_KEY;
  else process.env.NVIDIA_NIM_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.NVIDIA_NIM_MODEL;
  else process.env.NVIDIA_NIM_MODEL = originalModel;
  if (originalLanguage === undefined) delete process.env.NVIDIA_NIM_LANGUAGE;
  else process.env.NVIDIA_NIM_LANGUAGE = originalLanguage;
  globalThis.fetch = originalFetch;
});

function audioRequest(type = "audio/webm") {
  const formData = new FormData();
  formData.append("file", new Blob(["sample audio"], { type }), "voice.webm");
  return new Request("http://localhost/api/voice/transcribe", {
    method: "POST",
    body: formData,
  });
}

test("transcription route requires a server-side NVIDIA key", async () => {
  delete process.env.NVIDIA_NIM_API_KEY;

  const response = await POST(audioRequest());

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /NVIDIA_NIM_API_KEY/);
});

test("transcription route rejects unsupported audio types", async () => {
  process.env.NVIDIA_NIM_API_KEY = "test-key";

  const response = await POST(audioRequest("text/plain"));

  assert.equal(response.status, 415);
});

test("transcription route calls NIM with the configured model and language", async () => {
  process.env.NVIDIA_NIM_API_KEY = "test-key";
  process.env.NVIDIA_NIM_MODEL = "openai/whisper-large-v3";
  process.env.NVIDIA_NIM_LANGUAGE = "es";
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return Response.json({ text: " abre cobranza " });
  };

  const response = await POST(audioRequest());

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "abre cobranza" });
  assert.equal(
    capturedUrl,
    "https://integrate.api.nvidia.com/v1/audio/transcriptions",
  );
  assert.equal(
    new Headers(capturedInit?.headers).get("authorization"),
    "Bearer test-key",
  );
  assert.ok(capturedInit?.body instanceof FormData);
  const sentForm = capturedInit.body;
  assert.equal(sentForm.get("model"), "openai/whisper-large-v3");
  assert.equal(sentForm.get("language"), "es");
  assert.equal(sentForm.get("response_format"), "json");
  assert.ok(sentForm.get("file") instanceof File);
});
