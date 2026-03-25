import { getInitialUpdates, getSourceApps, getUniqueCategories } from "./lib/queries";
import { FeedApp } from "./components/feed-app";

export const dynamic = "force-dynamic";

export default async function DailyUpdatesPage() {
  const [updates, profiles, categories] = await Promise.all([
    getInitialUpdates(20),
    getSourceApps(),
    getUniqueCategories(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-accent">📱 Daily Updates</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Where apps come to brag about wins.
        </p>
      </div>
      <FeedApp
        initialUpdates={updates}
        profiles={profiles}
        categories={categories}
      />
    </div>
  );
}
