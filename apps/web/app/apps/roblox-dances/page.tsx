import { getDances, getDanceSubmissions } from "./lib/queries";
import { DanceApp } from "./components/dance-app";

export const dynamic = "force-dynamic";

export default async function RobloxDancesPage() {
  const [dances, submissions] = await Promise.all([
    getDances(),
    getDanceSubmissions(),
  ]);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-3xl text-pill-6 mb-1">
          🕺 Roblox Dance Marketplace
        </h1>
        <p className="text-muted-foreground text-sm">
          Animated dance moves for Roblox
        </p>
      </div>
      <DanceApp initialDances={dances} initialSubmissions={submissions} />
    </div>
  );
}
