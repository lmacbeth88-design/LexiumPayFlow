"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Link2,
  SearchX,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatDateTime, formatMoney, formatPercent } from "@/lib/format";
import type { PaymentRow, TransactionRow } from "@/lib/metrics";

const selectClassName =
  "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

interface Summary {
  expectedCents: number;
  collectedCents: number;
  pendingCents: number;
  unmatchedCents: number;
  counts: {
    totalRequests: number;
    paid: number;
    pending: number;
    expired: number;
    cancelled: number;
    transactions: number;
    unmatchedTransactions: number;
  };
}

export function ReconciliationView({
  summary,
  unmatchedRows,
  candidates,
}: {
  summary: Summary;
  unmatchedRows: TransactionRow[];
  candidates: PaymentRow[];
}) {
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const pendingRows = useMemo(
    () => unmatchedRows.filter((row) => !resolved[row.transaction.id]),
    [resolved, unmatchedRows],
  );

  const selectedRequest = candidates.find(
    (row) => row.request.id === selectedRequestId,
  );
  const amountsMatch =
    selected && selectedRequest
      ? selected.transaction.amountCents === selectedRequest.request.amountCents
      : false;

  function openDialog(row: TransactionRow) {
    setSelected(row);
    setSelectedRequestId("");
  }

  function confirmLink() {
    if (!selected || !selectedRequest) {
      return;
    }
    setResolved((current) => ({
      ...current,
      [selected.transaction.id]: selectedRequest.request.reference,
    }));
    setNotice(
      `Pago ${selected.transaction.bankReference ?? selected.transaction.id} vinculado a ${selectedRequest.request.reference}.`,
    );
    setSelected(null);
  }

  const collectionRate =
    summary.expectedCents === 0
      ? 0
      : summary.collectedCents / summary.expectedCents;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Esperado",
            value: formatMoney(summary.expectedCents),
            icon: CircleDollarSign,
            tone: "bg-surface-strong text-muted-foreground",
          },
          {
            label: "Cobrado",
            value: formatMoney(summary.collectedCents),
            icon: CheckCircle2,
            tone: "bg-success-soft text-success",
          },
          {
            label: "Pendiente",
            value: formatMoney(summary.pendingCents),
            icon: ArrowRight,
            tone: "bg-warning-soft text-[oklch(0.45_0.12_70)]",
          },
          {
            label: "Sin conciliar",
            value: formatMoney(summary.unmatchedCents),
            icon: SearchX,
            tone: "bg-danger-soft text-danger",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-md",
                    item.tone,
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              </div>
              <p className="font-numeric mt-3 text-xl font-semibold">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Pagos sin conciliar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Transferencias confirmadas que no coinciden todavía con una
                solicitud del periodo.
              </p>
            </div>
            <span className="font-numeric rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
              {pendingRows.length} pendientes
            </span>
          </div>

          {notice ? (
            <div className="flex items-start gap-2 border-b border-success/15 bg-success-soft px-4 py-2.5 text-xs text-success">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recibido</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Referencia bancaria</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRows.map(({ transaction }) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(transaction.receivedAt)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {transaction.payerName ?? "Sin identificar"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.webhookEventId}
                    </p>
                  </TableCell>
                  <TableCell className="font-numeric text-xs">
                    {transaction.bankReference ?? "—"}
                  </TableCell>
                  <TableCell className="font-numeric text-right font-semibold">
                    {formatMoney(transaction.amountCents)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold uppercase text-muted-foreground">
                    {transaction.method}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog({ transaction, studentName: null, requestReference: null })}
                    >
                      <Link2 />
                      Vincular
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-success-soft text-success">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold">
                      Todo conciliado
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No quedan pagos pendientes de vincular en este corte.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              {summary.counts.transactions} transacciones confirmadas ·{" "}
              {summary.counts.unmatchedTransactions} sin conciliar
            </span>
            <span className="font-numeric">
              {formatPercent(collectionRate, 1)} del esperado
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="text-base font-semibold tracking-tight">
              Avance del corte
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(summary.collectedCents)} de{" "}
              {formatMoney(summary.expectedCents)}
            </p>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-surface-strong"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(collectionRate * 100)}
              aria-label="Avance de conciliación"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.min(100, collectionRate * 100)}%` }}
              />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Solicitudes", summary.counts.totalRequests],
                ["Pagadas", summary.counts.paid],
                ["Activas", summary.counts.pending],
                ["Vencidas", summary.counts.expired],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-numeric mt-0.5 text-lg font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-ink p-5 text-ink-foreground">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <ShieldCheck className="size-4" />
              Regla de conciliación
            </div>
            <ol className="mt-3 space-y-2 text-xs leading-5 text-ink-muted">
              <li>1. Coincide monto exacto de la solicitud.</li>
              <li>2. Coincide referencia o nombre del pagador.</li>
              <li>3. El asiento se confirma en el ledger SHA-256.</li>
            </ol>
          </div>
        </div>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Vincular pago a una solicitud</DialogTitle>
                <DialogDescription>
                  {selected.transaction.payerName ?? "Pago sin identificar"} ·{" "}
                  {formatMoney(selected.transaction.amountCents)} ·{" "}
                  {selected.transaction.bankReference ?? "Sin referencia"}
                </DialogDescription>
              </DialogHeader>

              <label className="space-y-1.5 text-xs font-medium">
                Solicitud candidata
                <select
                  value={selectedRequestId}
                  onChange={(event) => setSelectedRequestId(event.target.value)}
                  className={selectClassName}
                >
                  <option value="">Selecciona una solicitud</option>
                  {candidates.map((row) => (
                    <option key={row.request.id} value={row.request.id}>
                      {row.request.reference} · {row.studentName} ·{" "}
                      {formatMoney(row.request.amountCents)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedRequest ? (
                <p
                  className={cn(
                    "rounded-md px-3 py-2 text-xs",
                    amountsMatch
                      ? "bg-success-soft text-success"
                      : "bg-warning-soft text-[oklch(0.45_0.12_70)]",
                  )}
                >
                  {amountsMatch
                    ? "El monto coincide exactamente. La referencia se puede confirmar."
                    : `El monto no coincide: pago ${formatMoney(selected.transaction.amountCents)} vs. solicitud ${formatMoney(selectedRequest.request.amountCents)}.`}
                </p>
              ) : null}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={confirmLink}
                  disabled={!selectedRequest}
                >
                  <Link2 />
                  Confirmar vínculo
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
