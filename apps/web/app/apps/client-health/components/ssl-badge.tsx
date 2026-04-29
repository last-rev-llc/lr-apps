import { Badge, cn } from "@repo/ui";

interface SslBadgeProps {
  expiry?: string | null;
  className?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysLeft(expiry: string): number | null {
  const t = new Date(expiry).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / DAY_MS);
}

export function SslBadge({ expiry, className }: SslBadgeProps) {
  if (!expiry) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        SSL —
      </Badge>
    );
  }
  const days = daysLeft(expiry);
  if (days == null) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        SSL —
      </Badge>
    );
  }
  if (days < 0) {
    return (
      <Badge
        variant="outline"
        className={cn("bg-red/15 text-red border-red/30", className)}
      >
        SSL expired
      </Badge>
    );
  }
  if (days < 7) {
    return (
      <Badge
        variant="outline"
        className={cn("bg-red/15 text-red border-red/30", className)}
      >
        SSL {days}d (critical)
      </Badge>
    );
  }
  if (days < 30) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-yellow/15 text-yellow border-yellow/30",
          className,
        )}
      >
        SSL {days}d (warn)
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn("bg-green/15 text-green border-green/30", className)}
    >
      SSL {days}d
    </Badge>
  );
}
