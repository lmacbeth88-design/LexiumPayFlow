import type { Metadata } from "next";

import { AuditView } from "@/components/audit-view";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { dashboardData } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Auditoría",
};

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ledger append-only"
        title="Auditoría"
        description="Cada evento financiero queda encadenado por SHA-256. Revisa secuencia, hashes y payloads sin alterar el histórico."
        actions={<StatusBadge label="SHA-256" tone="info" dot={false} />}
      />
      <AuditView
        entries={dashboardData.ledger}
        valid={dashboardData.ledgerValid}
      />
    </div>
  );
}
