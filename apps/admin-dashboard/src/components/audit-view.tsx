"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Fingerprint,
  Link2,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatDateTime, formatHash } from "@/lib/format";
import {
  LEDGER_TYPE_LABEL,
  LEDGER_TYPE_TONE,
} from "@/lib/labels";
import type { LedgerEntry, LedgerEntryType } from "@/lib/types";

const selectClassName =
  "h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-xs text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

export function AuditView({
  entries,
  valid,
}: {
  entries: LedgerEntry[];
  valid: boolean;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | LedgerEntryType>("all");
  const [selected, setSelected] = useState<LedgerEntry | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.sequence - a.sequence),
    [entries],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sorted.filter((entry) => {
      if (type !== "all" && entry.type !== type) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        entry.paymentRequestId ?? "",
        entry.hash,
        entry.prevHash ?? "",
        LEDGER_TYPE_LABEL[entry.type],
        JSON.stringify(entry.payload),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [query, sorted, type]);

  const lastEntry = sorted[0];
  const types = Array.from(new Set(entries.map((entry) => entry.type)));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Estado de la cadena",
            value: valid ? "Íntegra" : "Con ruptura",
            hint: `${entries.length} asientos verificados`,
            icon: ShieldCheck,
            tone: valid
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger",
          },
          {
            label: "Último asiento",
            value: `#${String(lastEntry?.sequence ?? 0).padStart(4, "0")}`,
            hint: lastEntry ? formatDateTime(lastEntry.createdAt) : "Sin datos",
            icon: FileSearch,
            tone: "bg-info-soft text-info",
          },
          {
            label: "Hash actual",
            value: lastEntry ? formatHash(lastEntry.hash) : "—",
            hint: "SHA-256 · 64 caracteres",
            icon: Fingerprint,
            tone: "bg-surface-strong text-muted-foreground",
          },
          {
            label: "Enlace previo",
            value: lastEntry?.prevHash ? formatHash(lastEntry.prevHash) : "Génesis",
            hint: "Cada asiento referencia al anterior",
            icon: Link2,
            tone: "bg-warning-soft text-[oklch(0.45_0.12_70)]",
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
              <p className="font-numeric mt-3 truncate text-lg font-semibold">
                {item.value}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.hint}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Cadena reciente</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setNotice(
                valid
                  ? `Cadena verificada: ${entries.length} asientos sin discrepancias.`
                  : "La cadena tiene una ruptura. Revisa los hashes enlazados.",
              )
            }
          >
            <ShieldCheck />
            Verificar cadena
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted
            .slice(0, 6)
            .reverse()
            .map((entry, index) => (
              <div key={entry.sequence} className="flex shrink-0 items-center gap-2">
                {index > 0 ? (
                  <ArrowRight className="size-3 shrink-0 text-border-strong" />
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="w-32 rounded-md border border-border bg-surface-strong/50 p-2.5 text-left transition-colors hover:border-border-strong hover:bg-muted"
                >
                  <p className="font-numeric text-[10px] text-muted-foreground">
                    #{String(entry.sequence).padStart(4, "0")}
                  </p>
                  <p className="mt-1 truncate text-[11px] font-medium">
                    {LEDGER_TYPE_LABEL[entry.type]}
                  </p>
                  <p className="font-numeric mt-1 truncate text-[10px] text-muted-foreground">
                    {formatHash(entry.hash, 8)}
                  </p>
                </button>
              </div>
            ))}
        </div>
        {notice ? (
          <p className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-xs text-success">
            <CheckCircle2 className="size-3.5" />
            {notice}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar hash o solicitud"
              className="h-9 bg-surface pl-9 text-xs"
              aria-label="Buscar en el ledger"
            />
          </div>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "all" | LedgerEntryType)
            }
            className={cn(selectClassName, "sm:max-w-[220px]")}
            aria-label="Filtrar por tipo de asiento"
          >
            <option value="all">Todos los eventos</option>
            {types.map((entryType) => (
              <option key={entryType} value={entryType}>
                {LEDGER_TYPE_LABEL[entryType]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {filtered.length} de {entries.length} asientos
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Secuencia</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Hash previo</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => (
              <TableRow
                key={entry.sequence}
                className="cursor-pointer"
                onClick={() => setSelected(entry)}
              >
                <TableCell className="font-numeric text-xs text-muted-foreground">
                  #{String(entry.sequence).padStart(4, "0")}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={LEDGER_TYPE_LABEL[entry.type]}
                    tone={LEDGER_TYPE_TONE[entry.type]}
                  />
                </TableCell>
                <TableCell className="font-numeric text-xs text-muted-foreground">
                  {entry.paymentRequestId ?? "—"}
                </TableCell>
                <TableCell className="font-numeric text-xs">
                  {formatHash(entry.hash)}
                </TableCell>
                <TableCell className="font-numeric text-xs text-muted-foreground">
                  {entry.prevHash ? formatHash(entry.prevHash) : "Génesis"}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Asiento #{String(selected.sequence).padStart(4, "0")}
                </DialogTitle>
                <DialogDescription>
                  {LEDGER_TYPE_LABEL[selected.type]} ·{" "}
                  {formatDateTime(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid gap-2 text-xs">
                <div className="grid gap-1 rounded-md border border-border p-3">
                  <dt className="font-semibold text-muted-foreground">Hash</dt>
                  <dd className="font-numeric break-all">{selected.hash}</dd>
                </div>
                <div className="grid gap-1 rounded-md border border-border p-3">
                  <dt className="font-semibold text-muted-foreground">
                    Hash previo
                  </dt>
                  <dd className="font-numeric break-all">
                    {selected.prevHash ?? "Génesis"}
                  </dd>
                </div>
                <div className="grid gap-1 rounded-md border border-border p-3">
                  <dt className="font-semibold text-muted-foreground">
                    Payload
                  </dt>
                  <dd>
                    <pre className="overflow-x-auto rounded bg-surface-strong/60 p-3 font-mono text-[11px] leading-5">
                      {JSON.stringify(selected.payload, null, 2)}
                    </pre>
                  </dd>
                </div>
              </dl>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
