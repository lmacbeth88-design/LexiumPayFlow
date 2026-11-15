import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/labels";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-strong text-muted-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-[oklch(0.45_0.12_70)]",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  delta,
  deltaTone = "neutral",
  className,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-[0_1px_2px_oklch(0.2_0.02_245_/_0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-md",
            toneClasses[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="font-numeric mt-4 text-3xl font-semibold text-foreground">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 font-semibold",
              deltaTone === "positive" && "bg-success-soft text-success",
              deltaTone === "negative" && "bg-danger-soft text-danger",
              deltaTone === "neutral" && "bg-surface-strong text-muted-foreground",
            )}
          >
            {delta}
          </span>
        ) : null}
        <span className="leading-5 text-muted-foreground">{hint}</span>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-8 size-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-125"
      />
    </div>
  );
}
