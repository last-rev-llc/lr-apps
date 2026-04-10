export type ScoreLevel = "good" | "needs-improvement" | "poor";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 90) return "good";
  if (score >= 50) return "needs-improvement";
  return "poor";
}

export interface LighthouseSite {
  id: string;
  name: string;
  url: string;
  createdAt?: string | null;
  latestRun?: LighthouseRun | null;
}

export interface LighthouseRun {
  id: string;
  siteId: string;
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
  lcp?: number | null;
  fid?: number | null;
  cls?: number | null;
  fcp?: number | null;
  ttfb?: number | null;
  runAt?: string | null;
}
