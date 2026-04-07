"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui";
import type { Contact, ContactInsights } from "../lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CONFIDENCE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  high: {
    text: "#4ade80",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.4)",
  },
  medium: {
    text: "#facc15",
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.4)",
  },
  low: {
    text: "#f87171",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.4)",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function InsightSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">{label}</h4>
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-xs text-white/70">
      {children}
    </span>
  );
}

function InsightsPanel({ insights }: { insights: ContactInsights }) {
  const conf = insights.confidence?.toLowerCase() ?? "";
  const confStyle = CONFIDENCE_COLORS[conf] ?? {
    text: "rgba(255,255,255,0.4)",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.15)",
  };
  const comm = insights.communicationStyle ?? {};
  const pers = insights.personality ?? {};
  const interests = insights.interests ?? {};
  const starters = insights.conversationStarters ?? [];

  return (
    <div className="space-y-5">
      {/* Confidence badge */}
      {insights.confidence && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Confidence:</span>
          <span
            className="rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize"
            style={{
              color: confStyle.text,
              background: confStyle.bg,
              borderColor: confStyle.border,
            }}
          >
            {insights.confidence}
          </span>
        </div>
      )}

      {/* Summary */}
      {insights.summary && (
        <InsightSection label="Summary">
          <p className="text-sm text-white/60 leading-relaxed">{insights.summary}</p>
        </InsightSection>
      )}

      {/* Best approach */}
      {insights.bestApproach && (
        <InsightSection label="Best Approach">
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2">
            <p className="text-sm text-amber-300/90">{insights.bestApproach}</p>
          </div>
        </InsightSection>
      )}

      {/* Communication style */}
      {(comm.formality || comm.tone || comm.responseSpeed || comm.preferredChannel) && (
        <InsightSection label="Communication Style">
          <div className="flex flex-wrap gap-1.5">
            {comm.formality && <Pill>🎩 {comm.formality}</Pill>}
            {comm.tone && <Pill>🗣️ {comm.tone}</Pill>}
            {comm.responseSpeed && <Pill>⚡ {comm.responseSpeed}</Pill>}
            {comm.preferredChannel && <Pill>📡 {comm.preferredChannel}</Pill>}
          </div>
        </InsightSection>
      )}

      {/* Personality */}
      {(pers.decisionStyle || pers.detailOrientation || pers.conflictStyle ||
        (pers.motivators?.length ?? 0) > 0 || (pers.stressors?.length ?? 0) > 0) && (
        <InsightSection label="Personality">
          {(pers.decisionStyle || pers.detailOrientation || pers.conflictStyle) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {pers.decisionStyle && <Pill>🧭 {pers.decisionStyle}</Pill>}
              {pers.detailOrientation && <Pill>🔍 {pers.detailOrientation}</Pill>}
              {pers.conflictStyle && <Pill>⚖️ {pers.conflictStyle}</Pill>}
            </div>
          )}
          {((pers.motivators?.length ?? 0) > 0 || (pers.stressors?.length ?? 0) > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {(pers.motivators?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400/70 mb-1">
                    Motivators
                  </p>
                  <ul className="space-y-0.5">
                    {pers.motivators!.map((m, i) => (
                      <li key={i} className="text-xs text-white/50 flex items-start gap-1">
                        <span className="text-green-400 mt-0.5">✓</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(pers.stressors?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70 mb-1">
                    Stressors
                  </p>
                  <ul className="space-y-0.5">
                    {pers.stressors!.map((s, i) => (
                      <li key={i} className="text-xs text-white/50 flex items-start gap-1">
                        <span className="text-red-400 mt-0.5">!</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </InsightSection>
      )}

      {/* Interests */}
      {((interests.professional?.length ?? 0) > 0 ||
        (interests.personal?.length ?? 0) > 0 ||
        (interests.sharedWithAdam?.length ?? 0) > 0) && (
        <InsightSection label="Interests & Topics">
          <div className="space-y-2">
            {(interests.professional?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-white/30 mb-1">💼 Professional</p>
                <div className="flex flex-wrap gap-1">
                  {interests.professional!.map((t, i) => (
                    <span key={i} className="rounded px-1.5 py-0.5 text-[10px] bg-blue-500/12 text-blue-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(interests.personal?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-white/30 mb-1">🎮 Personal</p>
                <div className="flex flex-wrap gap-1">
                  {interests.personal!.map((t, i) => (
                    <span key={i} className="rounded px-1.5 py-0.5 text-[10px] bg-purple-500/12 text-purple-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(interests.sharedWithAdam?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-white/30 mb-1">🤝 Shared</p>
                <div className="flex flex-wrap gap-1">
                  {interests.sharedWithAdam!.map((t, i) => (
                    <span key={i} className="rounded px-1.5 py-0.5 text-[10px] bg-green-500/12 text-green-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InsightSection>
      )}

      {/* Conversation starters */}
      {starters.length > 0 && (
        <InsightSection label="Conversation Starters">
          <ul className="space-y-1.5">
            {starters.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white/65"
              >
                <span className="text-amber-400 shrink-0 mt-0.5">💬</span>
                {s}
              </li>
            ))}
          </ul>
        </InsightSection>
      )}

      {/* Topics to avoid */}
      {(insights.topicsToAvoid?.length ?? 0) > 0 && (
        <InsightSection label="Topics to Avoid">
          <div className="flex flex-wrap gap-1.5">
            {insights.topicsToAvoid!.map((t, i) => (
              <span key={i} className="rounded-full border border-red-500/25 bg-red-500/8 px-2 py-0.5 text-[11px] text-red-400">
                🚫 {t}
              </span>
            ))}
          </div>
        </InsightSection>
      )}
    </div>
  );
}

// ── Contact Detail ────────────────────────────────────────────────────────────

interface ContactDetailProps {
  contact: Contact | null;
  onClose: () => void;
}

export function ContactDetail({ contact, onClose }: ContactDetailProps) {
  const open = contact !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-white/15 bg-zinc-950/95 backdrop-blur-xl sm:rounded-2xl">
        {contact && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-6">
                <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white/15">
                  {contact.avatar ? (
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                  ) : null}
                  <AvatarFallback className="bg-amber-500/20 text-amber-300 font-semibold">
                    {initials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-bold text-white">
                    {contact.name}
                  </DialogTitle>
                  {(contact.title || contact.company) && (
                    <p className="text-sm text-white/50 mt-0.5">
                      {[contact.title, contact.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {contact.type && (
                    <div className="mt-1.5">
                      <ContactTypeBadge type={contact.type} />
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Contact info grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {contact.email && (
                  <DetailRow icon="✉️" label="Email">
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-amber-400 hover:text-amber-300 transition-colors break-all"
                    >
                      {contact.email}
                    </a>
                  </DetailRow>
                )}
                {contact.phone && (
                  <DetailRow icon="📞" label="Phone">
                    <span className="text-white/70">{contact.phone}</span>
                  </DetailRow>
                )}
                {contact.location && (
                  <DetailRow icon="📍" label="Location">
                    <span className="text-white/70">{contact.location}</span>
                  </DetailRow>
                )}
                {contact.timezone && (
                  <DetailRow icon="🕐" label="Timezone">
                    <span className="text-white/70">{contact.timezone}</span>
                  </DetailRow>
                )}
              </div>

              {/* Social links */}
              {(contact.linkedin_url || contact.github_handle || contact.twitter_handle ||
                contact.slack_handle || contact.website) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                    Social & Links
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {contact.linkedin_url && (
                      <SocialLink
                        href={contact.linkedin_url}
                        label="LinkedIn"
                        color="text-[#0a66c2]"
                        bg="bg-[#0a66c2]/12 border-[#0a66c2]/30"
                      >
                        in
                      </SocialLink>
                    )}
                    {contact.github_handle && (
                      <SocialLink
                        href={`https://github.com/${contact.github_handle}`}
                        label={`@${contact.github_handle}`}
                        color="text-white/70"
                        bg="bg-white/8 border-white/15"
                      >
                        <GithubIcon /> @{contact.github_handle}
                      </SocialLink>
                    )}
                    {contact.twitter_handle && (
                      <SocialLink
                        href={`https://twitter.com/${contact.twitter_handle}`}
                        label={`@${contact.twitter_handle}`}
                        color="text-sky-400"
                        bg="bg-sky-500/10 border-sky-500/25"
                      >
                        𝕏 @{contact.twitter_handle}
                      </SocialLink>
                    )}
                    {contact.slack_handle && (
                      <SocialLink
                        href={
                          contact.slack_id
                            ? `https://lastrev.slack.com/team/${contact.slack_id}`
                            : "#"
                        }
                        label={`@${contact.slack_handle}`}
                        color="text-[#4a154b]"
                        bg="bg-[#e01e5a]/10 border-[#e01e5a]/25"
                      >
                        <SlackIcon /> @{contact.slack_handle}
                      </SocialLink>
                    )}
                    {contact.website && (
                      <SocialLink
                        href={contact.website}
                        label="Website"
                        color="text-white/60"
                        bg="bg-white/6 border-white/12"
                      >
                        🌐 {contact.website.replace(/^https?:\/\//, "")}
                      </SocialLink>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {(contact.tags?.length ?? 0) > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags!.map((tag, i) => (
                      <Badge
                        key={i}
                        className="border-white/15 bg-white/8 text-white/60 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {contact.insights && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
                    Personality Insights
                  </h4>
                  <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <InsightsPanel insights={contact.insights} />
                  </div>
                </div>
              )}

              {/* Notes */}
              {contact.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                    Notes
                  </h4>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                    {contact.notes}
                  </p>
                </div>
              )}

              {/* Footer meta */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-white/8 text-[11px] text-white/25">
                {contact.last_researched_at && (
                  <span>Last researched {relDate(contact.last_researched_at)}</span>
                )}
                {contact.source && <span>· Source: {contact.source}</span>}
                {contact.created_at && <span>· Added {relDate(contact.created_at)}</span>}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Micro-components ──────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{label}</p>
        <div className="text-sm mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  color,
  bg,
  children,
}: {
  href: string;
  label: string;
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${color} ${bg}`}
    >
      {children}
    </a>
  );
}

export function ContactTypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    team: {
      bg: "rgba(124,58,237,0.15)",
      text: "#a78bfa",
      border: "rgba(124,58,237,0.4)",
    },
    client: {
      bg: "rgba(34,197,94,0.12)",
      text: "#4ade80",
      border: "rgba(34,197,94,0.35)",
    },
    prospect: {
      bg: "rgba(234,179,8,0.12)",
      text: "#facc15",
      border: "rgba(234,179,8,0.35)",
    },
    partner: {
      bg: "rgba(14,165,233,0.12)",
      text: "#38bdf8",
      border: "rgba(14,165,233,0.35)",
    },
    vendor: {
      bg: "rgba(249,115,22,0.12)",
      text: "#fb923c",
      border: "rgba(249,115,22,0.35)",
    },
    contractor: {
      bg: "rgba(236,72,153,0.12)",
      text: "#f472b6",
      border: "rgba(236,72,153,0.35)",
    },
    personal: {
      bg: "rgba(20,184,166,0.12)",
      text: "#2dd4bf",
      border: "rgba(20,184,166,0.35)",
    },
  };
  const s = styles[type] ?? {
    bg: "rgba(113,113,122,0.15)",
    text: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.15)",
  };

  const labels: Record<string, string> = {
    team: "Team",
    client: "Client",
    prospect: "Prospect",
    partner: "Partner",
    vendor: "Vendor",
    contractor: "Contractor",
    personal: "Personal",
    other: "Other",
  };

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {labels[type] ?? type}
    </span>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function GithubIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="shrink-0"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="shrink-0"
    >
      <path d="M5.04 15.33a2.51 2.51 0 0 1-2.52 2.52 2.51 2.51 0 0 1-2.52-2.52 2.51 2.51 0 0 1 2.52-2.52h2.52v2.52zm1.26 0a2.51 2.51 0 0 1 2.52-2.52 2.51 2.51 0 0 1 2.52 2.52v6.3a2.51 2.51 0 0 1-2.52 2.52 2.51 2.51 0 0 1-2.52-2.52v-6.3zm2.52-10.29a2.51 2.51 0 0 1-2.52-2.52A2.51 2.51 0 0 1 8.82 0a2.51 2.51 0 0 1 2.52 2.52v2.52H8.82zm0 1.26a2.51 2.51 0 0 1 2.52 2.52 2.51 2.51 0 0 1-2.52 2.52H2.52A2.51 2.51 0 0 1 0 8.82a2.51 2.51 0 0 1 2.52-2.52h6.3zm10.29 2.52a2.51 2.51 0 0 1 2.52-2.52A2.51 2.51 0 0 1 24 8.82a2.51 2.51 0 0 1-2.52 2.52h-2.52V8.82zm-1.26 0a2.51 2.51 0 0 1-2.52 2.52 2.51 2.51 0 0 1-2.52-2.52V2.52A2.51 2.51 0 0 1 15.33 0a2.51 2.51 0 0 1 2.52 2.52v6.3zm-2.52 10.29a2.51 2.51 0 0 1 2.52 2.52A2.51 2.51 0 0 1 15.33 24a2.51 2.51 0 0 1-2.52-2.52v-2.52h2.52zm0-1.26a2.51 2.51 0 0 1-2.52-2.52 2.51 2.51 0 0 1 2.52-2.52h6.3A2.51 2.51 0 0 1 24 15.33a2.51 2.51 0 0 1-2.52 2.52h-6.3z" />
    </svg>
  );
}
