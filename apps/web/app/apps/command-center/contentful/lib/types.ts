export interface ContentfulEntry {
  id: string;
  title?: string | null;
  space?: string | null;
  contentType: string;
  status: "published" | "draft" | "changed" | "archived";
  daysSinceUpdate?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  url?: string | null;
}

export interface ContentfulHealth {
  id: string;
  space: string;
  totalEntries: number;
  publishedEntries: number;
  draftEntries: number;
  changedEntries: number;
  staleEntries: number;
  lastChecked: string;
  staleDrafts?: ContentfulEntry[] | null;
  recentPublishes?: ContentfulEntry[] | null;
}
