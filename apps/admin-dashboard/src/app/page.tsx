import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
  Scale,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { CollectionChart } from "@/components/collection-chart";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateTime,
  formatMoney,
  formatPercent,
  formatPeriod,
} from "@/lib/format";
import { getAlerts, getMetrics, getTransactionRows } from "@/lib/metrics";
import { dashboardData, CURRENT_PERIOD } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Resumen",
};

const alertIcons = {
  danger: AlertTriangle,
  warning: Clock3,
  success: CheckCircle2,
  info: Scale,
  neutral: Clock3,
};

export default function DashboardPage() {
  const metrics = getMetrics(dashboardData);
  const alerts = getAlerts(dashboardData);
  const recentTransactions = getTransactionRows(dashboardData)
    .filter((row) => row.transaction.status === "confirmed")
    .slice(0, 5);
  const collectionDegrees = Math.round(metrics.collectionRate * 360);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${formatPeriod(CURRENT_PERIOD)} · Corte al 14 de noviembre`}
        title="Resumen de cobranza"
        description="Una lectura operativa de lo cobrado, lo pendiente y lo que necesita atención antes de cerrar el mes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/conciliacion">
                <Scale />
                Conciliar pagos
              </Link>
            </Button>
            <Button asChild>
              <Link href="/cobranza">
                <ReceiptText />
                Ir a cobranza
                <ArrowUpRight />
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Cobrado del periodo"
          value={formatMoney(metrics.collectedCents)}
          hint="4 solicitudes pagadas"
          delta="+12.4%"
          deltaTone="positive"
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Saldo pendiente"
          value={formatMoney(metrics.pendingCents)}
          hint={`${metrics.studentsWithDebt} alumnos con saldo`}
          delta={`${metrics.activeRequests} activas`}
          deltaTone="neutral"
          icon={Users}
          tone="warning"
        />
        <KpiCard
          label="Saldo vencido"
          value={formatMoney(metrics.overdueCents)}
          hint={`${metrics.overdueStudents} alumnos en seguimiento`}
          delta="Prioridad alta"
          deltaTone="negative"
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label="Tasa de conciliación"
          value={formatPercent(metrics.reconciliationRate, 1)}
          hint={`${metrics.unmatchedTransactions} pagos sin conciliar`}
          delta="Ledger íntegro"
          deltaTone="positive"
          icon={TrendingUp}
          tone="info"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Flujo de cobranza</CardTitle>
              <CardDescription>
                Esperado contra cobrado en las últimas cinco semanas.
              </CardDescription>
            </div>
            <StatusBadge label="Nov 2026" tone="neutral" dot={false} />
          </CardHeader>
          <CardContent>
            <CollectionChart points={dashboardData.weeklyCollection} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Estado de la operación</CardTitle>
            <CardDescription>
              Salud del corte y avance contra el monto esperado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-5">
              <div
                className="relative grid size-32 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${collectionDegrees}deg, var(--surface-strong) 0deg)`,
                }}
              >
                <div className="grid size-[104px] place-items-center rounded-full bg-surface text-center">
                  <div>
                    <p className="font-numeric text-2xl font-semibold">
                      {formatPercent(metrics.collectionRate, 0)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      cobrado
                    </p>
                  </div>
                </div>
              </div>
              <div className="min-w-0 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Esperado</p>
                  <p className="font-numeric mt-0.5 font-semibold">
                    {formatMoney(metrics.expectedCents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cobrado</p>
                  <p className="font-numeric mt-0.5 font-semibold text-primary">
                    {formatMoney(metrics.collectedCents)}
                  </p>
                </div>
              </div>
            </div>

            <dl className="divide-y divide-border rounded-md border border-border">
              {[
                ["Solicitudes activas", `${metrics.activeRequests}`],
                ["Alumnos con adeudo", `${metrics.studentsWithDebt}`],
                ["Ticket promedio", formatMoney(metrics.averageTicketCents)],
                ["Pagos sin conciliar", `${metrics.unmatchedTransactions}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-numeric font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Pagos recientes</CardTitle>
              <CardDescription>
                Transferencias confirmadas por el core y su estado de conciliación.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/conciliacion">
                Ver todo
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno / pagador</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Recibido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map(({ transaction, studentName }) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <p className="font-medium">
                        {studentName ?? transaction.payerName ?? "Sin identificar"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.payerName ?? "Pago no vinculado"}
                      </p>
                    </TableCell>
                    <TableCell className="font-numeric text-xs text-muted-foreground">
                      {transaction.bankReference ?? "—"}
                    </TableCell>
                    <TableCell className="uppercase text-xs font-semibold text-muted-foreground">
                      {transaction.method}
                    </TableCell>
                    <TableCell className="font-numeric text-right font-semibold">
                      {formatMoney(transaction.amountCents)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={transaction.reconciled ? "Conciliado" : "Sin conciliar"}
                        tone={transaction.reconciled ? "success" : "danger"}
                      />
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDateTime(transaction.receivedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-between text-xs text-muted-foreground">
            <span>Mostrando 5 movimientos confirmados</span>
            <span className="font-numeric">
              {formatMoney(
                recentTransactions.reduce(
                  (sum, row) => sum + row.transaction.amountCents,
                  0,
                ),
              )}
            </span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requiere atención</CardTitle>
            <CardDescription>
              Señales del corte que conviene resolver hoy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.tone];
              return (
                <Link
                  key={alert.title}
                  href={alert.href}
                  className="group flex items-start gap-3 rounded-md border border-border p-3.5 transition-colors hover:border-border-strong hover:bg-muted/50"
                >
                  <span
                    className={
                      alert.tone === "danger"
                        ? "grid size-8 shrink-0 place-items-center rounded-md bg-danger-soft text-danger"
                        : alert.tone === "warning"
                          ? "grid size-8 shrink-0 place-items-center rounded-md bg-warning-soft text-[oklch(0.45_0.12_70)]"
                          : "grid size-8 shrink-0 place-items-center rounded-md bg-success-soft text-success"
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {alert.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {alert.detail}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
