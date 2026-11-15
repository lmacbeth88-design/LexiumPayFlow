import type { WeeklyCollectionPoint } from "@/lib/types";
import { formatMoneyCompact } from "@/lib/format";

export function CollectionChart({ points }: { points: WeeklyCollectionPoint[] }) {
  const max = Math.max(...points.map((point) => point.expectedCents), 1);

  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-4">
        {points.map((point) => {
          const expectedHeight = Math.max(6, (point.expectedCents / max) * 100);
          const collectedHeight = Math.max(
            2,
            (point.collectedCents / max) * 100,
          );
          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="relative h-[168px] w-full rounded-md bg-surface-strong/60">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-md border border-border/70 bg-muted"
                  style={{ height: `${expectedHeight}%` }}
                  title={`Esperado ${formatMoneyCompact(point.expectedCents)}`}
                />
                <div
                  className="absolute inset-x-0 bottom-0 rounded-md bg-primary transition-[height] duration-500"
                  style={{ height: `${collectedHeight}%` }}
                  title={`Cobrado ${formatMoneyCompact(point.collectedCents)}`}
                >
                  <span className="absolute inset-x-0 top-1 mx-auto h-0.5 w-5 rounded-full bg-white/30" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {point.label}
                </p>
                <p className="font-numeric mt-0.5 text-[11px] text-foreground">
                  {formatMoneyCompact(point.collectedCents)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-primary" />
          Cobrado
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm border border-border-strong bg-muted" />
          Esperado
        </span>
        <span className="ml-auto font-numeric text-foreground">
          {formatMoneyCompact(points.reduce((sum, p) => sum + p.collectedCents, 0))}{" "}
          acumulado
        </span>
      </div>
    </div>
  );
}
