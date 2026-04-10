import { getSites } from "./lib/queries";
import { LighthouseApp } from "./components/lighthouse-app";

export const dynamic = "force-dynamic";

export default async function LighthousePage() {
  const sites = await getSites();
  return <LighthouseApp initialSites={sites} />;
}
