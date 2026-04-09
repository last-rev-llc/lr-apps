"use client";

import { Card, CardContent, PageHeader, StatCard } from "@repo/ui";

interface QuickLink {
  label: string;
  url: string;
  description: string;
  icon: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: "AlphaClaw Admin", url: "https://admin.alphaclaw.com", description: "Platform admin dashboard", icon: "🦅" },
  { label: "Analytics", url: "https://analytics.alphaclaw.com", description: "Usage metrics and reporting", icon: "📊" },
  { label: "Feature Flags", url: "https://flags.alphaclaw.com", description: "Manage feature rollouts", icon: "🚩" },
  { label: "Deployments", url: "https://vercel.com", description: "Vercel deployment status", icon: "🚀" },
  { label: "Error Tracking", url: "https://sentry.io", description: "Sentry error monitoring", icon: "🐛" },
  { label: "Documentation", url: "https://docs.alphaclaw.com", description: "Platform documentation", icon: "📖" },
];

interface StatusItem {
  service: string;
  status: "operational" | "degraded" | "down";
  latency?: string;
}

const SERVICES: StatusItem[] = [
  { service: "API Gateway", status: "operational", latency: "42ms" },
  { service: "Auth Service", status: "operational", latency: "18ms" },
  { service: "Content Pipeline", status: "operational", latency: "120ms" },
  { service: "Search Index", status: "operational", latency: "35ms" },
  { service: "Media CDN", status: "operational", latency: "8ms" },
  { service: "Webhooks", status: "operational", latency: "—" },
];

const STATUS_STYLE: Record<string, { color: string; dot: string; label: string }> = {
  operational: { color: "#4ade80", dot: "#4ade80", label: "Operational" },
  degraded:    { color: "#fbbf24", dot: "#f59e0b", label: "Degraded" },
  down:        { color: "#f87171", dot: "#ef4444", label: "Down" },
};

interface AlphaclawAppProps {}

export function AlphaclawApp({}: AlphaclawAppProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="🦅 AlphaClaw"
        subtitle="Platform admin — overview, links, and service status"
      />

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Platform", value: "v2.4.1" },
          { label: "Uptime", value: "99.97%" },
          { label: "Active Users", value: "—" },
        ].map((stat) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} size="sm" />
        ))}
      </div>

      {/* Service Status */}
      <Card className="p-4">
        <CardContent className="p-0">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>🟢</span> Service Status
          </h3>
          <div className="space-y-2">
            {SERVICES.map((svc) => {
              const s = STATUS_STYLE[svc.status];
              return (
                <div key={svc.service} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: s.dot }}
                  />
                  <span className="flex-1 text-sm text-white">{svc.service}</span>
                  {svc.latency && svc.latency !== "—" && (
                    <span className="text-xs text-white/30 font-mono">{svc.latency}</span>
                  )}
                  <span className="text-xs" style={{ color: s.color }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h3 className="font-semibold text-white mb-3">Quick Links</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="p-3 hover:border-white/30 transition-all cursor-pointer">
                <CardContent className="p-0 flex items-center gap-3">
                  <span className="text-xl shrink-0">{link.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white flex items-center gap-1">
                      {link.label}
                      <span className="text-white/30 text-xs">↗</span>
                    </div>
                    <div className="text-xs text-white/40">{link.description}</div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
