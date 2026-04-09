import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import Link from "next/link";
import type { ReactNode } from "react";
import { Topbar, Sidebar } from "@repo/ui";
import type { SidebarItem } from "@repo/ui";

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
];

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Hub", href: "/apps/command-center", icon: "⚡" },
  ...MODULES.map((mod) => ({
    label: mod.label,
    href: `/apps/command-center/${mod.slug}`,
    icon: mod.icon,
  })),
];

export default async function CommandCenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("command-center");

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar title="⚡ Command Center" className="sticky top-0 z-50">
        <span className="text-muted-foreground text-xs hidden sm:block">
          Mission control for all operations
        </span>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-accent transition-colors ml-auto"
        >
          ← Dashboard
        </Link>
      </Topbar>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={SIDEBAR_ITEMS} className="hidden md:flex" />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
