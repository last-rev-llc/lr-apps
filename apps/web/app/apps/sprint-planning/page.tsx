import { getArchives } from "./lib/queries";
import { SprintApp } from "./components/sprint-app";

export const dynamic = "force-dynamic";

export default async function SprintPlanningPage() {
  // Archives are fetched server-side; backlog is loaded client-side from JSON
  const archives = await getArchives();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-accent">Sprint Backlog</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Sprint backlog &amp; task management — grouped by client
        </p>
      </div>
      <SprintApp archives={archives} />
    </div>
  );
}
