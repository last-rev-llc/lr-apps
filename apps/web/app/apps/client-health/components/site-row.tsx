import { cn } from "@repo/ui";
import { SslBadge } from "./ssl-badge";
import type { SiteWithMeta } from "../lib/types";

interface SiteRowProps {
  site: SiteWithMeta;
}

function statusTone(status: SiteWithMeta["status"]): string {
  switch (status) {
    case "up":
      return "bg-green";
    case "down":
      return "bg-red";
    case "degraded":
      return "bg-yellow";
    default:
      return "bg-muted-foreground/40";
  }
}

function uptimeTone(uptime: number | null | undefined): string {
  if (uptime == null) return "text-muted-foreground";
  if (uptime >= 99.5) return "text-green";
  if (uptime >= 98) return "text-yellow";
  return "text-red";
}

function responseTimeTone(ms: number | null | undefined): string {
  if (ms == null) return "text-muted-foreground";
  if (ms < 300) return "text-green";
  if (ms < 800) return "text-yellow";
  return "text-red";
}

export function SiteRow({ site }: SiteRowProps) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface border border-surface-border">
      <span
        className={cn(
          "inline-block w-2.5 h-2.5 rounded-full shrink-0",
          statusTone(site.status),
        )}
        aria-label={site.status ?? "unknown status"}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm truncate">
            {site.label}
          </span>
          {site.isPrimary && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              primary
            </span>
          )}
        </div>
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-accent truncate block"
        >
          {site.url}
        </a>
      </div>
      <div className="hidden sm:flex flex-col items-end text-xs">
        <span className={cn("font-semibold tabular-nums", uptimeTone(site.uptime))}>
          {site.uptime != null ? `${site.uptime.toFixed(1)}%` : "—"}
        </span>
        <span className="text-muted-foreground">uptime</span>
      </div>
      <div className="hidden sm:flex flex-col items-end text-xs">
        <span
          className={cn(
            "font-semibold tabular-nums",
            responseTimeTone(site.responseTime),
          )}
        >
          {site.responseTime != null ? `${site.responseTime}ms` : "—"}
        </span>
        <span className="text-muted-foreground">resp</span>
      </div>
      <SslBadge expiry={site.sslExpiry} className="shrink-0" />
    </li>
  );
}
