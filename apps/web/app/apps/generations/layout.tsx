import { requireAccess } from "@repo/auth/server";
import { capture } from "@repo/analytics/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import Link from "next/link";
import type { ReactNode } from "react";
import { Topbar, AppNav } from "@repo/ui";
import { GENERATIONS } from "./lib/generations";

export default async function GenerationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAccess("generations");
  const hasAccess = await enforceFeatureTier(user.id, "generations");
  if (!hasAccess) return <UpgradePrompt requiredTier="pro" />;
  await capture(user.id, "app_opened", { slug: "generations" });

  const navItems = GENERATIONS.map((gen) => ({
    label: `${gen.emoji} ${gen.name}`,
    href: `/apps/generations/${gen.slug}`,
  }));

  return (
    <div className="min-h-screen">
      <Topbar title="🕰️ Generations">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          ← Dashboard
        </Link>
      </Topbar>
      <AppNav items={navItems} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
