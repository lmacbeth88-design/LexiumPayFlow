import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ReconciliationView } from "@/components/reconciliation-view";
import { StatusBadge } from "@/components/status-badge";
import {
  getPaymentRows,
  getReconciliationSummary,
  getTransactionRows,
} from "@/lib/metrics";
import { CURRENT_PERIOD, dashboardData } from "@/lib/mock-data";
import { formatPeriod } from "@/lib/format";

export const metadata: Metadata = {
  title: "Conciliación",
};

export default function ConciliacionPage() {
  const summary = getReconciliationSummary(dashboardData, CURRENT_PERIOD);
  const unmatchedRows = getTransactionRows(dashboardData).filter(
    (row) =>
      row.transaction.status === "confirmed" && !row.transaction.reconciled,
  );
  const candidates = getPaymentRows(dashboardData).filter(
    (row) =>
      row.request.period === CURRENT_PERIOD &&
      (row.request.status === "pending" || row.request.status === "sent"),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Corte ${formatPeriod(CURRENT_PERIOD)}`}
        title="Conciliación"
        description="Cruza las transferencias confirmadas contra las solicitudes emitidas y resuelve los pagos que no encontraron coincidencia."
        actions={<StatusBadge label="2 por revisar" tone="danger" />}
      />
      <ReconciliationView
        summary={summary}
        unmatchedRows={unmatchedRows}
        candidates={candidates}
      />
    </div>
  );
}
