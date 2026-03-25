import { getClients, computeOverviewStats } from "./lib/queries";
import { AccountsApp } from "./components/accounts-app";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const clients = await getClients();
  const stats = computeOverviewStats(clients);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-accent">Accounts</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Every client. One dashboard.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: stats.total, label: "Clients" },
          { value: stats.totalPRs, label: "Open PRs" },
          { value: stats.totalContacts, label: "Contacts" },
          { value: stats.totalJiraTickets, label: "Jira Tickets" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="glass border border-surface-border rounded-lg px-4 py-3 text-center"
          >
            <div className="text-2xl font-bold text-accent">{value}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      <AccountsApp clients={clients} />
    </div>
  );
}
