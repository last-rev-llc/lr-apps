import { getLeads } from "./lib/queries";
import { LeadsApp } from "./components/leads-app";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const leads = await getLeads();
  return <LeadsApp initialLeads={leads} />;
}
