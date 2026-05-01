"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@repo/ui";
import UpgradePrompt from "@/components/UpgradePrompt";
import { summarizeClientHealth } from "../lib/actions";
import type { Summary } from "../lib/ai-summary";

type PanelState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; summary: Summary; cached: boolean; cachedAt: string }
  | { kind: "feature_locked"; requiredTier: "pro" | "enterprise" }
  | { kind: "rate_limited"; resetAt: number }
  | { kind: "error"; message: string };

interface AISummaryPanelProps {
  clientId: string;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return iso;
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatResetIn(resetAt: number): string {
  const ms = resetAt - Date.now();
  if (ms <= 0) return "now";
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  return `${hours}h`;
}

export function AISummaryPanel({ clientId }: AISummaryPanelProps) {
  const [state, setState] = useState<PanelState>({ kind: "idle" });

  const run = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const result = await summarizeClientHealth(clientId);
      if (result.ok) {
        setState({
          kind: "success",
          summary: result.summary,
          cached: result.cached,
          cachedAt: result.cachedAt,
        });
        return;
      }
      if (result.error === "feature_locked") {
        setState({ kind: "feature_locked", requiredTier: result.requiredTier });
        return;
      }
      if (result.error === "rate_limited") {
        setState({ kind: "rate_limited", resetAt: result.resetAt });
        return;
      }
      setState({ kind: "error", message: result.error });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [clientId]);

  useEffect(() => {
    void run();
  }, [run]);

  if (state.kind === "feature_locked") {
    return <UpgradePrompt requiredTier={state.requiredTier} />;
  }

  return (
    <Card className="p-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">AI Health Summary</CardTitle>
        <div className="flex items-center gap-2">
          {state.kind === "success" && (
            <span className="text-[11px] text-white/50">
              {state.cached ? "Cached · " : ""}
              {formatRelative(state.cachedAt)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void run()}
            disabled={state.kind === "loading"}
          >
            {state.kind === "loading" ? "Summarizing…" : "Refresh summary"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.kind === "loading" && (
          <div className="space-y-2" data-testid="ai-summary-loading">
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-4 w-2/3" />
            <LoadingSkeleton className="h-4 w-1/2" />
          </div>
        )}

        {state.kind === "rate_limited" && (
          <p className="text-sm text-amber-400" role="alert">
            Rate limit reached. Try again in {formatResetIn(state.resetAt)}.
          </p>
        )}

        {state.kind === "error" && (
          <p className="text-sm text-red-400" role="alert">
            Failed to load summary: {state.message}
          </p>
        )}

        {state.kind === "success" && (
          <>
            <p className="text-sm text-white/85 leading-relaxed">
              {state.summary.headline}
            </p>

            {state.summary.positives.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">
                  Positives
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-white/80">
                  {state.summary.positives.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {state.summary.concerns.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Concerns
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-white/80">
                  {state.summary.concerns.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {state.summary.recommendations.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">
                  Recommendations
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-white/80">
                  {state.summary.recommendations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
