import { getLeads } from "./lib/queries";
import { LeadsApp } from "./components/leads-app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sales Pipeline — Last Rev",
  description: "Sales leads pipeline dashboard.",
};

export default async function SalesPage() {
  const leads = await getLeads();
  return <LeadsApp initialLeads={leads} />;
}
