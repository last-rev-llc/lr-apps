import { getStandupDays } from "./lib/queries";
import { StandupApp } from "./components/standup-app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daily Standup — Last Rev",
  description: "Aggregated daily standup notes from Slack, GitHub, and Workspace.",
};

export default async function StandupPage() {
  const days = await getStandupDays();

  let lastUpdated: string | null = null;
  if (days.length > 0) {
    const latest = days.reduce((a, b) =>
      (a.updatedAt ?? "") > (b.updatedAt ?? "") ? a : b,
    );
    if (latest.updatedAt) {
      lastUpdated = new Date(latest.updatedAt).toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }

  return <StandupApp days={days} lastUpdated={lastUpdated} />;
}
