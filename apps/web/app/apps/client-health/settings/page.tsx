import { requireAccess } from "@repo/auth/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import { getAlertSettings } from "../lib/queries";
import { SettingsForm } from "./components/settings-form";

export const dynamic = "force-dynamic";

export default async function ClientHealthSettingsPage() {
  const { user } = await requireAccess("client-health");
  const hasAccess = await enforceFeatureTier(user.id, "client-health:settings");
  if (!hasAccess) return <UpgradePrompt requiredTier="pro" />;

  const initial = await getAlertSettings(user.id);
  return <SettingsForm initial={initial} />;
}
