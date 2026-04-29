import { requireAccess } from "@repo/auth/server";
import { capture } from "@repo/analytics/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Command Center — Last Rev",
  description: "Mission control for all Last Rev operations.",
};

const MODULES = [
  { slug: "leads", label: "Leads", icon: "🎯" },
  { slug: "agents", label: "Agents", icon: "🤖" },
  { slug: "ideas", label: "Ideas", icon: "💡" },
  { slug: "recipes", label: "Recipes", icon: "📋" },
  { slug: "users", label: "Users", icon: "👥" },
  { slug: "crons", label: "Crons", icon: "⏰" },
  { slug: "gallery", label: "Gallery", icon: "🖼️" },
  { slug: "architecture", label: "Architecture", icon: "🏗️" },
  { slug: "client-health", label: "Client Health", icon: "💚" },
  { slug: "concerts", label: "Concerts", icon: "🎵" },
  { slug: "contentful", label: "Contentful", icon: "📦" },
  { slug: "iron", label: "Iron", icon: "🔩" },
  { slug: "meeting-summaries", label: "Meeting Summaries", icon: "📝" },
  { slug: "meme-generator", label: "Meme Generator", icon: "😂" },
  { slug: "pr-review", label: "PR Review", icon: "🔍" },
  { slug: "rizz-guide", label: "Rizz Guide", icon: "✨" },
  { slug: "shopping-list", label: "Shopping List", icon: "🛒" },
  { slug: "team-usf", label: "Team USF", icon: "🏫" },
  { slug: "ai-scripts", label: "AI Scripts", icon: "🤖" },
  { slug: "app-access", label: "App Access", icon: "🔐" },
  { slug: "alphaclaw", label: "AlphaClaw", icon: "🦅" },
  { slug: "cc-flags", label: "Feature Flags", icon: "🚩" },
];

export default async function CommandCenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAccess("command-center");
  const hasAccess = await enforceFeatureTier(user.id, "command-center");
  if (!hasAccess) return <UpgradePrompt requiredTier="enterprise" />;
  await capture(user.id, "app_opened", { slug: "command-center" });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="glass-header sticky top-0 z-50">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/apps/command-center"
            className="font-heading text-xl text-accent hover:opacity-80 transition-opacity shrink-0"
          >
            ⚡ Command Center
          </Link>
          <span className="text-muted-foreground text-xs hidden sm:block">
            Mission control for all operations
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-surface-border bg-surface-raised/50 overflow-y-auto">
          <nav className="flex flex-col gap-0.5 p-3">
            <Link
              href="/apps/command-center"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-accent hover:bg-surface-raised transition-all"
            >
              ⚡ <span>Hub</span>
            </Link>
            <div className="my-2 border-t border-surface-border" />
            {MODULES.map((mod) => (
              <Link
                key={mod.slug}
                href={`/apps/command-center/${mod.slug}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-all"
              >
                <span className="text-base leading-none">{mod.icon}</span>
                <span className="truncate">{mod.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
