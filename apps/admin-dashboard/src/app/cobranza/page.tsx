import type { Metadata } from "next";

import { CollectionsView } from "@/components/collections-view";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getPaymentRows } from "@/lib/metrics";
import { dashboardData } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Cobranza",
};

export default function CobranzaPage() {
  const rows = getPaymentRows(dashboardData);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Solicitudes CoDi y SPEI"
        title="Cobranza"
        description="Emite referencias, da seguimiento a vencimientos y revisa el estado de cada solicitud antes de mandar recordatorios."
        actions={<StatusBadge label="Datos demo" tone="neutral" dot={false} />}
      />
      <CollectionsView
        rows={rows}
        students={dashboardData.students}
        guardians={dashboardData.guardians}
      />
    </div>
  );
}
