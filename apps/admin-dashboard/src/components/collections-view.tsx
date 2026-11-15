"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Plus,
  QrCode,
  Search,
  Send,
  Wallet,
  Clock3,
  AlertTriangle,
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
  DialogTrigger,
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
  formatMoney,
  formatPeriod,
  formatShortDate,
} from "@/lib/format";
import {
  CONCEPT_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE,
} from "@/lib/labels";
import type { PaymentRow } from "@/lib/metrics";
import type {
  Guardian,
  PaymentConcept,
  PaymentMethod,
  PaymentRequest,
  PaymentRequestStatus,
  Student,
} from "@/lib/types";
import { CURRENT_PERIOD } from "@/lib/mock-data";

const STATUS_OPTIONS: Array<{ value: "all" | PaymentRequestStatus; label: string }> = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "sent", label: "Enviadas" },
  { value: "paid", label: "Pagadas" },
  { value: "expired", label: "Vencidas" },
  { value: "cancelled", label: "Canceladas" },
];

const CONCEPT_OPTIONS: Array<{ value: "all" | PaymentConcept; label: string }> = [
  { value: "all", label: "Todos los conceptos" },
  { value: "colegiatura", label: "Colegiatura" },
  { value: "inscripcion", label: "Inscripción" },
  { value: "uniformes", label: "Uniformes" },
  { value: "transporte", label: "Transporte" },
  { value: "otro", label: "Otro" },
];

const selectClassName =
  "h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-xs text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

