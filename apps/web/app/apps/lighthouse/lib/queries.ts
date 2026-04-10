import { createServerClient } from "@repo/db/server";
import type { LighthouseSite, LighthouseRun } from "./types";

export async function getSites(): Promise<LighthouseSite[]> {
  const supabase = await createServerClient();
  const { data: sites, error } = await (supabase as any)
    .from("lighthouse_sites")
    .select("*, lighthouse_runs(id, performance, accessibility, best_practices, seo, lcp, fid, cls, fcp, ttfb, run_at)")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch lighthouse sites:", error);
    return [];
  }

  return (sites ?? []).map((row: any) => {
    const runs: any[] = row.lighthouse_runs ?? [];
    const latest = runs.sort((a: any, b: any) =>
      (b.run_at ?? "").localeCompare(a.run_at ?? "")
    )[0] ?? null;

    return {
      id: row.id,
      name: row.name,
      url: row.url,
      createdAt: row.created_at,
      latestRun: latest ? {
        id: latest.id,
        siteId: row.id,
        performance: latest.performance,
        accessibility: latest.accessibility,
        bestPractices: latest.best_practices,
        seo: latest.seo,
        lcp: latest.lcp,
        fid: latest.fid,
        cls: latest.cls,
        fcp: latest.fcp,
        ttfb: latest.ttfb,
        runAt: latest.run_at,
      } : null,
    };
  });
}

export async function getSiteHistory(siteId: string): Promise<LighthouseRun[]> {
  const supabase = await createServerClient();
  const { data, error } = await (supabase as any)
    .from("lighthouse_runs")
    .select("*")
    .eq("site_id", siteId)
    .order("run_at", { ascending: true })
    .limit(30);

  if (error) {
    console.error("Failed to fetch site history:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    siteId: row.site_id,
    performance: row.performance,
    accessibility: row.accessibility,
    bestPractices: row.best_practices,
    seo: row.seo,
    lcp: row.lcp,
    fid: row.fid,
    cls: row.cls,
    fcp: row.fcp,
    ttfb: row.ttfb,
    runAt: row.run_at,
  }));
}
