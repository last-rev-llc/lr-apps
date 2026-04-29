import { Card, CardContent, PageHeader } from "@repo/ui";
import { EventTotalsBySlug } from "./event-totals-by-slug";
import { RecentEventsList } from "./recent-events-list";
import { TopEventsChart } from "./top-events-chart";
import type { AnalyticsData } from "../lib/types";

interface Props {
  data: AnalyticsData;
}

export function AnalyticsApp({ data }: Props) {
  const total = data.totalsBySlug.reduce((acc, t) => acc + t.count, 0);
  return (
    <div className="space-y-4">
      <PageHeader
        title="📊 Analytics"
        subtitle={`${total} event${total === 1 ? "" : "s"} in the last 7 days`}
      />

      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <h2 className="text-sm font-semibold">Events by app slug (7d)</h2>
          <EventTotalsBySlug totals={data.totalsBySlug} />
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <h2 className="text-sm font-semibold">Top 10 events (7d)</h2>
          <TopEventsChart events={data.topEvents} />
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <h2 className="text-sm font-semibold">Recent events</h2>
          <RecentEventsList events={data.recentEvents} />
        </CardContent>
      </Card>
    </div>
  );
}
