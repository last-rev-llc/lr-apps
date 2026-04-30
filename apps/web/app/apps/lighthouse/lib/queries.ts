import { createClient } from "@repo/db/server";
import type { LighthouseSite } from "./types";

export async function getSites(): Promise<LighthouseSite[]> {
  const supabase = await createClient();
  const { data: sites, error } = await (supabase as any)
    .from("lighthouse_audits")
    .select("*, lighthouse_runs(id, performance, accessibility, best_practices, seo, lcp, fid, cls, fcp, ttfb, run_at)")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch lighthouse sites:", error);
    return [];
  }

  return (sites ?? []).map((row: any) => {
    const runs: any[] = row.lighthouse_runs ?? [];
    const sorted = runs.sort((a: any, b: any) =>
      (a.run_at ?? "").localeCompare(b.run_at ?? "")
    );
    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    const mapRun = (r: any) => ({
      id: r.id,
      siteId: row.id,
      performance: r.performance,
      accessibility: r.accessibility,
      bestPractices: r.best_practices,
      seo: r.seo,
      lcp: r.lcp,
      fid: r.fid,
      cls: r.cls,
      fcp: r.fcp,
      ttfb: r.ttfb,
      runAt: r.run_at,
    });

    return {
      id: row.id,
      name: row.name,
      url: row.url,
      createdAt: row.created_at,
      latestRun: latest ? mapRun(latest) : null,
      runs: sorted.map(mapRun),
    };
  });
}
