"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatusBadge,
  EmptyState,
  cn,
} from "@repo/ui";
import type {
  Client,
  Contact,
  GithubPR,
  NetlifySite,
  Contract,
  StandupItem,
  Meeting,
  ContentfulSpace,
} from "../lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function extLink(url?: string | null, label?: string) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[11px] text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline"
      title={label ?? url}
    >
      ↗
    </a>
  );
}

// ── Badge color mapping ───────────────────────────────────────────────────

type BadgeColor =
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "blue"
  | "gray"
  | "cyan";

const STATUS_VARIANT_MAP: Record<
  BadgeColor,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  green: "success",
  amber: "warning",
  red: "error",
  blue: "info",
  gray: "neutral",
  purple: "neutral",
  cyan: "neutral",
};

const BADGE_CLASS_OVERRIDES: Partial<Record<BadgeColor, string>> = {
  purple:
    "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

function ColorBadge({ text, color = "gray" }: { text: string; color?: BadgeColor }) {
  return (
    <StatusBadge
      variant={STATUS_VARIANT_MAP[color]}
      className={BADGE_CLASS_OVERRIDES[color]}
    >
      {text}
    </StatusBadge>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ client }: { client: Client }) {
  const urls = client.urls;

  return (
    <div className="space-y-4">
      {/* Company info */}
      <Card className="glass border-surface-border">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Company</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <p className="text-[13px] text-muted-foreground mb-3">
            {client.industry ?? "—"}
          </p>
          {urls && (
            <div className="flex flex-wrap gap-2">
              {urls.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={urls.website} target="_blank" rel="noopener noreferrer">
                    🌐 Website
                  </a>
                </Button>
              )}
              {urls.production && urls.production !== urls.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={urls.production} target="_blank" rel="noopener noreferrer">
                    🚀 Production
                  </a>
                </Button>
              )}
              {urls.staging && (
                <Button variant="outline" size="sm" asChild>
                  <a href={urls.staging} target="_blank" rel="noopener noreferrer">
                    🧪 Staging
                  </a>
                </Button>
              )}
              {urls.github?.map((repo) => (
                <Button key={repo} variant="outline" size="sm" asChild>
                  <a
                    href={`https://github.com/last-rev-llc/${repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🐙 {repo}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlights & Challenges */}
      <Card className="glass border-surface-border">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Weekly Highlights & Challenges</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold text-green-400 uppercase tracking-widest mb-2">
                Highlights
              </div>
              {client.highlights?.length ? (
                <ul className="space-y-1">
                  {client.highlights.map((h, i) => (
                    <li key={i} className="text-[13px] text-foreground">
                      ✅ {h}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="None this week" className="py-2" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                Challenges
              </div>
              {client.challenges?.length ? (
                <ul className="space-y-1">
                  {client.challenges.map((c, i) => (
                    <li key={i} className="text-[13px] text-foreground">
                      ⚠️ {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="None this week" className="py-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Focus */}
      <Card className="glass border-surface-border">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Upcoming Focus</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          {client.upcomingFocus?.length ? (
            <ul className="space-y-1">
              {client.upcomingFocus.map((f, i) => (
                <li key={i} className="text-[13px] text-foreground">
                  ▸ {f}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No priorities set for next week" className="py-2" />
          )}
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card className="glass border-surface-border">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Contracts</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          {client.contracts?.length ? (
            <div className="space-y-2">
              {client.contracts.map((ct, i) => (
                <ContractRow key={i} contract={ct} />
              ))}
            </div>
          ) : (
            <EmptyState title="No contracts on file" className="py-2" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContractRow({ contract: ct }: { contract: Contract }) {
  const statusColor: Record<string, BadgeColor> = {
    active: "green",
    "expiring-soon": "amber",
    expired: "red",
  };
  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-[13px]">
      {ct.type && <ColorBadge text={ct.type} color="purple" />}
      {ct.status && (
        <ColorBadge
          text={ct.status}
          color={statusColor[ct.status] ?? "gray"}
        />
      )}
      <span className="text-muted-foreground">
        {ct.startDate ?? "?"} → {ct.endDate ?? "?"}
      </span>
      {ct.monthlyRetainer && (
        <span className="font-semibold text-foreground">
          ${ct.monthlyRetainer.toLocaleString()}/mo
        </span>
      )}
      {ct.hourlyRate && (
        <span className="text-foreground">${ct.hourlyRate}/hr</span>
      )}
    </div>
  );
}

// ── Contacts Tab ───────────────────────────────────────────────────────────

function ContactsTab({ client }: { client: Client }) {
  const contacts = client.contacts ?? [];
  if (!contacts.length)
    return <EmptyState title="No contacts added yet" className="py-4" />;

  return (
    <div className="space-y-2">
      {contacts.map((c, i) => (
        <ContactRow key={i} contact={c} />
      ))}
    </div>
  );
}

function ContactRow({ contact: c }: { contact: Contact }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg border text-[13px]",
        c.isPrimary
          ? "border-teal-500/30 bg-teal-500/5"
          : "border-surface-border",
      )}
    >
      <span className="font-semibold text-foreground min-w-[120px]">
        {c.name}
      </span>
      {c.isPrimary && <ColorBadge text="Primary" color="cyan" />}
      {c.role && (
        <span className="text-muted-foreground">{c.role}</span>
      )}
      {c.email && (
        <a
          href={`mailto:${c.email}`}
          className="text-sky-400 hover:text-sky-300 text-[12px]"
        >
          {c.email}
        </a>
      )}
      {c.linkedin && (
        <a
          href={c.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 text-[12px]"
        >
          LinkedIn ↗
        </a>
      )}
    </div>
  );
}

// ── Repos / GitHub Tab ─────────────────────────────────────────────────────

function ReposTab({ client }: { client: Client }) {
  const gh = client.github;
  const prCount = gh?.openPRs ?? 0;

  return (
    <div className="space-y-4">
      {/* PR count */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-bold",
            prCount > 5 ? "text-amber-400" : "text-foreground",
          )}
        >
          {prCount}
        </span>
        <span className="text-muted-foreground text-sm">open PRs</span>
        {prCount > 10 && <StatusBadge variant="warning">Needs attention</StatusBadge>}
      </div>

      {/* Repo links */}
      {gh?.repos?.length ? (
        <div className="flex flex-wrap gap-2">
          {gh.repos.map((repo) => (
            <Button key={repo} variant="outline" size="sm" asChild>
              <a
                href={`https://github.com/last-rev-llc/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🐙 {repo}
              </a>
            </Button>
          ))}
        </div>
      ) : null}

      {/* PR list */}
      {gh?.prs?.length ? (
        <Card className="glass border-surface-border">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">Open Pull Requests</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="space-y-0">
              {gh.prs.map((pr) => (
                <PRRow key={`${pr.repo}-${pr.number}`} pr={pr} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        !gh?.repos?.length && <EmptyState title="No repos linked" className="py-4" />
      )}
    </div>
  );
}

function PRRow({ pr }: { pr: GithubPR }) {
  const url = `https://github.com/last-rev-llc/${encodeURIComponent(pr.repo)}/pull/${pr.number}`;
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-[13px]">
      <span className="text-sky-400 font-bold min-w-[44px]">
        #{pr.number}
      </span>
      <span className="flex-1 text-foreground">{pr.title}</span>
      <span className="text-muted-foreground text-[12px] min-w-[80px]">
        {pr.authorName ?? pr.author}
      </span>
      {extLink(url, "View PR")}
    </div>
  );
}

// ── Meetings Tab ───────────────────────────────────────────────────────────

function MeetingsTab({ client }: { client: Client }) {
  const meetings = client.upcomingMeetings ?? [];

  return (
    <div className="space-y-4">
      {/* Standup */}
      <StandupSection standup={client.standup} />

      {/* Upcoming meetings */}
      <Card className="glass border-surface-border">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Upcoming Meetings (2 weeks)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          {meetings.length ? (
            <div className="space-y-3">
              {meetings.map((m, i) => (
                <MeetingRow key={i} meeting={m} />
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming meetings scheduled" className="py-2" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StandupSection({
  standup,
}: {
  standup?: Client["standup"] | null;
}) {
  const hasData =
    standup && (standup.yesterday?.length || standup.today?.length);

  return (
    <Card className="glass border-surface-border">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">Daily Standup</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        {hasData ? (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-widest mb-2">
                Yesterday
              </div>
              {standup!.yesterday?.length ? (
                standup!.yesterday.map((s, i) => (
                  <StandupRow key={i} item={s} />
                ))
              ) : (
                <EmptyState title="Nothing logged" className="py-2" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                Today
              </div>
              {standup!.today?.length ? (
                standup!.today.map((s, i) => (
                  <StandupRow key={i} item={s} />
                ))
              ) : (
                <EmptyState title="Nothing planned" className="py-2" />
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="No standup data" className="py-2" />
        )}
      </CardContent>
    </Card>
  );
}

function StandupRow({ item: s }: { item: StandupItem }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-[13px]">
      <span className="font-semibold text-teal-400 min-w-[100px] text-[12px] shrink-0">
        {s.user}
      </span>
      <span className="flex-1 text-foreground">{s.item}</span>
      {s.ticket && <ColorBadge text={s.ticket} color="purple" />}
      {extLink(s.ticketUrl, s.ticket ?? undefined)}
      {extLink(s.prUrl, "PR")}
    </div>
  );
}

function MeetingRow({ meeting: m }: { meeting: Meeting }) {
  const ATTENDEE_STATUS: Record<string, string> = {
    accepted: "✅",
    pending: "⏳",
    declined: "❌",
  };
  return (
    <div className="border-b border-surface-border last:border-0 pb-3 last:pb-0">
      <div className="font-semibold text-[14px] text-foreground">{m.title}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5">
        {fmtDate(m.datetime)}
      </div>
      {m.attendees?.length ? (
        <div className="flex flex-wrap gap-2 mt-1.5">
          {m.attendees.map((a, i) => (
            <span key={i} className="text-[12px]">
              {ATTENDEE_STATUS[a.status ?? "pending"] ?? "⏳"} {a.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── GitHub / Jira Tab ──────────────────────────────────────────────────────

function JiraSection({ client }: { client: Client }) {
  const jira = client.jira;
  if (!jira)
    return (
      <Card className="glass border-surface-border">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Jira</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <EmptyState title="No Jira integration configured" className="py-2" />
        </CardContent>
      </Card>
    );

  return (
    <Card className="glass border-surface-border">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">Jira</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        {jira.status === "pending-reauth" ? (
          <StatusBadge variant="warning" dot>
            Jira integration pending re-auth
          </StatusBadge>
        ) : (
          <div className="flex gap-6">
            <div>
              <span className="text-2xl font-bold text-foreground">
                {jira.openTickets ?? 0}
              </span>
              <span className="text-muted-foreground text-xs ml-1">open</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-amber-400">
                {jira.staleTickets ?? 0}
              </span>
              <span className="text-muted-foreground text-xs ml-1">stale</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NetlifySection({ client }: { client: Client }) {
  const sites = client.netlify ?? [];
  return (
    <Card className="glass border-surface-border">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">Netlify Status</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        {sites.length ? (
          <div className="space-y-0">
            {sites.map((n, i) => (
              <NetlifyRow key={i} site={n} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Netlify sites configured" className="py-2" />
        )}
      </CardContent>
    </Card>
  );
}

function NetlifyRow({ site: n }: { site: NetlifySite }) {
  const statusColor: Record<string, BadgeColor> = {
    success: "green",
    failed: "red",
    pending: "amber",
  };
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-[13px]">
      <span className="font-semibold flex-1 text-foreground">{n.site}</span>
      {n.status && (
        <ColorBadge
          text={n.status}
          color={statusColor[n.status] ?? "gray"}
        />
      )}
      <span className="text-muted-foreground text-[12px]">
        {n.lastDeploy ?? "—"}
      </span>
    </div>
  );
}

function ContentfulSection({ client }: { client: Client }) {
  const spaces = client.contentfulSpaces ?? [];
  return (
    <Card className="glass border-surface-border">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">Contentful</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        {spaces.length ? (
          <div className="space-y-3">
            {spaces.map((sp, i) => (
              <ContentfulSpaceRow key={i} space={sp} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Contentful spaces linked" className="py-2" />
        )}
      </CardContent>
    </Card>
  );
}

function ContentfulSpaceRow({ space: sp }: { space: ContentfulSpace }) {
  return (
    <div>
      {sp.spaceName && (
        <div className="text-[13px] font-semibold text-foreground mb-1.5">
          {sp.spaceName}
        </div>
      )}
      {sp.environments?.length ? (
        <div className="flex flex-wrap gap-1">
          {sp.environments.map((e, i) => (
            <Badge key={i} variant="outline">
              {e}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Integrations Tab ───────────────────────────────────────────────────────

function IntegrationsTab({ client }: { client: Client }) {
  return (
    <div className="space-y-4">
      <JiraSection client={client} />
      <ContentfulSection client={client} />
      <NetlifySection client={client} />
    </div>
  );
}

// ── Client Dashboard ───────────────────────────────────────────────────────

function ClientDashboard({ client }: { client: Client }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="contacts">👤 Contacts</TabsTrigger>
        <TabsTrigger value="repos">🐙 GitHub</TabsTrigger>
        <TabsTrigger value="meetings">📅 Meetings</TabsTrigger>
        <TabsTrigger value="integrations">🔗 Integrations</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab client={client} />
      </TabsContent>
      <TabsContent value="contacts">
        <ContactsTab client={client} />
      </TabsContent>
      <TabsContent value="repos">
        <ReposTab client={client} />
      </TabsContent>
      <TabsContent value="meetings">
        <MeetingsTab client={client} />
      </TabsContent>
      <TabsContent value="integrations">
        <IntegrationsTab client={client} />
      </TabsContent>
    </Tabs>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface AccountsAppProps {
  clients: Client[];
}

export function AccountsApp({ clients }: AccountsAppProps) {
  const [selectedId, setSelectedId] = useState<string>(
    clients[0]?.id ?? ""
  );

  const selectedClient = clients.find((c) => c.id === selectedId) ?? null;

  if (!clients.length) {
    return (
      <EmptyState icon="👥" title="No clients found" />
    );
  }

  return (
    <div>
      {/* Client selector */}
      <div className="flex items-center gap-3 mb-6 p-4 glass border border-surface-border rounded-xl">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
          Client
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-teal-500/60"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedClient?.industry && (
          <StatusBadge
            variant="neutral"
            className="border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0"
          >
            {selectedClient.industry}
          </StatusBadge>
        )}
      </div>

      {/* Client health indicator */}
      {selectedClient?.health && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Health:</span>
          <StatusBadge
            variant={
              selectedClient.health === "good"
                ? "success"
                : selectedClient.health === "at-risk"
                  ? "warning"
                  : "error"
            }
            dot
          >
            {selectedClient.health}
          </StatusBadge>
        </div>
      )}

      {/* Per-client tabbed dashboard */}
      {selectedClient ? (
        <ClientDashboard key={selectedClient.id} client={selectedClient} />
      ) : (
        <EmptyState title="Select a client above" className="py-4" />
      )}
    </div>
  );
}
