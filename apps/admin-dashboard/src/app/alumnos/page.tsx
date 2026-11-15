import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StudentsView } from "@/components/students-view";
import { getStudentAccounts } from "@/lib/metrics";
import { dashboardData } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Alumnos",
};

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const accounts = getStudentAccounts(dashboardData);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cuentas y tutores"
        title="Alumnos"
        description="Consulta el estado de cuenta de cada alumno, su tutor principal y los saldos que alimentan la cobranza."
        actions={<StatusBadge label="Datos demo" tone="neutral" dot={false} />}
      />
      <StudentsView accounts={accounts} initialQuery={query} />
    </div>
  );
}
