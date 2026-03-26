"use client";

import { Card, CardContent, PageHeader } from "@repo/ui";

interface DeployProject {
  name: string;
  url: string;
  status: "ready" | "building" | "error" | "unknown";
  lastDeploy?: string;
  branch?: string;
  framework?: string;
}

interface InfraService {
  name: string;
  type: string;
  status: "up" | "degraded" | "down";
  region?: string;
  notes?: string;
}

const DEPLOY_PROJECTS: DeployProject[] = [
  { name: "lr-apps (web)", url: "https://vercel.com", status: "ready", lastDeploy: "2026-03-25", branch: "main", framework: "Next.js" },
  { name: "lr-apps (api)", url: "https://vercel.com", status: "ready", lastDeploy: "2026-03-25", branch: "main", framework: "Next.js" },
  { name: "achieveAI web", url: "https://vercel.com", status: "ready", lastDeploy: "2026-03-24", branch: "main", framework: "Next.js" },
];

const INFRA_SERVICES: InfraService[] = [
  { name: "Supabase (Production)", type: "Database", status: "up", region: "us-east-1" },
  { name: "Supabase (Staging)", type: "Database", status: "up", region: "us-east-1" },
  { name: "Vercel Edge Network", type: "CDN", status: "up", region: "Global" },
  { name: "GitHub Actions", type: "CI", status: "up" },
  { name: "Contentful API", type: "CMS", status: "up", region: "us-east-1" },
];

const QUICK_ACTIONS = [
  { label: "Vercel Dashboard", url: "https://vercel.com/last-rev", icon: "🚀" },
  { label: "Supabase Console", url: "https://app.supabase.com", icon: "🗄️" },
  { label: "GitHub Repos", url: "https://github.com/last-rev", icon: "🐙" },
  { label: "Sentry Errors", url: "https://sentry.io", icon: "🐛" },
  { label: "Uptime Monitor", url: "/apps/uptime", icon: "📡" },
  { label: "Cron Jobs", url: "/apps/command-center/crons", icon: "⏰" },
];

const STATUS_STYLE = {
  deploy: {
    ready:    { color: "#4ade80", label: "Ready" },
    building: { color: "#fbbf24", label: "Building" },
    error:    { color: "#f87171", label: "Error" },
    unknown:  { color: "#94a3b8", label: "Unknown" },
  },
  infra: {
    up:       { color: "#4ade80", dot: "#4ade80", label: "Up" },
    degraded: { color: "#fbbf24", dot: "#f59e0b", label: "Degraded" },
    down:     { color: "#f87171", dot: "#ef4444", label: "Down" },
  },
};

interface IronAppProps {}

export function IronApp({}: IronAppProps) {
  const allUp = INFRA_SERVICES.every((s) => s.status === "up");

  return (
    <div className="space-y-6">
      <PageHeader
        title="🔩 Iron"
        subtitle="Infrastructure overview, deploy status, and quick actions"
      />

      {/* Overall health banner */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: allUp ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${allUp ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}
      >
        <span className="text-2xl">{allUp ? "✅" : "⚠️"}</span>
        <div>
          <div className="font-semibold text-white">
            {allUp ? "All systems operational" : "Some systems degraded"}
          </div>
          <div className="text-xs text-white/50">
            {INFRA_SERVICES.filter((s) => s.status === "up").length}/{INFRA_SERVICES.length} services up
          </div>
        </div>
      </div>

      {/* Deploy status */}
      <Card className="p-4">
        <CardContent className="p-0">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>🚀</span> Latest Deployments
          </h3>
          <div className="space-y-3">
            {DEPLOY_PROJECTS.map((proj) => {
              const s = STATUS_STYLE.deploy[proj.status];
              return (
                <div key={proj.name} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{proj.name}</span>
                      {proj.framework && (
                        <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{proj.framework}</span>
                      )}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5">
                      {proj.branch && <span>branch: {proj.branch}</span>}
                      {proj.lastDeploy && <span className="ml-2">· {proj.lastDeploy}</span>}
                    </div>
                  </div>
                  <a
                    href={proj.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold"
                    style={{ color: s.color }}
                  >
                    {s.label} ↗
                  </a>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Infra services */}
      <Card className="p-4">
        <CardContent className="p-0">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>🔧</span> Infrastructure Services
          </h3>
          <div className="space-y-2">
            {INFRA_SERVICES.map((svc) => {
              const s = STATUS_STYLE.infra[svc.status];
              return (
                <div key={svc.name} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{svc.name}</span>
                    <span className="ml-2 text-xs text-white/30">{svc.type}</span>
                    {svc.region && <span className="ml-2 text-xs text-white/20">{svc.region}</span>}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div>
        <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const isExternal = action.url.startsWith("http");
            const Tag = isExternal ? "a" : "a";
            return (
              <Tag
                key={action.label}
                href={action.url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                <Card className="p-3 hover:border-white/30 transition-all cursor-pointer">
                  <CardContent className="p-0 flex items-center gap-2">
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-sm text-white">{action.label}</span>
                    {isExternal && <span className="text-white/20 text-xs ml-auto">↗</span>}
                  </CardContent>
                </Card>
              </Tag>
            );
          })}
        </div>
      </div>
    </div>
  );
}
