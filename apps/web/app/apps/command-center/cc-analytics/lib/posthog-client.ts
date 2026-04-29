import { hashUserId } from "@repo/analytics/server";
import type { RecentEvent, SlugTotal, TopEvent } from "./types";

interface PostHogEvent {
  uuid?: string;
  event: string;
  timestamp: string;
  distinct_id: string;
  properties?: Record<string, unknown>;
}

interface PostHogEventsResponse {
  results: PostHogEvent[];
}

function getEnv(): { host: string; projectId: string; apiKey: string } | null {
  const host = process.env.NEXT_PUBLIC_ANALYTICS_HOST?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!host || !projectId || !apiKey) return null;
  return { host, projectId, apiKey };
}

async function fetchEvents(
  params: Record<string, string>,
): Promise<PostHogEventsResponse | null> {
  const env = getEnv();
  if (!env) return null;
  const url = new URL(
    `${env.host}/api/projects/${env.projectId}/events/`,
  );
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${env.apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PostHog API error: ${res.status}`);
  }
  return (await res.json()) as PostHogEventsResponse;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getEventTotalsBySlug(
  days: number,
): Promise<SlugTotal[]> {
  const data = await fetchEvents({ after: isoDaysAgo(days), limit: "1000" });
  if (!data) return [];
  const totals = new Map<string, number>();
  for (const e of data.results) {
    const slug =
      typeof e.properties?.slug === "string" ? e.properties.slug : "(none)";
    totals.set(slug, (totals.get(slug) ?? 0) + 1);
  }
  return Array.from(totals.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getRecentEvents(limit: number): Promise<RecentEvent[]> {
  const data = await fetchEvents({ limit: String(limit) });
  if (!data) return [];
  return data.results.map((e) => ({
    timestamp: e.timestamp,
    userIdHash: e.distinct_id ? hashUserId(e.distinct_id) : "",
    event: e.event,
    slug:
      typeof e.properties?.slug === "string" ? e.properties.slug : null,
  }));
}

export async function getTopEvents(
  limit: number,
  days: number,
): Promise<TopEvent[]> {
  const data = await fetchEvents({ after: isoDaysAgo(days), limit: "1000" });
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const e of data.results) {
    counts.set(e.event, (counts.get(e.event) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
