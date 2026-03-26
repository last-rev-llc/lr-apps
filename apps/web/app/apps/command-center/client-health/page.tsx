import { getHealthSites } from "./lib/queries";
import { HealthApp } from "./components/health-app";

export const dynamic = "force-dynamic";

export default async function ClientHealthPage() {
  const sites = await getHealthSites();

  return <HealthApp initialSites={sites} />;
}
