import { getClients, computeOverviewStats } from "./lib/queries";
import { AccountsApp } from "./components/accounts-app";
import { PageHeader, StatCard } from "@repo/ui";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const clients = await getClients();
  const stats = computeOverviewStats(clients);

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Every client. One dashboard."
        className="mb-6"
      />

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard value={stats.total} label="Clients" size="sm" />
        <StatCard value={stats.totalPRs} label="Open PRs" size="sm" />
        <StatCard value={stats.totalContacts} label="Contacts" size="sm" />
        <StatCard value={stats.totalJiraTickets} label="Jira Tickets" size="sm" />
      </div>

      <AccountsApp clients={clients} />
    </div>
  );
}
