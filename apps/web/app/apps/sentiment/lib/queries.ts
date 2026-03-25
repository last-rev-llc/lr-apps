import { createClient } from "@repo/db/server";
import type { SentimentEntry, MemberSummary, DayGroup } from "./types";

export async function getSentimentEntries(): Promise<SentimentEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentiment_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SentimentEntry[];
}

export function getMemberSummaries(entries: SentimentEntry[]): MemberSummary[] {
  const memberMap = new Map<string, SentimentEntry[]>();
  entries.forEach((e) => {
    const list = memberMap.get(e.member_name) ?? [];
    list.push(e);
    memberMap.set(e.member_name, list);
  });

  return Array.from(memberMap.entries())
    .map(([name, memberEntries]) => {
      const sorted = [...memberEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const avgScore =
        memberEntries.reduce((sum, e) => sum + e.sentiment_score, 0) /
        memberEntries.length;
      return {
        name,
        latestMood: sorted[0].mood,
        latestScore: sorted[0].sentiment_score,
        avgScore: Math.round(avgScore * 10) / 10,
        entryCount: memberEntries.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function groupByDate(entries: SentimentEntry[]): DayGroup[] {
  const groups = new Map<string, SentimentEntry[]>();
  entries.forEach((e) => {
    const list = groups.get(e.date) ?? [];
    list.push(e);
    groups.set(e.date, list);
  });

  return Array.from(groups.entries())
    .map(([date, dayEntries]) => ({ date, entries: dayEntries }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
