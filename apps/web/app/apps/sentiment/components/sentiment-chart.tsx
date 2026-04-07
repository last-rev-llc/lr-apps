"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SentimentEntry } from "../lib/types";

const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

interface SentimentChartProps {
  entries: SentimentEntry[];
  selectedMember: string;
}

export function SentimentChart({ entries, selectedMember }: SentimentChartProps) {
  if (entries.length === 0) return null;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (selectedMember !== "all") {
    const memberEntries = sortedEntries.filter(
      (e) => e.member_name === selectedMember,
    );
    const chartData = memberEntries.map((e) => ({
      date: e.date,
      score: e.sentiment_score,
    }));

    return (
      <div className="glass-sm p-4">
        <h3 className="text-sm font-medium mb-4">Sentiment Trend — {selectedMember}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 22, 41, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // All members — multi-line
  const members = [...new Set(sortedEntries.map((e) => e.member_name))];
  const dates = [...new Set(sortedEntries.map((e) => e.date))].sort();
  const chartData = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    members.forEach((member) => {
      const entry = sortedEntries.find((e) => e.date === date && e.member_name === member);
      if (entry) point[member] = entry.sentiment_score;
    });
    return point;
  });

  return (
    <div className="glass-sm p-4">
      <h3 className="text-sm font-medium mb-4">Team Sentiment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              background: "rgba(15, 22, 41, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {members.map((member, i) => (
            <Line
              key={member}
              type="monotone"
              dataKey={member}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
