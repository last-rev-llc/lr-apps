"use client";

import { useState, useMemo } from "react";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
import type { TeamUsfMember, MemberRole, ActivityLevel } from "../lib/types";

const ROLE_STYLE: Record<MemberRole, { bg: string; text: string; icon: string }> = {
  coach:   { bg: "color-mix(in srgb, var(--color-pill-4) 15%, transparent)",  text: "var(--color-red)", icon: "🏆" },
  player:  { bg: "color-mix(in srgb, var(--color-neon-green) 12%, transparent)",  text: "var(--color-neon-green)", icon: "⚽" },
  manager: { bg: "color-mix(in srgb, var(--color-accent) 12%, transparent)",  text: "var(--color-accent-300)", icon: "📋" },
  staff:   { bg: "color-mix(in srgb, var(--color-slate) 12%, transparent)", text: "var(--color-slate)", icon: "🔧" },
};

const ACTIVITY_STYLE: Record<ActivityLevel, { color: string; dot: string }> = {
  active:   { color: "var(--color-neon-green)", dot: "var(--color-neon-green)" },
  bench:    { color: "var(--color-accent-400)", dot: "var(--color-accent)" },
  alumni:   { color: "var(--color-slate)", dot: "var(--color-slate-dim)" },
  inactive: { color: "var(--color-red)", dot: "var(--color-pill-4)" },
};

// Fallback roster when no DB data
const STATIC_ROSTER: TeamUsfMember[] = [
  { id: "m1", name: "Coach Rodriguez", role: "coach", position: "Head Coach", activity: "active", year: "2026", hometown: "Tampa, FL" },
  { id: "m2", name: "Marcus Thompson", role: "player", position: "Forward", jersey_number: 9, activity: "active", year: "Senior", major: "Business", hometown: "Miami, FL" },
  { id: "m3", name: "Kai Chen", role: "player", position: "Midfielder", jersey_number: 8, activity: "active", year: "Junior", major: "Engineering", hometown: "Orlando, FL" },
  { id: "m4", name: "Devon Williams", role: "player", position: "Defender", jersey_number: 4, activity: "active", year: "Sophomore", major: "Kinesiology", hometown: "Jacksonville, FL" },
  { id: "m5", name: "Alex Reyes", role: "player", position: "Goalkeeper", jersey_number: 1, activity: "active", year: "Senior", major: "Sports Management", hometown: "St. Petersburg, FL" },
  { id: "m6", name: "Jordan Park", role: "manager", position: "Team Manager", activity: "active", year: "Junior", major: "Communications" },
];

interface TeamUsfAppProps {
  initialMembers: TeamUsfMember[];
}

export function TeamUsfApp({ initialMembers }: TeamUsfAppProps) {
  const members = initialMembers.length > 0 ? initialMembers : STATIC_ROSTER;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all");
  const [activityFilter, setActivityFilter] = useState<ActivityLevel | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (activityFilter !== "all" && m.activity !== activityFilter) return false;
      if (q) {
        const match = [m.name, m.position, m.major, m.hometown].some(
          (f) => (f ?? "").toLowerCase().includes(q)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [members, search, roleFilter, activityFilter]);

  const counts = {
    coaches: members.filter((m) => m.role === "coach").length,
    players: members.filter((m) => m.role === "player").length,
    active: members.filter((m) => m.activity === "active").length,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="🏫 Team USF"
        subtitle={`${members.length} members · ${counts.players} players · ${counts.coaches} coaches · ${counts.active} active`}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search value={search} onChange={setSearch} placeholder="Search name, position, major…" className="flex-1 min-w-[200px]" />
        <div className="flex gap-1 flex-wrap">
          {(["all", "coach", "player", "manager", "staff"] as const).map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? "outline" : "ghost"}
              size="sm"
              onClick={() => setRoleFilter(r)}
              className={`capitalize ${roleFilter === r ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}`}
            >
              {r === "all" ? "All" : `${ROLE_STYLE[r]?.icon} ${r}`}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "active", "bench", "alumni"] as const).map((a) => (
            <Button
              key={a}
              variant={activityFilter === a ? "outline" : "ghost"}
              size="sm"
              onClick={() => setActivityFilter(a)}
              className={`capitalize ${activityFilter === a ? "border-purple-500/60 bg-purple-500/15 text-purple-400" : ""}`}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🏫" title="No members found" description="Adjust your search or filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((member) => {
            const roleStyle = ROLE_STYLE[member.role];
            const actStyle = ACTIVITY_STYLE[member.activity];
            return (
              <Card key={member.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3">
                    {/* Avatar / jersey number */}
                    <div
                      className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                      style={{ background: roleStyle.bg, color: roleStyle.text }}
                    >
                      {member.jersey_number != null ? `#${member.jersey_number}` : roleStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{member.name}</span>
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: actStyle.dot }}
                          title={member.activity}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge
                          className="text-[10px] px-1.5 py-0.5 border-0 capitalize"
                          style={{ background: roleStyle.bg, color: roleStyle.text }}
                        >
                          {member.role}
                        </Badge>
                        {member.position && (
                          <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                            {member.position}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-0.5 text-[11px] text-white/35">
                        {member.year && <div>📅 {member.year}</div>}
                        {member.major && <div>📚 {member.major}</div>}
                        {member.hometown && <div>📍 {member.hometown}</div>}
                      </div>
                      {member.bio && (
                        <p className="mt-2 text-xs text-white/40 leading-relaxed line-clamp-2">{member.bio}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
