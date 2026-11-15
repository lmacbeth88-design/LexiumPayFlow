import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Lexium PayFlow · Administración",
    template: "%s · Lexium PayFlow",
  },
  description:
    "Panel operativo de cobranza escolar: solicitudes CoDi/SPEI, conciliación y auditoría del ledger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
