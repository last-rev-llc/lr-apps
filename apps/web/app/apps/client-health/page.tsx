import { EmptyState, PageHeader } from "@repo/ui";
import { listClientHealth } from "./lib/queries";
import { ClientCard } from "./components/client-card";

export const dynamic = "force-dynamic";

export default async function ClientHealthPage() {
  const payloads = await listClientHealth();

  if (payloads.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Client Health"
          subtitle="Monitor uptime, SSL, tickets, and contract health per client."
        />
        <EmptyState
          icon="🩺"
          title="No clients yet"
          description="Add your first client to start tracking site health, SSL expiry, and open tickets."
        />
      </div>
    );
  }

  const total = payloads.length;
  const atRisk = payloads.filter((p) => p.score.score < 60).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Health"
        subtitle={`${total} client${total === 1 ? "" : "s"} · ${atRisk} at risk`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {payloads.map((payload) => (
          <ClientCard key={payload.client.id} payload={payload} />
        ))}
      </div>
    </div>
  );
}
