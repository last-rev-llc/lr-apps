"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader } from "@repo/ui";
import { acknowledgeAlert, snoozeAlert } from "../../lib/actions";
import type { AlertHistoryRow } from "../../lib/queries";

interface AlertListProps {
  initial: AlertHistoryRow[];
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return DATE_FMT.format(new Date(iso));
}

function severityStyle(severity: string): {
  background: string;
  color: string;
  borderColor: string;
} {
  if (severity === "critical") {
    return {
      background: "color-mix(in srgb, var(--color-red) 12%, transparent)",
      color: "var(--color-red)",
      borderColor: "color-mix(in srgb, var(--color-red) 35%, transparent)",
    };
  }
  if (severity === "warning") {
    return {
      background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
      color: "var(--color-accent-400)",
      borderColor: "color-mix(in srgb, var(--color-accent) 35%, transparent)",
    };
  }
  return {
    background: "color-mix(in srgb, var(--color-neon-green) 12%, transparent)",
    color: "var(--color-neon-green)",
    borderColor:
      "color-mix(in srgb, var(--color-neon-green) 35%, transparent)",
  };
}

function classify(
  acknowledgedAt: string | null,
): "open" | "snoozed" | "acknowledged" {
  if (!acknowledgedAt) return "open";
  return new Date(acknowledgedAt).getTime() > Date.now()
    ? "snoozed"
    : "acknowledged";
}

export function AlertList({ initial }: AlertListProps) {
  const [rows, setRows] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    let open = 0;
    let snoozed = 0;
    let acknowledged = 0;
    for (const r of rows) {
      const s = classify(r.acknowledgedAt);
      if (s === "open") open++;
      else if (s === "snoozed") snoozed++;
      else acknowledged++;
    }
    return { open, snoozed, acknowledged };
  }, [rows]);

  function handleAck(id: string) {
    setPendingId(id);
    setError(null);
    startTransition(async () => {
      const result = await acknowledgeAlert(id);
      if (result.ok) {
        const now = new Date().toISOString();
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, acknowledgedAt: now } : r)),
        );
      } else {
        setError(result.error);
      }
      setPendingId(null);
    });
  }

  function handleSnooze(id: string) {
    setPendingId(id);
    setError(null);
    startTransition(async () => {
      const result = await snoozeAlert(id, 24);
      if (result.ok) {
        const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, acknowledgedAt: until } : r)),
        );
      } else {
        setError(result.error);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader
        title="Alerts"
        subtitle={`${counts.open} open · ${counts.snoozed} snoozed · ${counts.acknowledged} acknowledged`}
      />

      {error ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No alerts yet"
          description="Alerts triggered by health checks will appear here."
        />
      ) : (
        <ul className="space-y-2" data-testid="alert-list">
          {rows.map((row) => {
            const state = classify(row.acknowledgedAt);
            const sev = severityStyle(row.severity);
            return (
              <li
                key={row.id}
                data-testid={`alert-row-${row.id}`}
                data-state={state}
              >
                <Card>
                  <CardContent className="p-4 flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wide"
                          style={sev}
                        >
                          {row.severity}
                        </Badge>
                        <span className="text-xs uppercase text-muted-foreground tracking-wide">
                          {row.type}
                        </span>
                        {row.clientName ? (
                          <span className="text-sm text-foreground font-medium">
                            · {row.clientName}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-foreground">
                        {row.message || "(no summary)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDateTime(row.createdAt)}
                        {row.deliveredAt
                          ? ` · delivered ${formatDateTime(row.deliveredAt)}`
                          : ""}
                        {state === "acknowledged"
                          ? ` · acknowledged ${formatDateTime(row.acknowledgedAt)}`
                          : ""}
                        {state === "snoozed"
                          ? ` · snoozed until ${formatDateTime(row.acknowledgedAt)}`
                          : ""}
                      </p>
                    </div>

                    {state === "open" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending && pendingId === row.id}
                          onClick={() => handleSnooze(row.id)}
                          data-testid={`snooze-${row.id}`}
                        >
                          Snooze 24h
                        </Button>
                        <Button
                          size="sm"
                          disabled={isPending && pendingId === row.id}
                          onClick={() => handleAck(row.id)}
                          data-testid={`ack-${row.id}`}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[11px] uppercase tracking-wide bg-surface-raised text-muted-foreground border-surface-border"
                      >
                        {state}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
