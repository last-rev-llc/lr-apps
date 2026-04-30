export interface LighthouseSite {
  id: string;
  name: string;
  url: string;
  createdAt?: string | null;
  latestRun?: LighthouseRun | null;
  runs: LighthouseRun[];
}

// Mirrors the JSONB shape of `lighthouse_audits.audits[*]` in production.
// `id` is synthesized at query time (`<site-id>-<index>`) so the React list
// keys are stable; the DB rows have no per-audit identifier.
// FID and TTFB were dropped in modern Lighthouse — TBT (Total Blocking Time)
// and SI (Speed Index) replace them in `details`.
export interface LighthouseRun {
  id: string;
  siteId: string;
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
  lcp?: number | null;
  tbt?: number | null;
  cls?: number | null;
  fcp?: number | null;
  si?: number | null;
  runAt?: string | null;
}
