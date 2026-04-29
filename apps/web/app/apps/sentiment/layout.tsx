import { requireAccess } from "@repo/auth/server";
import { capture } from "@repo/analytics/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import type { ReactNode } from "react";

export default async function SentimentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAccess("sentiment");
  const hasAccess = await enforceFeatureTier(user.id, "sentiment");
  if (!hasAccess) return <UpgradePrompt requiredTier="pro" />;
  await capture(user.id, "app_opened", { slug: "sentiment" });

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-heading text-xl text-accent">Sentiment</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="text-foreground hover:text-accent">Dashboard</a>
              <a href="/about" className="text-muted-foreground hover:text-accent">About</a>
              <a href="/docs" className="text-muted-foreground hover:text-accent">Docs</a>
              <a href="/changelog" className="text-muted-foreground hover:text-accent">Changelog</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
