"use client";

import { useState } from "react";
import { Button } from "@repo/ui";

interface TimelineEntry {
  year: string;
  title: string;
  detail: string;
  icon: string;
}

interface CareerTeam {
  name: string;
  years: string;
  league: string;
  color: string;
}

interface Education {
  school: string;
  degree: string;
  sport?: string;
  years?: string;
}

interface CareerHighlight {
  title: string;
  detail: string;
}

interface CoachingHighlight {
  player: string;
  achievement: string;
  stats: string;
}

interface InternationalExhibition {
  year: string;
  match: string;
  context: string;
}

interface Article {
  title: string;
  url: string;
  source: string;
  date: string;
}

interface Quote {
  text: string;
  source: string;
}

interface Stats {
  proYears?: number;
  proTeams?: number;
  proApps?: number;
  mlsApps?: number;
  collegeApps?: number;
  collegeStarts?: number;
  collegeShutouts?: number;
  collegeGAA?: string | number;
  miamiGAA?: string | number;
  coachingYears?: number;
  agentYears?: number;
  yearsAtMerrill?: string;
  sportsPlayed?: string;
  ncaaDivision?: string | number;
  degrees?: number;
  certifications?: string;
}

interface Person {
  id: string;
  name: string;
  tagline: string;
  currentRole: string;
  currentOrg: string;
  currentOrgUrl?: string;
  born?: string;
  hometown?: string;
  height?: string;
  position?: string;
  bio: string;
  photos: Record<string, string>;
  theme?: { primary?: string; primaryLight?: string; accent?: string; accentDark?: string };
  timeline?: TimelineEntry[];
  stats?: Stats;
  careerTeams?: CareerTeam[];
  education?: Education[];
  careerHighlights?: CareerHighlight[];
  coachingHighlights?: CoachingHighlight[];
  internationalExhibitions?: InternationalExhibition[];
  articles?: Article[];
  quotes?: Quote[];
  linkedinUrl?: string;
  wikiUrl?: string;
  mlsUrl?: string;
  transfermarktUrl?: string;
}

interface PersonProfileProps {
  person: Person;
}

// Stat label mappings
const PRO_STAT_KEYS: Array<[keyof Stats, string, string]> = [
  ["proYears", "Pro Seasons", ""],
  ["proTeams", "Pro Teams", ""],
  ["proApps", "Pro Appearances", ""],
  ["mlsApps", "MLS Starts", ""],
  ["collegeShutouts", "College Shutouts", ""],
  ["collegeGAA", "College GAA", ""],
  ["miamiGAA", "Miami FC GAA", ""],
  ["coachingYears", "Years Coaching", "+"],
];

const GENERIC_STAT_MAP: Record<string, string> = {
  yearsAtMerrill: "Years at Merrill",
  sportsPlayed: "College Sport",
  ncaaDivision: "NCAA Division",
  degrees: "Degrees Earned",
  certifications: "Certifications",
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 my-12">
      <h2 className="font-heading text-xl font-bold text-white whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 h-px rounded bg-gradient-to-r from-[var(--ss-accent)] to-transparent" />
    </div>
  );
}

function StatCard({
  value,
  label,
  suffix = "",
  accent,
}: {
  value: string | number;
  label: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="glass-sm p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: accent }}>
        {value}
        {suffix}
      </div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  );
}

