import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/labels";
import { cn } from "@/lib/cn";

export function StatusBadge({
  label,
  tone,
  dot = true,
  className,
}: {
  label: string;
  tone: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <Badge tone={tone} className={className}>
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "danger" && "bg-danger",
            tone === "info" && "bg-info",
            tone === "neutral" && "bg-muted-foreground/60",
          )}
        />
      ) : null}
      {label}
    </Badge>
  );
}
