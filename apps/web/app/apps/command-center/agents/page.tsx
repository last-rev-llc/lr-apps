import { getAgents } from "./lib/queries";
import { AgentsApp } from "./components/agents-app";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgents();
  return <AgentsApp initialAgents={agents} />;
}