function randomReference() {
  return `CODI-LOCAL-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function CollectionsView({
  rows,
  students,
  guardians,
}: {
  rows: PaymentRow[];
  students: Student[];
  guardians: Guardian[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PaymentRequestStatus>("all");
  const [concept, setConcept] = useState<"all" | PaymentConcept>("all");
  const [extraRows, setExtraRows] = useState<PaymentRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    concept: "colegiatura" as PaymentConcept,
    amount: "",
    dueDate: "2026-11-30",
    method: "codi" as PaymentMethod,
  });

  const guardianByStudent = useMemo(() => {
    const map = new Map<string, Guardian>();
    for (const guardian of guardians) {
      for (const studentId of guardian.studentIds) {
        map.set(studentId, guardian);
      }
    }
    return map;
  }, [guardians]);

  const allRows = useMemo(
    () =>
      [...extraRows, ...rows].sort((a, b) =>
        b.request.createdAt.localeCompare(a.request.createdAt),
      ),
    [extraRows, rows],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (status !== "all" && row.request.status !== status) {
        return false;
      }
      if (concept !== "all" && row.request.concept !== concept) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        row.studentName,
        row.guardianName ?? "",
        row.request.reference,
        row.request.description,
        CONCEPT_LABEL[row.request.concept],
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [allRows, concept, query, status]);

  const activeRows = allRows.filter(
    (row) => row.request.status === "pending" || row.request.status === "sent",
  );
  const activeAmount = activeRows.reduce(
    (sum, row) => sum + row.request.amountCents,
    0,
  );
  const paidAmount = allRows
    .filter((row) => row.request.status === "paid")
    .reduce((sum, row) => sum + row.request.amountCents, 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const student = students.find((item) => item.id === form.studentId);
    const amountCents = Math.round(Number(form.amount.replace(",", ".")) * 100);
    if (!student || !Number.isFinite(amountCents) || amountCents <= 0) {
      setNotice("Revisa el alumno y el monto antes de crear la solicitud.");
      return;
    }
    const guardian = guardianByStudent.get(student.id) ?? null;
    const reference = randomReference();
    const now = new Date().toISOString();
    const request: PaymentRequest = {
      id: `pay_local_${Date.now()}`,
      schoolId: student.schoolId,
      studentId: student.id,
      payerId: guardian?.id ?? "grd_001",
      concept: form.concept,
      period: CURRENT_PERIOD,
      description: `${CONCEPT_LABEL[form.concept]} ${CURRENT_PERIOD}`,
      amountCents,
      currency: "MXN",
      status: "pending",
      method: form.method,
      reference,
      codiQrPayload: `00020101021238570010CODI.${reference}530303905802MX5913LEXIUM PAYFLOW6006CDMX6304DEMO`,
      paymentUrl: `https://pay.lexium.mx/demo/pay_local`,
      dueDate: form.dueDate,
      expiresAt: `${form.dueDate}T23:59:59.000Z`,
      createdAt: now,
      updatedAt: now,
    };
    setExtraRows((current) => [
      {
        request,
        student,
        studentName: student.fullName,
        guardianName: guardian?.fullName ?? null,
        guardianPhone: guardian?.phone ?? null,
        guardianEmail: guardian?.email ?? null,
      },
      ...current,
    ]);
    setDialogOpen(false);
    setForm((current) => ({ ...current, amount: "" }));
    setNotice(
      `Solicitud ${reference} creada en modo demo para ${student.fullName}.`,
    );
  }

  async function copyReference(row: PaymentRow) {
    try {
      await navigator.clipboard.writeText(row.request.reference);
      setNotice(`Referencia ${row.request.reference} copiada al portapapeles.`);
    } catch {
      setNotice(`Referencia: ${row.request.reference}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Solicitudes activas",
            value: `${activeRows.length}`,
            hint: formatMoney(activeAmount),
            icon: Clock3,
            className: "bg-warning-soft text-[oklch(0.45_0.12_70)]",
          },
          {
            label: "Cobrado",
            value: formatMoney(paidAmount),
            hint: `${allRows.filter((row) => row.request.status === "paid").length} pagadas`,
            icon: Wallet,
            className: "bg-success-soft text-success",
          },
          {
            label: "Vencidas",
            value: `${allRows.filter((row) => row.request.status === "expired").length}`,
            hint: "Requieren seguimiento",
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
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", item.className)}>
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
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar alumno, tutor o referencia"
              className="h-9 bg-surface pl-9 text-xs"
              aria-label="Buscar solicitudes"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | PaymentRequestStatus)
              }
              className={selectClassName}
              aria-label="Filtrar por estado"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={concept}
              onChange={(event) =>
                setConcept(event.target.value as "all" | PaymentConcept)
              }
              className={selectClassName}
              aria-label="Filtrar por concepto"
            >
              {CONCEPT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="xl:ml-auto">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus />
                  Nueva solicitud
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva solicitud de pago</DialogTitle>
                  <DialogDescription>
                    Genera una referencia CoDi o SPEI para un alumno. En modo
                    demo la solicitud vive en memoria hasta conectar el core.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-medium">
                      Alumno
                      <select
                        value={form.studentId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            studentId: event.target.value,
                          }))
                        }
                        className={selectClassName}
                        required
                      >
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} · {student.grade}
                            {student.group}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs font-medium">
                      Concepto
                      <select
                        value={form.concept}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            concept: event.target.value as PaymentConcept,
                          }))
                        }
                        className={selectClassName}
                      >
                        {CONCEPT_OPTIONS.filter(
                          (option) => option.value !== "all",
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs font-medium">
                      Monto (MXN)
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        placeholder="3500.00"
                        value={form.amount}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label className="space-y-1.5 text-xs font-medium">
                      Fecha límite
                      <Input
                        type="date"
                        value={form.dueDate}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            dueDate: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label className="space-y-1.5 text-xs font-medium sm:col-span-2">
                      Método
                      <select
                        value={form.method}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            method: event.target.value as PaymentMethod,
                          }))
                        }
                        className={selectClassName}
                      >
                        <option value="codi">CoDi</option>
                        <option value="spei">SPEI</option>
                      </select>
                    </label>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit">
                      <Plus />
                      Crear solicitud
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {notice ? (
          <div className="flex items-start gap-2 border-b border-info/15 bg-info-soft px-4 py-2.5 text-xs text-info">
            <Check className="mt-0.5 size-3.5 shrink-0" />
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
              <TableHead>Alumno</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.request.id}>
                <TableCell>
                  <p className="font-medium">{row.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.guardianName ?? "Sin tutor"} · {row.student.grade}
                    {row.student.group}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{CONCEPT_LABEL[row.request.concept]}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPeriod(row.request.period)}
                  </p>
                </TableCell>
                <TableCell className="font-numeric text-right font-semibold">
                  {formatMoney(row.request.amountCents)}
                </TableCell>
                <TableCell>
                  <p className="text-sm">{formatShortDate(row.request.dueDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(row.request.dueDate)}
                  </p>
                </TableCell>
                <TableCell className="font-numeric text-xs text-muted-foreground">
                  {row.request.reference}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={REQUEST_STATUS_LABEL[row.request.status]}
                    tone={REQUEST_STATUS_TONE[row.request.status]}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {row.request.status === "pending" ||
                    row.request.status === "sent" ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-sm"
                        title="Ver código QR"
                      >
                        <Link href={`/qr?request=${row.request.id}`}>
                          <QrCode />
                          <span className="sr-only">Ver código QR</span>
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyReference(row)}
                      title="Copiar referencia"
                    >
                      <Copy />
                      <span className="sr-only">Copiar referencia</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setNotice(
                          `Recordatorio programado para ${row.guardianName ?? row.studentName} (simulado).`,
                        )
                      }
                      title="Enviar recordatorio"
                    >
                      <Send />
                      <span className="sr-only">Enviar recordatorio</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-sm font-medium">Sin solicitudes</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ajusta los filtros o crea una nueva solicitud.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            {filtered.length} de {allRows.length} solicitudes
          </span>
          <span className="font-numeric">
            {formatMoney(
              filtered.reduce((sum, row) => sum + row.request.amountCents, 0),
            )}{" "}
            filtrado
          </span>
        </div>
      </div>
    </div>
  );
}
