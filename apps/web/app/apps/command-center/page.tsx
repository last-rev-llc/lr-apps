import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Badge, PageHeader, StatCard } from "@repo/ui";

export const dynamic = "force-dynamic";

const MODULES = [
  {
    slug: "leads",
    label: "Leads",
    icon: "🎯",
    description: "Lead research and company fit scores",
    category: "Sales",
  },
  {
    slug: "agents",
    label: "Agents",
    icon: "🤖",
    description: "AI agent management and monitoring",
    category: "AI",
  },
  {
    slug: "ideas",
    label: "Ideas",
    icon: "💡",
    description: "Capture and track product ideas",
    category: "Product",
  },
  {
    slug: "recipes",
    label: "Recipes",
    icon: "📋",
    description: "Automation recipes and workflows",
    category: "Ops",
  },
  {
    slug: "users",
    label: "Users",
    icon: "👥",
    description: "User management and access control",
    category: "Admin",
  },
  {
    slug: "crons",
    label: "Crons",
    icon: "⏰",
    description: "Scheduled jobs and cron monitoring",
    category: "Ops",
  },
  {
    slug: "gallery",
    label: "Gallery",
    icon: "🖼️",
    description: "Asset gallery and media management",
    category: "Content",
  },
  {
    slug: "architecture",
    label: "Architecture",
    icon: "🏗️",
    description: "System architecture diagrams and docs",
    category: "Dev",
  },
  {
    slug: "client-health",
    label: "Client Health",
    icon: "💚",
    description: "Client site health and uptime status",
    category: "Ops",
  },
  {
    slug: "concerts",
    label: "Concerts",
    icon: "🎵",
    description: "Concert and event tracking",
    category: "Personal",
  },
  {
    slug: "contentful",
    label: "Contentful",
    icon: "📦",
    description: "Contentful space browser and tools",
    category: "Dev",
  },
  {
    slug: "iron",
    label: "Iron",
    icon: "🔩",
    description: "Infrastructure and tooling management",
    category: "Dev",
  },
  {
    slug: "meeting-summaries",
    label: "Meeting Summaries",
    icon: "📝",
    description: "AI-generated meeting notes and action items",
    category: "Ops",
  },
  {
    slug: "meme-generator",
    label: "Meme Generator",
    icon: "😂",
    description: "Generate memes for fun and profit",
    category: "Fun",
  },
  {
    slug: "pr-review",
    label: "PR Review",
    icon: "🔍",
    description: "Pull request review queue and insights",
    category: "Dev",
  },
  {
    slug: "rizz-guide",
    label: "Rizz Guide",
    icon: "✨",
    description: "AI-powered communication coaching",
    category: "Fun",
  },
  {
    slug: "shopping-list",
    label: "Shopping List",
    icon: "🛒",
    description: "Shared shopping and procurement lists",
    category: "Personal",
  },
  {
    slug: "team-usf",
    label: "Team USF",
    icon: "🏫",
    description: "USF team management and tracking",
    category: "Admin",
  },
  {
    slug: "ai-scripts",
    label: "AI Scripts",
    icon: "🤖",
    description: "Manage and run AI automation scripts",
    category: "AI",
  },
  {
    slug: "app-access",
    label: "App Access",
    icon: "🔐",
    description: "Manage app access and permissions",
    category: "Admin",
  },
  {
    slug: "alphaclaw",
    label: "AlphaClaw",
    icon: "🦅",
    description: "AlphaClaw platform management",
    category: "Admin",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Sales: "bg-green-500/10 text-green-400 border-green-500/20",
  AI: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Product: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Ops: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Admin: "bg-red-500/10 text-red-400 border-red-500/20",
  Dev: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Content: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Personal: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Fun: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function CommandCenterPage() {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <PageHeader
        title="⚡ Command Center"
        subtitle={`Mission control for all operations \u2014 last updated ${now}`}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard value={MODULES.length} label="Modules" size="sm" />
        <StatCard value="21" label="Routes" size="sm" />
        <StatCard value="7" label="Categories" size="sm" />
        <StatCard value="Active" label="Status" size="sm" />
      </div>

      {/* Module grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg text-foreground">All Modules</h2>
        <span className="text-xs text-muted-foreground">{MODULES.length} total</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => {
          const categoryClass =
            CATEGORY_COLORS[mod.category] ??
            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

          return (
            <Link
              key={mod.slug}
              href={`/apps/command-center/${mod.slug}`}
              className="group block"
            >
              <Card className="h-full glass border-surface-border hover:border-accent/40 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-accent/5">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{mod.icon}</span>
                      <CardTitle className="text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                        {mod.label}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] rounded-full ${categoryClass}`}>
                      {mod.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {mod.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
