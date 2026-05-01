import { Badge } from "@repo/ui";

interface SslBadgeProps {
  sslExpiry: string | null;
  sslLastError: string | null;
  sslLastChecked: string | null;
}

function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * SSL status badge. Renders four mutually exclusive states:
 *   - valid (>=30 days)
 *   - expiring (<30 days)
 *   - critical (<7 days OR expired)
 *   - data-unavailable (sslExpiry === null and sslLastError is set)
 *
 * The data-unavailable state replaces what would otherwise be an alert —
 * handshake failures (Cloudflare, unusual SNI) should NOT be reported as
 * an expired cert.
 */
export function SslBadge({
  sslExpiry,
  sslLastError,
  sslLastChecked,
}: SslBadgeProps) {
  if (sslExpiry === null && sslLastError !== null) {
    const lastCheckedLabel = formatDate(sslLastChecked);
    const tooltip = lastCheckedLabel
      ? `Last checked ${lastCheckedLabel}: ${sslLastError}`
      : sslLastError;
    return (
      <Badge
        variant="outline"
        className="text-[11px] uppercase tracking-wide bg-surface-raised text-muted-foreground border-surface-border"
        title={tooltip}
        data-testid="ssl-badge-unavailable"
        data-state="unavailable"
      >
        SSL data unavailable
      </Badge>
    );
  }

  if (sslExpiry === null) {
    // Never checked yet, no error recorded — also unavailable but with no
    // diagnostic message.
    return (
      <Badge
        variant="outline"
        className="text-[11px] uppercase tracking-wide bg-surface-raised text-muted-foreground border-surface-border"
        data-testid="ssl-badge-unknown"
        data-state="unknown"
      >
        SSL unchecked
      </Badge>
    );
  }

  const days = daysLeft(sslExpiry);

  if (days < 0) {
    return (
      <Badge
        variant="outline"
        className="text-[11px] uppercase tracking-wide"
        style={{
          background: "color-mix(in srgb, var(--color-red) 12%, transparent)",
          color: "var(--color-red)",
          borderColor: "color-mix(in srgb, var(--color-red) 35%, transparent)",
        }}
        data-testid="ssl-badge-expired"
        data-state="expired"
      >
        Expired
      </Badge>
    );
  }

  if (days < 7) {
    return (
      <Badge
        variant="outline"
        className="text-[11px] uppercase tracking-wide"
        style={{
          background: "color-mix(in srgb, var(--color-red) 12%, transparent)",
          color: "var(--color-red)",
          borderColor: "color-mix(in srgb, var(--color-red) 35%, transparent)",
        }}
        data-testid="ssl-badge-critical"
        data-state="critical"
      >
        Expires in {days}d
      </Badge>
    );
  }

  if (days < 30) {
    return (
      <Badge
        variant="outline"
        className="text-[11px] uppercase tracking-wide"
        style={{
          background:
            "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          color: "var(--color-accent-400)",
          borderColor:
            "color-mix(in srgb, var(--color-accent) 35%, transparent)",
        }}
        data-testid="ssl-badge-expiring"
        data-state="expiring"
      >
        Expires in {days}d
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[11px] uppercase tracking-wide"
      style={{
        background:
          "color-mix(in srgb, var(--color-neon-green) 12%, transparent)",
        color: "var(--color-neon-green)",
        borderColor:
          "color-mix(in srgb, var(--color-neon-green) 35%, transparent)",
      }}
      data-testid="ssl-badge-valid"
      data-state="valid"
    >
      Valid · {days}d
    </Badge>
  );
}
