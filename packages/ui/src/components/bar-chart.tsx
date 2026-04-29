"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  color?: string;
  ariaLabel?: string;
}

export function BarChart({
  data,
  height = 240,
  color = "var(--color-accent)",
  ariaLabel,
}: BarChartProps) {
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <RBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-surface-border)",
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
