"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ReceiptText,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { VoiceAssistant } from "@/components/voice-assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/cobranza", label: "Cobranza", icon: ReceiptText },
  { href: "/qr", label: "Códigos QR", icon: QrCode },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/conciliacion", label: "Conciliación", icon: Scale },
  { href: "/auditoria", label: "Auditoría", icon: ShieldCheck },
] as const;

function currentLabel(pathname: string): string {
  const item = NAV_ITEMS.find((navItem) =>
    navItem.href === "/"
      ? pathname === "/"
      : pathname === navItem.href || pathname.startsWith(`${navItem.href}/`),
  );
  return item?.label ?? "Resumen";
}

function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden
        data-print-hide
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        data-print-hide
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-ink text-ink-foreground transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink-foreground lg:hidden"
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar menú</span>
          </button>
        </div>

        <div className="px-3 pt-4">
          <button
            type="button"
            className="w-full rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left transition-colors hover:bg-white/[0.075]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Escuela activa
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  Colegio Benito Juárez
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  Campus Centro · 2026-2027
                </p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-ink-muted" />
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Operación
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-ink-muted hover:bg-white/[0.06] hover:text-ink-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Sparkles className="size-3.5" />
              Corte de noviembre
            </div>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              8 solicitudes activas. 2 pagos esperan conciliación.
            </p>
            <Button
              asChild
              size="sm"
              variant="accent"
              className="mt-3 w-full justify-between"
            >
              <Link href="/conciliacion">
                Revisar corte
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/20 font-mono text-xs font-bold text-accent">
              AL
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Ana Lozano</p>
              <p className="truncate text-xs text-ink-muted">
                Administración escolar
              </p>
            </div>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink-foreground"
            >
              <LogOut className="size-4" />
              <span className="sr-only">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const label = currentLabel(pathname);

  return (
    <header data-print-hide className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="grid size-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <Menu className="size-4" />
          <span className="sr-only">Abrir menú</span>
        </button>

        <div className="hidden items-center gap-2 text-sm sm:flex">
          <span className="text-muted-foreground">Operación</span>
          <span className="text-border-strong">/</span>
          <span className="font-medium text-foreground">{label}</span>
        </div>

        <form
          data-print-hide
          action="/alumnos"
          className="relative ml-auto hidden w-full max-w-[280px] md:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar alumno o referencia"
            className="h-9 border-border bg-surface/80 pl-9 text-xs"
          />
          <span className="sr-only">Buscar</span>
        </form>

        <VoiceAssistant />

        <button
          type="button"
          className="relative ml-auto grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground md:ml-0"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger ring-2 ring-surface" />
          <span className="sr-only">Notificaciones</span>
        </button>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <div className="hidden items-center gap-2 sm:flex">
          <div className="grid size-8 place-items-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
            AL
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold">Ana Lozano</p>
            <p className="text-[10px] text-muted-foreground">Administración</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main data-print-root className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
