"use client";

import { BarChart } from "@repo/ui";
import type { TopEvent } from "../lib/types";

interface Props {
  events: TopEvent[];
}

export function TopEventsChart({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        Not enough data to chart yet.
      </div>
    );
  }
  return (
    <BarChart
      data={events.map((e) => ({ label: e.event, value: e.count }))}
      ariaLabel="Top 10 events by count"
    />
  );
}