export function PersonProfile({ person }: PersonProfileProps) {
  const primary = person.theme?.primary ?? "var(--ss-primary)";
  const accent = person.theme?.accent ?? "var(--ss-accent)";
  const headshot = person.photos?.headshot;
  const actionPhoto = person.photos?.action;
  const allPhotos = Object.entries(person.photos ?? {}).filter(([, v]) => v);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Render stats
  const renderStats = () => {
    if (!person.stats) return null;
    const stats = person.stats;
    let entries: Array<{ value: string | number; label: string; suffix: string }> = [];

    if (stats.proYears !== undefined) {
      entries = PRO_STAT_KEYS
        .filter(([k]) => stats[k] !== undefined)
        .map(([k, label, suffix]) => ({
          value: stats[k] as string | number,
          label,
          suffix,
        }));
    } else {
      entries = Object.entries(GENERIC_STAT_MAP)
        .filter(([k]) => stats[k as keyof Stats] !== undefined)
        .map(([k, label]) => ({
          value: stats[k as keyof Stats] as string | number,
          label,
          suffix: "",
        }));
    }

    if (!entries.length) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
        {entries.map((e) => (
          <StatCard key={e.label} value={e.value} label={e.label} suffix={e.suffix} accent={accent} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        // role="dialog" + Escape/click-outside is the standard modal
        // pattern; the rule flags dialog as non-interactive even though
        // these handlers are exactly what an accessible modal needs.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          tabIndex={-1}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxSrc(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLightboxSrc(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Gallery"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close lightbox"
          >
            ✕
          </Button>
        </div>
      )}

      {/* ===== HERO ===== */}
      <div
        className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20"
        style={{
          background: `radial-gradient(ellipse at center top, ${primary}50 0%, transparent 65%)`,
        }}
      >
        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-navy pointer-events-none" />

        {/* Photos */}
        <div className="relative inline-block mb-7">
          {headshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headshot}
              alt={person.name}
              className="w-52 h-52 rounded-full object-cover border-4 shadow-2xl hero-glow"
              style={{
                borderColor: accent,
                boxShadow: `0 0 60px ${accent}40, 0 0 120px ${primary}50`,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-52 h-52 rounded-full flex items-center justify-center text-7xl border-4"
              style={{ borderColor: accent, background: `${primary}60` }}
            >
              ⭐
            </div>
          )}
          {actionPhoto && (
            <button
              type="button"
              aria-label={`Open ${person.name} action photo`}
              onClick={() => setLightboxSrc(actionPhoto)}
              className="absolute bottom-[-10px] right-[-40px] p-0 border-0 bg-transparent cursor-pointer"
              style={{ transform: "rotate(5deg)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={actionPhoto}
                alt={`${person.name} action`}
                className="w-[110px] h-[110px] rounded-xl object-cover border-3 shadow-xl action-photo block"
                style={{
                  borderColor: primary,
                  border: `3px solid ${primary}`,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </button>
          )}
        </div>

        {/* Name & details */}
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2 relative z-10">
          {person.name}
        </h1>
        <p className="text-white/60 text-lg mb-1 relative z-10">{person.tagline}</p>
        <p className="text-white/40 text-sm relative z-10">
          {person.currentRole} · {person.currentOrg}
        </p>

        {/* Social links */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap relative z-10">
          {person.linkedinUrl && (
            <a
              href={person.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm text-white border backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: `${primary}60`,
                borderColor: `${primary}99`,
              }}
            >
              💼 LinkedIn
            </a>
          )}
          {person.wikiUrl && (
            <a
              href={person.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm text-white border backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: `${primary}60`,
                borderColor: `${primary}99`,
              }}
            >
              📖 Wikipedia
            </a>
          )}
          {person.mlsUrl && (
            <a
              href={person.mlsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm text-white border backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: `${primary}60`,
                borderColor: `${primary}99`,
              }}
            >
              ⚽ MLS
            </a>
          )}
          {person.transfermarktUrl && (
            <a
              href={person.transfermarktUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm text-white border backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: `${primary}60`,
                borderColor: `${primary}99`,
              }}
            >
              📊 Transfermarkt
            </a>
          )}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Bio */}
        <div
          className="glass-sm p-8 mb-12 text-white/85 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: person.bio }}
        />

        {/* Stats */}
        {renderStats()}

        {/* Gallery */}
        {allPhotos.length > 0 && (
          <>
            <SectionHeader>📸 Gallery</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              {allPhotos.map(([key, url]) => (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${key} photo`}
                  className="relative group cursor-pointer rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  onClick={() => setLightboxSrc(url)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLightboxSrc(url);
                    }
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={person.name}
                    className="w-full h-[240px] object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-3 left-3 text-white text-sm font-semibold drop-shadow-lg">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Career Timeline */}
        {person.timeline && person.timeline.length > 0 && (
          <>
            <SectionHeader>⏳ Career Timeline</SectionHeader>
            <div className="relative mb-12">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-6 pl-12">
                {person.timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <div
                      className="absolute -left-[calc(2rem+1px)] top-1 w-8 h-8 rounded-full flex items-center justify-center text-base border border-white/20 bg-navy"
                      style={{ borderColor: `${primary}60` }}
                    >
                      {t.icon}
                    </div>
                    <div className="glass-sm p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono" style={{ color: accent }}>
                          {t.year}
                        </span>
                      </div>
                      <div className="font-semibold text-white text-sm">{t.title}</div>
                      <div className="text-white/60 text-xs mt-1 leading-relaxed">{t.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Education */}
        {person.education && person.education.length > 0 && (
          <>
            <SectionHeader>🎓 Education</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {person.education.map((e, i) => (
                <div key={i} className="glass-sm p-5">
                  <div className="font-bold text-sm mb-1" style={{ color: accent }}>
                    {e.school}
                  </div>
                  <div className="text-white text-sm">
                    {e.degree}
                    {e.sport && <span className="text-white/60"> · {e.sport}</span>}
                  </div>
                  {e.years && (
                    <div className="text-white/40 text-xs mt-1">{e.years}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Career Highlights */}
        {person.careerHighlights && person.careerHighlights.length > 0 && (
          <>
            <SectionHeader>🏆 Career Highlights</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {person.careerHighlights.map((c, i) => (
                <div key={i} className="glass-sm p-5">
                  <div className="font-bold text-sm mb-1" style={{ color: accent }}>
                    {c.title}
                  </div>
                  <div className="text-white/75 text-sm">{c.detail}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Career Teams */}
        {person.careerTeams && person.careerTeams.length > 0 && (
          <>
            <SectionHeader>🏟️ Professional Career</SectionHeader>
            {/* Scrolling marquee */}
            <div className="overflow-hidden mb-4">
              <div className="flex gap-8 animate-marquee whitespace-nowrap">
                {[...person.careerTeams, ...person.careerTeams].map((t, i) => (
                  <span key={i} className="font-bold text-sm" style={{ color: t.color }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
              {person.careerTeams.map((t, i) => (
                <div
                  key={i}
                  className="relative glass-sm p-4 text-center overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{ background: t.color }}
                  />
                  <div className="text-xs mt-1 font-semibold" style={{ color: accent }}>
                    {t.years}
                  </div>
                  <div className="text-white font-bold text-sm mt-1">{t.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">{t.league}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* International */}
        {person.internationalExhibitions && person.internationalExhibitions.length > 0 && (
          <>
            <SectionHeader>🌍 International Experience</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
              {person.internationalExhibitions.map((e, i) => (
                <div
                  key={i}
                  className="glass-sm p-4 flex items-center gap-3"
                >
                  <div
                    className="font-mono font-bold text-xs min-w-[40px]"
                    style={{ color: accent }}
                  >
                    {e.year}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{e.match}</div>
                    <div className="text-white/50 text-xs mt-0.5">{e.context}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Coaching */}
        {person.coachingHighlights && person.coachingHighlights.length > 0 && (
          <>
            <SectionHeader>🧤 Goalkeepers Developed</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {person.coachingHighlights.map((c, i) => (
                <div key={i} className="glass-sm p-5">
                  <div className="font-bold text-sm mb-1" style={{ color: accent }}>
                    {c.player}
                  </div>
                  <div className="text-white text-sm">{c.achievement}</div>
                  <div className="text-white/50 text-xs mt-1">{c.stats}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Articles */}
        {person.articles && person.articles.length > 0 && (
          <>
            <SectionHeader>📰 In the Press</SectionHeader>
            <div className="space-y-3 mb-12">
              {person.articles.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 glass-sm p-4 hover:translate-x-1 transition-transform duration-200 no-underline group"
                >
                  <span className="text-2xl shrink-0">📰</span>
                  <div>
                    <div className="text-white font-semibold text-sm group-hover:text-[var(--ss-accent)] transition-colors">
                      {a.title}
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {a.source} · {a.date}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* Quotes */}
        {person.quotes && person.quotes.length > 0 && (
          <>
            <SectionHeader>💬 Words</SectionHeader>
            <div className="space-y-4 mb-12">
              {person.quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="glass-sm p-6 relative"
                >
                  <div
                    className="absolute top-4 left-5 text-4xl font-serif leading-none opacity-30"
                    style={{ color: accent }}
                  >
                    &ldquo;
                  </div>
                  <p className="text-white/85 text-sm leading-relaxed pl-6 italic">
                    {q.text}
                  </p>
                  <footer className="text-white/40 text-xs mt-3 pl-6">
                    — {q.source}
                  </footer>
                </blockquote>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 pt-8 text-center text-white/30 text-xs">
          <p className="mb-2">
            ⭐ <strong className="text-white/50">Superstars</strong> · A personal showcase
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {person.currentOrgUrl && (
              <a
                href={person.currentOrgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ss-accent)] transition-colors"
              >
                {person.currentOrg}
              </a>
            )}
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ss-accent)] transition-colors"
              >
                LinkedIn
              </a>
            )}
            {person.wikiUrl && (
              <a
                href={person.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ss-accent)] transition-colors"
              >
                Wikipedia
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CSS for dynamic animations (colors depend on person data) */}
      <style>{`
        @keyframes hero-glow {
          from { box-shadow: 0 0 40px ${accent}30, 0 0 80px ${primary}40; }
          to { box-shadow: 0 0 60px ${accent}60, 0 0 120px ${primary}70; }
        }
        .hero-glow {
          animation: hero-glow 3s ease-in-out infinite alternate;
        }
        .action-photo {
          transition: transform 0.3s;
        }
        .action-photo:hover {
          transform: rotate(0deg) scale(1.1) !important;
        }
        .animate-marquee {
          animation: marquee-scroll 20s linear infinite;
        }
      `}</style>
    </>
  );
}
