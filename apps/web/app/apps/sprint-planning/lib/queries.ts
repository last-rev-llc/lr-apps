import { createClient } from "@repo/db/server";
import type { ArchiveRecord } from "./types";

export async function getArchives(): Promise<ArchiveRecord[]> {
  const supabase = await createClient();

  const [digestsResult, overviewsResult, weekliesResult] = await Promise.all([
    supabase
      .from("daily_digests")
      .select("*")
      .order("date", { ascending: false }),
    supabase
      .from("daily_overviews")
      .select("*")
      .order("date", { ascending: false }),
    supabase
      .from("weekly_summaries")
      .select("*")
      .order("start_date", { ascending: false }),
  ]);

  const digests: ArchiveRecord[] = (
    (digestsResult.data ?? []) as unknown as Record<string, unknown>[]
  ).map((r) => ({ ...r, _type: "digest" as const }) as unknown as ArchiveRecord);

  const overviews: ArchiveRecord[] = (
    (overviewsResult.data ?? []) as unknown as Record<string, unknown>[]
  ).map((r) => ({ ...r, _type: "overview" as const }) as unknown as ArchiveRecord);

  const weeklies: ArchiveRecord[] = (
    (weekliesResult.data ?? []) as unknown as Record<string, unknown>[]
  ).map(
    (r) =>
      ({
        ...r,
        _type: "weekly" as const,
        date: (r.start_date ?? r.created_at) as string,
      }) as unknown as ArchiveRecord,
  );

  const all = [...digests, ...overviews, ...weeklies];
  all.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return all;
}
