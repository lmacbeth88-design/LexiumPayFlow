import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid size-10 place-items-center overflow-hidden rounded-[10px] bg-accent text-accent-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.35)]">
        <span className="absolute -right-2 -top-2 size-5 rounded-full bg-primary/30" />
        <span className="relative font-mono text-lg font-bold leading-none tracking-[-0.08em]">
          LP
        </span>
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink-foreground">
          Lexium
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          PayFlow
        </p>
      </div>
    </div>
  );
}
