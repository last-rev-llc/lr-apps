import { createClient } from "@repo/db/server";
import type { LighthouseRun, LighthouseSite } from "./types";

// Production schema (`public.lighthouse_audits`) is a single denormalized
// table — no per-audit row, no FK to a runs table. Each row is one tracked
// site with the audit history stored as a JSONB array under `audits`. Each
// audit object looks like:
//   { date, seo, performance, accessibility, bestPractices,
//     details: { lcp, fcp, cls, tbt, si } }
type AuditDetailsJson = {
  lcp?: number | null;
  fcp?: number | null;
  cls?: number | null;
  tbt?: number | null;
  si?: number | null;
};

type AuditJson = {
  date?: string | null;
  seo?: number | null;
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  details?: AuditDetailsJson | null;
};

type LighthouseAuditRow = {
  id: string;
  site: string;
  url: string | null;
  audits: AuditJson[] | null;
  createdAt: string | null;
};

function toRun(siteId: string, audit: AuditJson, idx: number): LighthouseRun {
  const d = audit.details ?? {};
  return {
    // Audit objects in JSONB have no stable identity; pin the React list key
    // to (site-id, array-index) which is stable across re-renders for a
    // given DB row.
    id: `${siteId}-${idx}`,
    siteId,
    performance: audit.performance ?? null,
    accessibility: audit.accessibility ?? null,
    bestPractices: audit.bestPractices ?? null,
    seo: audit.seo ?? null,
    lcp: d.lcp ?? null,
    tbt: d.tbt ?? null,
    cls: d.cls ?? null,
    fcp: d.fcp ?? null,
    si: d.si ?? null,
    runAt: audit.date ?? null,
  };
}

export async function getSites(): Promise<LighthouseSite[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{ data: LighthouseAuditRow[] | null; error: unknown }>;
      };
    };
  })
    .from("lighthouse_audits")
    .select("id, site, url, audits, createdAt")
    .order("site", { ascending: true });

  if (error) {
    console.error("Failed to fetch lighthouse audits:", error);
    return [];
  }

  return (data ?? []).map((row): LighthouseSite => {
    const audits = row.audits ?? [];
    const runs = audits
      .map((a, idx) => toRun(row.id, a, idx))
      .sort((a, b) =>
        (a.runAt ?? "").localeCompare(b.runAt ?? ""),
      );
    const latest = runs.length > 0 ? runs[runs.length - 1] : null;

    return {
      id: row.id,
      name: row.site,
      url: row.url ?? "",
      createdAt: row.createdAt,
      latestRun: latest,
      runs,
    };
  });
}
