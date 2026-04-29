import { requireAccess } from "@repo/auth/server";
import {
  getEventTotalsBySlug,
  getRecentEvents,
  getTopEvents,
} from "./lib/posthog-client";
import { AnalyticsApp } from "./components/analytics-app";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAccess("command-center", "admin");
  const [totalsBySlug, recentEvents, topEvents] = await Promise.all([
    getEventTotalsBySlug(7),
    getRecentEvents(50),
    getTopEvents(10, 7),
  ]);
  return (
    <AnalyticsApp data={{ totalsBySlug, recentEvents, topEvents }} />
  );
}
