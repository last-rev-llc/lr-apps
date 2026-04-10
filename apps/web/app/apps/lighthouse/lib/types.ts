export interface LighthouseSite {
  id: string;
  name: string;
  url: string;
  createdAt?: string | null;
  latestRun?: LighthouseRun | null;
  runs: LighthouseRun[];
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
