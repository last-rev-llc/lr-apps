import { getSentimentEntries } from "./lib/queries";
import { SentimentDashboard } from "./components/sentiment-dashboard";

export const dynamic = "force-dynamic";

export default async function SentimentPage() {
  const entries = await getSentimentEntries();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-accent">Team Sentiment</h1>
        <p className="text-muted-foreground text-sm">
          Track mood, blockers, and highlights across your team.
        </p>
      </div>
      <SentimentDashboard entries={entries} />
    </div>
  );
}
