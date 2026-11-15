"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";
import { interpretDashboardCommand } from "@lexium/ai-agent-engine/agent/local-interpreter";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { getMetrics } from "@/lib/metrics";
import { dashboardData } from "@/lib/mock-data";

const MAX_RECORDING_MS = 30_000;

export function VoiceAssistant() {
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const recordingTimeoutRef = useRef<number | null>(null);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const metrics = getMetrics(dashboardData);

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current !== null) {
        window.clearTimeout(recordingTimeoutRef.current);
      }
      discardRecordingRef.current = true;
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      transcriptionAbortRef.current?.abort();
    };
  }, []);

  function runCommand(rawCommand: string) {
    const text = rawCommand.trim();
    if (!text) return;
    if (text.length > 500) {
      setError("La orden supera el límite de 500 caracteres.");
      return;
    }

    setCommand(text);
    setError("");
    const result = interpretDashboardCommand(text);
    switch (result.type) {
      case "navigate":
        router.push(result.href);
        setResponse(`Abriendo ${result.label}.`);
        return;
      case "summary": {
        const values = {
          collected: `Cobrado en los datos demo: ${formatMoney(metrics.collectedCents)}.`,
          pending: `Saldo pendiente en los datos demo: ${formatMoney(metrics.pendingCents)}.`,
          overdue: `Saldo vencido en los datos demo: ${formatMoney(metrics.overdueCents)}.`,
          active: `Solicitudes activas en los datos demo: ${metrics.activeRequests}.`,
          unmatched: `Pagos sin conciliar en los datos demo: ${metrics.unmatchedTransactions}.`,
        };
        setResponse(values[result.metric]);
        return;
      }
      case "reset_view":
        window.dispatchEvent(new Event("payflow:clear-view"));
        setResponse("Te pediré confirmar el restablecimiento de esta sección.");
        return;
      case "export_pdf":
        setResponse("Abriendo la opción de impresión/guardar como PDF.");
        window.print();
        return;
      case "financial_action":
        router.push("/cobranza");
        setResponse(
          "Te llevo a Cobranza para revisar la solicitud. No crearé, enviaré ni cancelaré pagos por voz; requieren revisión y confirmación humana. Este dashboard sigue en modo demo.",
        );
        return;
      case "unknown":
        setResponse(
          "No reconocí esa orden. Prueba: «abre cobranza», «muéstrame lo cobrado», «limpia esta sección» o «exporta a PDF».",
        );
    }
  }

  function releaseMediaStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  async function transcribeAudio(audio: Blob) {
    const controller = new AbortController();
    transcriptionAbortRef.current = controller;
    setTranscribing(true);
    setError("");
    setResponse("");
    try {
      const extension = audio.type.includes("mp4")
        ? "mp4"
        : audio.type.includes("ogg")
          ? "ogg"
          : "webm";
      const formData = new FormData();
      formData.append(
        "file",
        new File([audio], `recording.${extension}`, {
          type: audio.type || "audio/webm",
        }),
      );
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "No se pudo transcribir el audio.";
        throw new Error(message);
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("text" in payload) ||
        typeof payload.text !== "string"
      ) {
        throw new Error("La API no devolvió una transcripción válida.");
      }
      if (!payload.text.trim()) {
        setError("No se detectó voz. Intenta de nuevo o escribe la orden.");
        return;
      }
      runCommand(payload.text);
    } catch (transcriptionError) {
      if (!controller.signal.aborted) {
        setError(
          transcriptionError instanceof Error
            ? transcriptionError.message
            : "Ocurrió un error al transcribir el audio.",
        );
      }
    } finally {
      if (transcriptionAbortRef.current === controller) {
        transcriptionAbortRef.current = null;
      }
      setTranscribing(false);
    }
  }

  async function startListening() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Puedes escribir la orden.");
      return;
    }

    setError("");
    setResponse("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];
      discardRecordingRef.current = false;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        discardRecordingRef.current = true;
        setListening(false);
        setError("Falló la grabación. Revisa el micrófono e inténtalo de nuevo.");
        releaseMediaStream();
      };
      recorder.onstop = () => {
        const audio = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];
        recorderRef.current = null;
        releaseMediaStream();
        setListening(false);
        if (recordingTimeoutRef.current !== null) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          return;
        }
        void transcribeAudio(audio);
      };
      recorder.start();
      setListening(true);
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (recordingError) {
      releaseMediaStream();
      setListening(false);
      setError(
        recordingError instanceof DOMException &&
          recordingError.name === "NotAllowedError"
          ? "Permite el acceso al micrófono para grabar la orden."
          : "No se pudo iniciar la grabación. Revisa el permiso del micrófono.",
      );
    }
  }

  function stopListening(discard = false) {
    if (discard) discardRecordingRef.current = true;
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setListening(false);
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runCommand(command);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      stopListening(true);
      transcriptionAbortRef.current?.abort();
    }
    setOpen(nextOpen);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-primary/30 text-primary"
        onClick={() => handleOpenChange(true)}
        aria-label="Abrir agente de voz"
      >
        <Mic />
        <span className="hidden sm:inline">Agente</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Agente PayFlow
            </DialogTitle>
            <DialogDescription>
              Graba hasta 30 segundos y NVIDIA NIM (openai/whisper-large-v3)
              transcribirá el audio. El audio se envía a NVIDIA y no se guarda
              en esta app; evita dictar datos personales o financieros
              sensibles. El agente de comandos sigue siendo local y las
              órdenes de cobro requieren revisión humana.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCommand} className="flex gap-2">
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Ej. Muéstrame lo cobrado"
              aria-label="Orden para el agente"
              maxLength={500}
            />
            <Button type="submit" size="icon" aria-label="Enviar orden">
              <Send />
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-surface-strong/50 p-4">
            <Button
              type="button"
              variant={listening ? "destructive" : "default"}
              onClick={
                listening ? () => stopListening() : () => void startListening()
              }
              disabled={transcribing}
              aria-pressed={listening}
              className="w-full"
            >
              {listening ? <MicOff /> : <Mic />}
              {transcribing
                ? "Transcribiendo con NVIDIA NIM…"
                : listening
                  ? "Detener grabación"
                  : "Grabar orden"}
            </Button>
            <p
              className="mt-3 text-center text-xs text-muted-foreground"
              aria-live="polite"
            >
              {transcribing
                ? "Enviando audio para transcripción…"
                : listening
                  ? "Grabando; la grabación termina automáticamente a los 30 s."
                  : command
                    ? `Orden: ${command}`
                    : "El micrófono se activa solo cuando pulsas el botón."}
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {response ? (
            <p role="status" className="rounded-md bg-info-soft px-3 py-2 text-sm text-info">
              {response}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
