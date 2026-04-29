import { notFound } from "next/navigation";
import { createClient } from "@repo/db/server";
import { getClientHealth } from "../lib/queries";
import { ClientDetail } from "../components/client-detail";
import type { ClientHealthAlert } from "../lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

async function getAlerts(clientId: string): Promise<ClientHealthAlert[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_health_alerts")
    .select("*")
    .eq("clientId", clientId)
    .order("createdAt", { ascending: false });
  return (data ?? []) as ClientHealthAlert[];
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  const payload = await getClientHealth(clientId);
  if (!payload) notFound();

  const alerts = await getAlerts(clientId);

  return <ClientDetail payload={payload} alerts={alerts} />;
}
