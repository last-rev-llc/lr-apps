"use client";

import { Card, CardContent } from "@repo/ui";
import type { LighthouseRun } from "../lib/types";

interface ScoreHistoryProps {
  runs: LighthouseRun[];
  siteName: string;
}

const CATEGORIES = [
  { key: "performance" as const, label: "Performance", color: "#f59e0b" },
  { key: "accessibility" as const, label: "Accessibility", color: "#3b82f6" },
  { key: "bestPractices" as const, label: "Best Practices", color: "#10b981" },
  { key: "seo" as const, label: "SEO", color: "#a855f7" },
];

const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 8, right: 8, bottom: 24, left: 32 };

export function ScoreHistory({ runs, siteName }: ScoreHistoryProps) {
  if (runs.length < 2) {
    return (
      <Card className="p-4">
        <CardContent className="p-0">
          <h3 className="font-semibold text-white mb-3 text-sm">Score History — {siteName}</h3>
          <div className="text-center py-8 text-white/40 text-sm">
            Not enough data for a history chart. At least 2 runs are needed.
          </div>
        </CardContent>
      </Card>
    );
  }

  const innerWidth =
    Math.max(runs.length * 40, 200);
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const svgWidth = innerWidth + CHART_PADDING.left + CHART_PADDING.right;
  const svgHeight = CHART_HEIGHT;

  function x(index: number): number {
    return CHART_PADDING.left + (index / (runs.length - 1)) * innerWidth;
  }

  function y(score: number): number {
    return CHART_PADDING.top + innerHeight - (score / 100) * innerHeight;
  }

  function buildPath(key: (typeof CATEGORIES)[number]["key"]): string {
    const points = runs
      .map((run, i) => {
        const val = run[key];
        if (val == null) return null;
        return `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(val).toFixed(1)}`;
      })
      .filter(Boolean);
    return points.join(" ");
  }

  // Y-axis gridlines at 0, 25, 50, 75, 100
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <h3 className="font-semibold text-white mb-3 text-sm">Score History — {siteName}</h3>

        <div className="flex gap-4 mb-3 flex-wrap">
          {CATEGORIES.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-white/60">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="block"
            role="img"
            aria-label={`Score history chart for ${siteName}`}
          >
            {/* Grid lines */}
            {gridLines.map((val) => (
              <g key={val}>
                <line
                  x1={CHART_PADDING.left}
                  x2={CHART_PADDING.left + innerWidth}
                  y1={y(val)}
                  y2={y(val)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
                <text
                  x={CHART_PADDING.left - 4}
                  y={y(val) + 3}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.3)"
                  fontSize={9}
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Date labels */}
            {runs.map((run, i) => {
              // Show first, last, and every ~5th label to avoid crowding
              if (i !== 0 && i !== runs.length - 1 && i % 5 !== 0) return null;
              const dateStr = run.runAt
                ? new Date(run.runAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "";
              return (
                <text
                  key={run.id}
                  x={x(i)}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize={9}
                >
                  {dateStr}
                </text>
              );
            })}

            {/* Score lines */}
            {CATEGORIES.map(({ key, color }) => (
              <path
                key={key}
                d={buildPath(key)}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* Score dots */}
            {CATEGORIES.map(({ key, color }) =>
              runs.map((run, i) => {
                const val = run[key];
                if (val == null) return null;
                return (
                  <circle
                    key={`${key}-${run.id}`}
                    cx={x(i)}
                    cy={y(val)}
                    r={3}
                    fill={color}
                    opacity={0.9}
                  />
                );
              }),
            )}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
