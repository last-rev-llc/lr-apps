"use client";

import { Badge, Card, CardContent } from "@repo/ui";
import type { LighthouseRun } from "../lib/types";

function vitalLevel(metric: string, value: number | null | undefined): "default" | "secondary" | "destructive" {
  if (value == null) return "secondary";
  // Core Web Vitals + Lighthouse-lab thresholds (web.dev guidance).
  // FID/TTFB were dropped in modern Lighthouse — TBT and SI replace them.
  if (metric === "lcp") return value <= 2500 ? "default" : value <= 4000 ? "secondary" : "destructive";
  if (metric === "tbt") return value <= 200 ? "default" : value <= 600 ? "secondary" : "destructive";
  if (metric === "cls") return value <= 0.1 ? "default" : value <= 0.25 ? "secondary" : "destructive";
  if (metric === "fcp") return value <= 1800 ? "default" : value <= 3000 ? "secondary" : "destructive";
  // Speed Index is reported in seconds (e.g. 2.4), not ms.
  if (metric === "si") return value <= 3.4 ? "default" : value <= 5.8 ? "secondary" : "destructive";
  return "secondary";
}

function formatValue(metric: string, value: number | null | undefined): string {
  if (value == null) return "—";
  if (metric === "cls") return value.toFixed(3);
  if (metric === "si") return `${value.toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

function levelLabel(variant: "default" | "secondary" | "destructive"): string {
  if (variant === "default") return "Good";
  if (variant === "secondary") return "Needs Improvement";
  return "Poor";
}

interface VitalsDetailProps {
  run: LighthouseRun;
  siteName: string;
}

export function VitalsDetail({ run, siteName }: VitalsDetailProps) {
  const vitals = [
    { key: "lcp", label: "LCP", description: "Largest Contentful Paint", value: run.lcp },
    { key: "tbt", label: "TBT", description: "Total Blocking Time", value: run.tbt },
    { key: "cls", label: "CLS", description: "Cumulative Layout Shift", value: run.cls },
    { key: "fcp", label: "FCP", description: "First Contentful Paint", value: run.fcp },
    { key: "si", label: "SI", description: "Speed Index", value: run.si },
  ];

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <h3 className="font-semibold text-white mb-3 text-sm">Core Web Vitals — {siteName}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {vitals.map(({ key, label, description, value }) => {
            const variant = vitalLevel(key, value);
            return (
              <div key={key} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{label}</span>
                  <Badge variant={variant} className="text-[10px] px-1 py-0">
                    {levelLabel(variant)}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-white">{formatValue(key, value)}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{description}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
