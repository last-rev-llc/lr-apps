import { requireAccess } from "@repo/auth/server";
import { hasFeatureAccess } from "@repo/billing";
import { getIdeas } from "./lib/queries";
import { IdeasApp } from "./components/ideas-app";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const { user } = await requireAccess("ideas");
  const [ideas, canUseAiPlan] = await Promise.all([
    getIdeas(user.id),
    hasFeatureAccess(user.id, "ideas:ai-plan"),
  ]);

  return <IdeasApp initialIdeas={ideas} canUseAiPlan={canUseAiPlan} />;
}
