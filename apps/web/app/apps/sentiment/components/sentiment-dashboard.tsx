"use client";

import { useState, useMemo } from "react";
import { MemberFilter } from "./member-filter";
import { SentimentChart } from "./sentiment-chart";
import { StatsRow } from "./stats-row";
import { MemberGrid } from "./member-grid";
import { Timeline } from "./timeline";
import { getMemberSummaries, groupByDate } from "../lib/utils";
import type { SentimentEntry } from "../lib/types";

interface SentimentDashboardProps {
  entries: SentimentEntry[];
}

export function SentimentDashboard({ entries }: SentimentDashboardProps) {
  const [selectedMember, setSelectedMember] = useState("all");

  const members = useMemo(
    () => [...new Set(entries.map((e) => e.member_name))].sort(),
    [entries],
  );

  const filteredEntries = useMemo(
    () =>
      selectedMember === "all"
        ? entries
        : entries.filter((e) => e.member_name === selectedMember),
    [entries, selectedMember],
  );

  const memberSummaries = useMemo(
    () => getMemberSummaries(filteredEntries),
    [filteredEntries],
  );

  const dayGroups = useMemo(
    () => groupByDate(filteredEntries),
    [filteredEntries],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Dashboard</h2>
        <MemberFilter
          members={members}
          value={selectedMember}
          onChange={setSelectedMember}
        />
      </div>

      <StatsRow entries={filteredEntries} />
      <SentimentChart entries={entries} selectedMember={selectedMember} />
      <MemberGrid members={memberSummaries} />

      <div>
        <h2 className="text-lg font-medium mb-4">Timeline</h2>
        <Timeline groups={dayGroups} />
      </div>
    </div>
  );
}
