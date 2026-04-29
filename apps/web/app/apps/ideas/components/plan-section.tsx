"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

const STALE_THRESHOLD_MS = 30 * 86_400_000;

interface PlanSectionProps {
  plan: string | null;
  planModel: string | null;
  planGeneratedAt: string | null;
}

function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffMs = now - then;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const sign = diffMs >= 0 ? -1 : 1;
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return rtf.format(sign * Math.round(abs / 1000), "second");
  if (abs < 3_600_000)
    return rtf.format(sign * Math.round(abs / 60_000), "minute");
  if (abs < 86_400_000)
    return rtf.format(sign * Math.round(abs / 3_600_000), "hour");
  if (abs < 30 * 86_400_000)
    return rtf.format(sign * Math.round(abs / 86_400_000), "day");
  if (abs < 365 * 86_400_000)
    return rtf.format(sign * Math.round(abs / (30 * 86_400_000)), "month");
  return rtf.format(sign * Math.round(abs / (365 * 86_400_000)), "year");
}

export function PlanSection({
  plan,
  planModel,
  planGeneratedAt,
}: PlanSectionProps) {
  const [open, setOpen] = useState(false);

  if (!plan) return null;

  const isStale =
    !!planGeneratedAt &&
    Date.now() - new Date(planGeneratedAt).getTime() > STALE_THRESHOLD_MS;

  const captionClass = isStale
    ? "text-[10px] text-white/30 italic"
    : "text-[10px] text-white/50";

  const relative = planGeneratedAt
    ? formatRelativeTime(planGeneratedAt)
    : "unknown";
  const modelLabel = planModel ?? "unknown model";

  return (
    <div className="border-t border-white/8 pt-2">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="text-[11px] text-white/60 hover:text-white/90"
      >
        {open ? "Hide plan" : "Show plan"}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="prose prose-invert prose-sm max-w-none text-xs text-white/80">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
          <p className={captionClass} data-testid="plan-caption">
            Generated {relative} by {modelLabel}
            {isStale ? " · stale" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
