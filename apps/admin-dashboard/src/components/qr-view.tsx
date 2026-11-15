"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Copy,
  Download,
  Mail,
  MessageCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  formatPeriod,
} from "@/lib/format";
import { CONCEPT_LABEL } from "@/lib/labels";
import type { PaymentRow } from "@/lib/metrics";
import {
  QR_CHANNEL_LABEL,
  qrFileName,
  qrMessage,
  qrPayload,
  qrRecipient,
  seedDeliveries,
  type QrChannel,
  type QrDelivery,
} from "@/lib/qr";

const CHANNEL_META: Record<
  QrChannel,
  { icon: LucideIcon; hint: string }
> = {
  whatsapp: {
    icon: MessageCircle,
    hint: "Al tutor registrado",
  },
  email: {
    icon: Mail,
    hint: "Con liga de pago",
  },
  sms: {
    icon: Smartphone,
    hint: "Mensaje corto",
  },
};

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  width: 720,
  color: {
    dark: "#12292a",
    light: "#ffffff",
  },
};

const textareaClassName =
  "min-h-28 w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

export function QrView({
  rows,
  initialRequestId,
}: {
  rows: PaymentRow[];
  initialRequestId?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => {
    const initial = initialRequestId
      ? rows.find((row) => row.request.id === initialRequestId)
      : undefined;
    return initial?.request.id ?? rows[0]?.request.id ?? "";
  });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrNonce, setQrNonce] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [channel, setChannel] = useState<QrChannel>("whatsapp");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [deliveries, setDeliveries] = useState<QrDelivery[]>(() =>
    seedDeliveries(rows),
  );

  const selected =
    rows.find((row) => row.request.id === selectedId) ?? rows[0] ?? null;
  const payload = selected ? qrPayload(selected) : "";

  useEffect(() => {
    let cancelled = false;
    setQrDataUrl(null);
    setQrError(null);

    if (!payload) {
      return;
    }

    QRCode.toDataURL(payload, QR_OPTIONS)
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError("No fue posible generar el QR con el payload actual.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [payload, qrNonce]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return rows;
    }
    return rows.filter((row) =>
      [
        row.studentName,
        row.guardianName ?? "",
        row.request.reference,
        row.request.description,
        CONCEPT_LABEL[row.request.concept],
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query, rows]);

  const rowsById = useMemo(
    () => new Map(rows.map((row) => [row.request.id, row])),
    [rows],
  );

  const totalAmount = rows.reduce(
    (sum, row) => sum + row.request.amountCents,
    0,
  );
  const deliveredRequests = new Set(
    deliveries.map((delivery) => delivery.requestId),
  ).size;
  const coverage = rows.length === 0 ? 0 : deliveredRequests / rows.length;

  function selectRow(row: PaymentRow) {
    setSelectedId(row.request.id);
    setNotice(null);
  }

  function openSendDialog() {
    if (!selected) {
      return;
    }
    setChannel("whatsapp");
    setRecipient(qrRecipient(selected, "whatsapp"));
    setMessage(qrMessage(selected));
    setSendOpen(true);
  }

  function chooseChannel(next: QrChannel) {
    setChannel(next);
    if (selected) {
      setRecipient(qrRecipient(selected, next));
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copiado al portapapeles.`);
    } catch {
      setNotice(`${label}: ${value}`);
    }
  }

  function downloadQr() {
    if (!qrDataUrl || !selected) {
      return;
    }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = qrFileName(selected);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setNotice(`QR de ${selected.request.reference} descargado en PNG.`);
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !recipient.trim()) {
      return;
    }
    const delivery: QrDelivery = {
      id: `qr_delivery_${Date.now()}`,
      requestId: selected.request.id,
      channel,
      recipient: recipient.trim(),
      sentAt: new Date().toISOString(),
      status: "enviado",
    };
    setDeliveries((current) => [delivery, ...current]);
    setSendOpen(false);
    setNotice(
      `Envío simulado: QR de ${selected.request.reference} enviado por ${QR_CHANNEL_LABEL[channel]} a ${delivery.recipient}.`,
    );
  }

  function viewDelivery(delivery: QrDelivery) {
    setSelectedId(delivery.requestId);
    setNotice(
      `QR de ${rowsById.get(delivery.requestId)?.request.reference ?? delivery.requestId} seleccionado.`,
    );
    document
      .getElementById("qr-preview")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!selected) {
    return (
      <Card>
        <CardContent className="grid min-h-[360px] place-items-center px-6 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <QrCode className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold">
              No hay solicitudes activas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea una solicitud de pago en Cobranza para generar su código QR.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "QR disponibles",
            value: `${rows.length}`,
            hint: "Solicitudes activas",
            icon: QrCode,
            tone: "bg-primary/10 text-primary",
          },
          {
            label: "Monto por cobrar",
            value: formatMoney(totalAmount),
            hint: "Cobertura de cobranza",
            icon: Wallet,
            tone: "bg-warning-soft text-[oklch(0.45_0.12_70)]",
          },
          {
            label: "QR enviados",
            value: `${deliveredRequests}`,
            hint: `${formatPercent(coverage)} de avance`,
            icon: Send,
            tone: "bg-success-soft text-success",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-md",
                  item.tone,
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="font-numeric mt-0.5 truncate text-lg font-semibold">
                  {item.value}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.hint}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {notice ? (
        <div className="flex items-start gap-2 rounded-lg border border-success/15 bg-success-soft px-4 py-2.5 text-xs text-success">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Solicitudes con QR
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Elige una solicitud activa para previsualizar, descargar o
                  enviar su código.
                </p>
              </div>
              <Badge tone="info">CoDi</Badge>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar alumno, tutor o referencia"
                className="h-9 bg-surface pl-9 text-xs"
                aria-label="Buscar solicitudes con QR"
              />
            </div>
          </div>

          <div className="max-h-[620px] divide-y divide-border overflow-y-auto">
            {filteredRows.map((row) => {
              const active = row.request.id === selected.request.id;
              return (
                <button
                  key={row.request.id}
                  type="button"
                  onClick={() => selectRow(row)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                    active
                      ? "bg-primary/[0.055]"
                      : "hover:bg-muted/55",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-md border",
                      active
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-border bg-surface-strong text-muted-foreground",
                    )}
                  >
                    <QrCode className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {row.studentName}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {CONCEPT_LABEL[row.request.concept]} ·{" "}
                      {formatPeriod(row.request.period)} ·{" "}
                      {row.request.reference}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-numeric block text-sm font-semibold">
                      {formatMoney(row.request.amountCents)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      Vence {formatDate(row.request.dueDate)}
                    </span>
                  </span>
                </button>
              );
            })}
            {filteredRows.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium">Sin coincidencias</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ajusta la búsqueda para encontrar otra solicitud.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              {filteredRows.length} de {rows.length} solicitudes activas
            </span>
            <span className="flex items-center gap-1.5">
              <ScanLine className="size-3.5" />
              QR CoDi demo
            </span>
          </div>
        </Card>

        <Card id="qr-preview" className="scroll-mt-24 overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Vista previa
                </p>
                <Badge tone="info">CoDi</Badge>
              </div>
              <h2 className="mt-2 truncate text-base font-semibold tracking-tight">
                QR de {selected.studentName}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Generado localmente desde el payload de la solicitud.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setQrNonce((current) => current + 1)}
              title="Regenerar QR"
            >
              <RefreshCw />
              <span className="sr-only">Regenerar QR</span>
            </Button>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <div className="mx-auto w-full max-w-[320px] rounded-xl border border-border bg-white p-5 shadow-[0_12px_40px_oklch(0.2_0.02_245_/_0.09)]">
              <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-[oklch(0.42_0.06_185)]">
                <span>Pago CoDi</span>
                <span>Lexium PayFlow</span>
              </div>
              <div className="mt-4 grid min-h-[224px] place-items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Código QR para ${selected.studentName}`}
                    className="aspect-square w-full max-w-[224px]"
                  />
                ) : qrError ? (
                  <p className="px-4 text-center text-xs text-danger">
                    {qrError}
                  </p>
                ) : (
                  <div className="grid size-[224px] animate-pulse place-items-center rounded-md bg-muted/50 text-muted-foreground">
                    <QrCode className="size-8" />
                    <span className="sr-only">Generando QR</span>
                  </div>
                )}
              </div>
              <div className="mt-4 border-t border-black/10 pt-3 text-center">
                <p className="font-numeric text-xl font-bold text-ink">
                  {formatMoney(selected.request.amountCents)}
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-ink/75">
                  {selected.studentName}
                </p>
                <p className="font-numeric mt-1 text-[10px] text-ink/55">
                  {selected.request.reference}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Tutor
                </dt>
                <dd className="mt-1 truncate font-medium">
                  {selected.guardianName ?? "Sin tutor"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Vence
                </dt>
                <dd className="mt-1 font-medium">
                  {formatDate(selected.request.dueDate)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Concepto
                </dt>
                <dd className="mt-1 font-medium">
                  {CONCEPT_LABEL[selected.request.concept]}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Periodo
                </dt>
                <dd className="mt-1 font-medium">
                  {formatPeriod(selected.request.period)}
                </dd>
              </div>
            </dl>

            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-strong/60 px-3 py-2">
              <Sparkles className="size-3.5 shrink-0 text-primary" />
              <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">
                {payload}
              </p>
              <button
                type="button"
                onClick={() => copyText(payload, "Payload QR")}
                className="shrink-0 text-[10px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Copiar
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-2">
            <Button
              type="button"
              onClick={downloadQr}
              disabled={!qrDataUrl}
              className="w-full"
            >
              <Download />
              Descargar QR en PNG
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  copyText(
                    selected.request.paymentUrl ?? payload,
                    "Liga de pago",
                  )
                }
              >
                <Copy />
                Copiar liga
              </Button>
              <Button type="button" variant="accent" onClick={openSendDialog}>
                <Send />
                Enviar QR
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Envíos recientes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Historial local de QRs compartidos con tutores.
            </p>
          </div>
          <StatusBadge label="Envío simulado" tone="warning" dot={false} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solicitud</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.slice(0, 6).map((delivery) => {
              const row = rowsById.get(delivery.requestId);
              const ChannelIcon = CHANNEL_META[delivery.channel].icon;
              return (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <p className="font-medium">
                      {row?.studentName ?? delivery.requestId}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {row?.request.reference ?? delivery.requestId}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {delivery.recipient}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <ChannelIcon className="size-3.5 text-muted-foreground" />
                      {QR_CHANNEL_LABEL[delivery.channel]}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(delivery.sentAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge label="Enviado" tone="success" dot={false} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => viewDelivery(delivery)}
                    >
                      <QrCode />
                      Ver QR
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-sm font-medium">Sin envíos todavía</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selecciona una solicitud y envía su primer QR.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar QR de pago</DialogTitle>
            <DialogDescription>
              Comparte el código con el tutor de {selected.studentName}. En modo
              demo el envío se registra localmente y no sale del navegador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(CHANNEL_META) as QrChannel[]).map((value) => {
                const meta = CHANNEL_META[value];
                const Icon = meta.icon;
                const active = channel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => chooseChannel(value)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-primary/35 bg-primary/[0.06] text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <Icon className="size-4" />
                      {QR_CHANNEL_LABEL[value]}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {meta.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="block space-y-1.5 text-xs font-medium">
              Destinatario
              <Input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder={
                  channel === "email"
                    ? "tutor@example.com"
                    : "+52 55 1234 5678"
                }
                required
              />
            </label>

            <label className="block space-y-1.5 text-xs font-medium">
              Mensaje
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={textareaClassName}
              />
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-strong/60 p-3">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md bg-white p-1">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : (
                  <QrCode className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {selected.studentName}
                </p>
                <p className="font-numeric mt-0.5 text-sm font-semibold">
                  {formatMoney(selected.request.amountCents)}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {selected.request.reference}
                </p>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" variant="accent">
                <Send />
                Enviar QR
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
