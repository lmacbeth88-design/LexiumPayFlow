import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { QrView } from "@/components/qr-view";
import { StatusBadge } from "@/components/status-badge";
import { getPaymentRows } from "@/lib/metrics";
import { dashboardData } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Códigos QR",
};

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedId =
    typeof params.request === "string" ? params.request : undefined;
  const rows = getPaymentRows(dashboardData).filter(
    (row) =>
      row.request.status === "pending" || row.request.status === "sent",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cobro digital · CoDi"
        title="Códigos QR"
        description="Genera, descarga y comparte el QR de cada solicitud activa. El código se construye desde el payload CoDi y queda listo para enviarse al tutor."
        actions={
          <StatusBadge label="Generación demo" tone="neutral" dot={false} />
        }
      />
      <QrView rows={rows} initialRequestId={requestedId} />
    </div>
  );
}
