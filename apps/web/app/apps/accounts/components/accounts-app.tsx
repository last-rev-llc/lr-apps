"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Card } from "@repo/ui";
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
      className="text-[11px] text-blue hover:text-blue/80 underline-offset-2 hover:underline"
      title={label ?? url}
    >
      ↗
    </a>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────

type BadgeColor =
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "blue"
  | "gray"
  | "cyan";

const BADGE_STYLES: Record<BadgeColor, string> = {
  green: "bg-green/12 text-green border-green/20",
  amber: "bg-accent/12 text-accent border-accent/20",
  red: "bg-red/12 text-red border-red/20",
  purple: "bg-pill-0/12 text-pill-0 border-pill-0/20",
  blue: "bg-blue/12 text-blue border-blue/20",
  gray: "bg-slate/12 text-muted-foreground border-slate/20",
  cyan: "bg-pill-7/12 text-pill-7 border-pill-7/20",
};

function Badge({
  text,
  color = "gray",
}: {
  text: string;
  color?: BadgeColor;
}) {
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${BADGE_STYLES[color]}`}
    >
      {text}
    </span>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass border-surface-border">
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </Card>
  );
}

// ── Empty ──────────────────────────────────────────────────────────────────

function Empty({ message }: { message: string }) {
  return (
    <p className="text-[13px] text-muted-foreground italic">{message}</p>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-[13px]">
      {children}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ client }: { client: Client }) {
  const urls = client.urls;

  return (
    <div className="space-y-4">
      {/* Company info */}
      <SectionCard title="Company">
        <p className="text-[13px] text-muted-foreground mb-3">
          {client.industry ?? "—"}
        </p>
        {urls && (
          <div className="flex flex-wrap gap-2">
            {urls.website && (
              <a
                href={urls.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-pill-9/40 transition-colors"
              >
                🌐 Website
              </a>
            )}
            {urls.production && urls.production !== urls.website && (
              <a
                href={urls.production}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-pill-9/40 transition-colors"
              >
                🚀 Production
              </a>
            )}
            {urls.staging && (
              <a
                href={urls.staging}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-pill-9/40 transition-colors"
              >
                🧪 Staging
              </a>
            )}
            {urls.github?.map((repo) => (
              <a
                key={repo}
                href={`https://github.com/last-rev-llc/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-pill-9/40 transition-colors"
              >
                🐙 {repo}
              </a>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Highlights & Challenges */}
      <SectionCard title="Weekly Highlights & Challenges">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold text-green uppercase tracking-widest mb-2">
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
              <Empty message="None this week" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-2">
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
              <Empty message="None this week" />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Upcoming Focus */}
      <SectionCard title="Upcoming Focus">
        {client.upcomingFocus?.length ? (
          <ul className="space-y-1">
            {client.upcomingFocus.map((f, i) => (
              <li key={i} className="text-[13px] text-foreground">
                ▸ {f}
              </li>
            ))}
          </ul>
        ) : (
          <Empty message="No priorities set for next week" />
        )}
      </SectionCard>

      {/* Contracts */}
      <SectionCard title="Contracts">
        {client.contracts?.length ? (
          <div className="space-y-2">
            {client.contracts.map((ct, i) => (
              <ContractRow key={i} contract={ct} />
            ))}
          </div>
        ) : (
          <Empty message="No contracts on file" />
        )}
      </SectionCard>
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
      {ct.type && <Badge text={ct.type} color="purple" />}
      {ct.status && (
        <Badge
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
    return <Empty message="No contacts added yet" />;

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
      className={`flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg border text-[13px] ${
        c.isPrimary
          ? "border-pill-9/30 bg-pill-9/5"
          : "border-surface-border"
      }`}
    >
      <span className="font-semibold text-foreground min-w-[120px]">
        {c.name}
      </span>
      {c.isPrimary && <Badge text="Primary" color="cyan" />}
      {c.role && (
        <span className="text-muted-foreground">{c.role}</span>
      )}
      {c.email && (
        <a
          href={`mailto:${c.email}`}
          className="text-blue hover:text-blue/80 text-[12px]"
        >
          {c.email}
        </a>
      )}
      {c.linkedin && (
        <a
          href={c.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue hover:text-blue/80 text-[12px]"
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
          className={`text-3xl font-bold ${prCount > 5 ? "text-accent" : "text-foreground"}`}
        >
          {prCount}
        </span>
        <span className="text-muted-foreground text-sm">open PRs</span>
        {prCount > 10 && <Badge text="Needs attention" color="amber" />}
      </div>

      {/* Repo links */}
      {gh?.repos?.length ? (
        <div className="flex flex-wrap gap-2">
          {gh.repos.map((repo) => (
            <a
              key={repo}
              href={`https://github.com/last-rev-llc/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-pill-9/40 transition-colors"
            >
              🐙 {repo}
            </a>
          ))}
        </div>
      ) : null}

      {/* PR list */}
      {gh?.prs?.length ? (
        <SectionCard title="Open Pull Requests">
          <div className="space-y-0">
            {gh.prs.map((pr) => (
              <PRRow key={`${pr.repo}-${pr.number}`} pr={pr} />
            ))}
          </div>
        </SectionCard>
      ) : (
        !gh?.repos?.length && <Empty message="No repos linked" />
      )}
    </div>
  );
}

function PRRow({ pr }: { pr: GithubPR }) {
  const url = `https://github.com/last-rev-llc/${encodeURIComponent(pr.repo)}/pull/${pr.number}`;
  return (
    <Row>
      <span className="text-blue font-bold min-w-[44px]">
        #{pr.number}
      </span>
      <span className="flex-1 text-foreground">{pr.title}</span>
      <span className="text-muted-foreground text-[12px] min-w-[80px]">
        {pr.authorName ?? pr.author}
      </span>
      {extLink(url, "View PR")}
    </Row>
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
      <SectionCard title="Upcoming Meetings (2 weeks)">
        {meetings.length ? (
          <div className="space-y-3">
            {meetings.map((m, i) => (
              <MeetingRow key={i} meeting={m} />
            ))}
          </div>
        ) : (
          <Empty message="No upcoming meetings scheduled" />
        )}
      </SectionCard>
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
    <SectionCard title="Daily Standup">
      {hasData ? (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold text-pill-0 uppercase tracking-widest mb-2">
              Yesterday
            </div>
            {standup!.yesterday?.length ? (
              standup!.yesterday.map((s, i) => (
                <StandupRow key={i} item={s} />
              ))
            ) : (
              <Empty message="Nothing logged" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue uppercase tracking-widest mb-2">
              Today
            </div>
            {standup!.today?.length ? (
              standup!.today.map((s, i) => (
                <StandupRow key={i} item={s} />
              ))
            ) : (
              <Empty message="Nothing planned" />
            )}
          </div>
        </div>
      ) : (
        <Empty message="No standup data" />
      )}
    </SectionCard>
  );
}

function StandupRow({ item: s }: { item: StandupItem }) {
  return (
    <Row>
      <span
        className="font-semibold text-pill-9 min-w-[100px] text-[12px] shrink-0"
      >
        {s.user}
      </span>
      <span className="flex-1 text-foreground">{s.item}</span>
      {s.ticket && <Badge text={s.ticket} color="purple" />}
      {extLink(s.ticketUrl, s.ticket ?? undefined)}
      {extLink(s.prUrl, "PR")}
    </Row>
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
      <SectionCard title="Jira">
        <Empty message="No Jira integration configured" />
      </SectionCard>
    );

  return (
    <SectionCard title="Jira">
      {jira.status === "pending-reauth" ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/8 border border-accent/20">
          <span className="text-accent text-sm">⚠️</span>
          <span className="text-[13px] text-accent">
            Jira integration pending re-auth
          </span>
        </div>
      ) : (
        <div className="flex gap-6">
          <div>
            <span className="text-2xl font-bold text-foreground">
              {jira.openTickets ?? 0}
            </span>
            <span className="text-muted-foreground text-xs ml-1">open</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-accent">
              {jira.staleTickets ?? 0}
            </span>
            <span className="text-muted-foreground text-xs ml-1">stale</span>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function NetlifySection({ client }: { client: Client }) {
  const sites = client.netlify ?? [];
  return (
    <SectionCard title="Netlify Status">
      {sites.length ? (
        <div className="space-y-0">
          {sites.map((n, i) => (
            <NetlifyRow key={i} site={n} />
          ))}
        </div>
      ) : (
        <Empty message="No Netlify sites configured" />
      )}
    </SectionCard>
  );
}

function NetlifyRow({ site: n }: { site: NetlifySite }) {
  const statusColor: Record<string, BadgeColor> = {
    success: "green",
    failed: "red",
    pending: "amber",
  };
  return (
    <Row>
      <span className="font-semibold flex-1 text-foreground">{n.site}</span>
      {n.status && (
        <Badge
          text={n.status}
          color={statusColor[n.status] ?? "gray"}
        />
      )}
      <span className="text-muted-foreground text-[12px]">
        {n.lastDeploy ?? "—"}
      </span>
    </Row>
  );
}

function ContentfulSection({ client }: { client: Client }) {
  const spaces = client.contentfulSpaces ?? [];
  return (
    <SectionCard title="Contentful">
      {spaces.length ? (
        <div className="space-y-3">
          {spaces.map((sp, i) => (
            <ContentfulSpaceRow key={i} space={sp} />
          ))}
        </div>
      ) : (
        <Empty message="No Contentful spaces linked" />
      )}
    </SectionCard>
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
            <Badge key={i} text={e} color="gray" />
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
      <div className="text-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">👥</div>
        <p>No clients found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Client selector */}
      <div className="flex items-center gap-3 mb-6 p-4 glass border border-surface-border rounded-xl">
        <label
          htmlFor="accounts-client-select"
          className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest shrink-0"
        >
          Client
        </label>
        <select
          id="accounts-client-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pill-9/60"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedClient?.industry && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-pill-9/12 text-pill-9 border-pill-9/20 shrink-0">
            {selectedClient.industry}
          </span>
        )}
      </div>

      {/* Client health indicator */}
      {selectedClient?.health && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Health:</span>
          <Badge
            text={selectedClient.health}
            color={
              selectedClient.health === "good"
                ? "green"
                : selectedClient.health === "at-risk"
                  ? "amber"
                  : "red"
            }
          />
        </div>
      )}

      {/* Per-client tabbed dashboard */}
      {selectedClient ? (
        <ClientDashboard key={selectedClient.id} client={selectedClient} />
      ) : (
        <Empty message="Select a client above" />
      )}
    </div>
  );
}
