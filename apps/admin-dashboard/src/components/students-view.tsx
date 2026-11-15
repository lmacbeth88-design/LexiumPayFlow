"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Search, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { formatDate, formatMoney, formatPeriod } from "@/lib/format";
import {
  BALANCE_STATUS_LABEL,
  BALANCE_STATUS_TONE,
  LEVEL_LABEL,
} from "@/lib/labels";
import type { StudentAccount } from "@/lib/metrics";

const selectClassName =
  "h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-xs text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

export function StudentsView({
  accounts,
  initialQuery = "",
}: {
  accounts: StudentAccount[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [level, setLevel] = useState("all");
  const [debt, setDebt] = useState("all");
  const [selected, setSelected] = useState<StudentAccount | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return accounts.filter((account) => {
      if (level !== "all" && account.summary.level !== level) {
        return false;
      }
      if (debt === "with" && account.summary.balanceDueCents === 0) {
        return false;
      }
      if (debt === "without" && account.summary.balanceDueCents > 0) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        account.summary.fullName,
        account.summary.guardianName ?? "",
        account.summary.grade,
        account.summary.group,
        LEVEL_LABEL[account.summary.level],
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [accounts, debt, level, query]);

  const withDebt = accounts.filter(
    (account) => account.summary.balanceDueCents > 0,
  );
  const totalDue = accounts.reduce(
    (sum, account) => sum + account.summary.balanceDueCents,
    0,
  );
  const totalOverdue = accounts.reduce(
    (sum, account) => sum + account.totals.overdueCents,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Alumnos activos",
            value: `${accounts.length}`,
            hint: "Ciclo 2026-2027",
            icon: Users,
            className: "bg-info-soft text-info",
          },
          {
            label: "Con saldo pendiente",
            value: `${withDebt.length}`,
            hint: formatMoney(totalDue),
            icon: Wallet,
            className: "bg-warning-soft text-[oklch(0.45_0.12_70)]",
          },
          {
            label: "Saldo vencido",
            value: formatMoney(totalOverdue),
            hint: "Colegiatura de octubre",
            icon: AlertTriangle,
            className: "bg-danger-soft text-danger",
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
                  item.className,
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

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por alumno o tutor"
              className="h-9 bg-surface pl-9 text-xs"
              aria-label="Buscar alumnos"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className={selectClassName}
              aria-label="Filtrar por nivel"
            >
              <option value="all">Todos los niveles</option>
              {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={debt}
              onChange={(event) => setDebt(event.target.value)}
              className={selectClassName}
              aria-label="Filtrar por adeudo"
            >
              <option value="all">Todos los saldos</option>
              <option value="with">Con adeudo</option>
              <option value="without">Sin adeudo</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {filtered.length} de {accounts.length} alumnos
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((account) => (
              <TableRow key={account.summary.id}>
                <TableCell>
                  <p className="font-medium">{account.summary.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {LEVEL_LABEL[account.summary.level]} · {account.summary.grade}
                    {account.summary.group}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">
                    {account.summary.guardianName ?? "Sin tutor"}
                  </p>
                  <p className="font-numeric text-xs text-muted-foreground">
                    {account.summary.guardianPhone ?? "—"}
                  </p>
                </TableCell>
                <TableCell
                  className={cn(
                    "font-numeric text-right font-semibold",
                    account.summary.balanceDueCents > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {formatMoney(account.summary.balanceDueCents)}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={
                      account.summary.balanceDueCents > 0 ? "Con adeudo" : "Al día"
                    }
                    tone={
                      account.summary.balanceDueCents > 0 ? "warning" : "success"
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(account)}
                  >
                    Ver cuenta
                    <ArrowUpRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <p className="text-sm font-medium">Sin alumnos</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prueba con otro nombre o quita los filtros.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
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
                <DialogTitle>{selected.summary.fullName}</DialogTitle>
                <DialogDescription>
                  {LEVEL_LABEL[selected.summary.level]} ·{" "}
                  {selected.summary.grade}
                  {selected.summary.group} · Tutor:{" "}
                  {selected.summary.guardianName ?? "Sin registrar"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Total", selected.totals.dueCents],
                  ["Pagado", selected.totals.paidCents],
                  ["Vencido", selected.totals.overdueCents],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-md border border-border bg-surface-strong/50 p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="font-numeric mt-1 text-sm font-semibold">
                      {formatMoney(Number(value))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.balances.map((balance) => (
                      <TableRow key={balance.id}>
                        <TableCell className="text-sm">
                          {balance.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatPeriod(balance.period)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(balance.dueDate)}
                        </TableCell>
                        <TableCell className="font-numeric text-right text-sm">
                          {formatMoney(
                            Math.max(
                              0,
                              balance.amountDueCents - balance.amountPaidCents,
                            ),
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={BALANCE_STATUS_LABEL[balance.status]}
                            tone={BALANCE_STATUS_TONE[balance.status]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {notice ? (
                <p className="rounded-md bg-info-soft px-3 py-2 text-xs text-info">
                  {notice}
                </p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setNotice(
                      `Estado de cuenta de ${selected.summary.fullName} listo para enviar (simulado).`,
                    )
                  }
                >
                  Enviar estado de cuenta
                </Button>
                <Button asChild>
                  <Link href="/cobranza">
                    Crear solicitud
                    <ArrowUpRight />
                  </Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
