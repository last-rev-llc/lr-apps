export interface SlugTotal {
  slug: string;
  count: number;
}

export interface RecentEvent {
  timestamp: string;
  userIdHash: string;
  event: string;
  slug: string | null;
}

export interface TopEvent {
  event: string;
  count: number;
}

export interface AnalyticsData {
  totalsBySlug: SlugTotal[];
  recentEvents: RecentEvent[];
  topEvents: TopEvent[];
}
