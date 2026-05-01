import { requireAccess } from "@repo/auth/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import { listAlertsForUser } from "../lib/queries";
import { AlertList } from "./components/alert-list";

export const dynamic = "force-dynamic";

export default async function ClientHealthAlertsPage() {
  const { user } = await requireAccess("client-health");
  const hasAccess = await enforceFeatureTier(user.id, "client-health:alerting");
  if (!hasAccess) return <UpgradePrompt requiredTier="pro" />;

  const initial = await listAlertsForUser(user.id, 100);
  return <AlertList initial={initial} />;
}
