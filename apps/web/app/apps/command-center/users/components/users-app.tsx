"use client";

import { useState, useMemo } from "react";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  Search,
  Avatar,
  AvatarImage,
  AvatarFallback,
  ViewToggle,
} from "@repo/ui";
import type { ViewToggleView } from "@repo/ui";
import type { Contact, ContactType, SortKey, SortDir } from "../lib/types";
import { ContactDetail, ContactTypeBadge } from "./contact-detail";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS: Array<{ value: ContactType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "team", label: "Team" },
  { value: "client", label: "Client" },
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "vendor", label: "Vendor" },
  { value: "contractor", label: "Contractor" },
  { value: "personal", label: "Personal" },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "researched", label: "Researched" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function hasInsights(c: Contact): boolean {
  return !!c.insights;
}

// ── Main component ────────────────────────────────────────────────────────────

interface UsersAppProps {
  initialContacts: Contact[];
}

export function UsersApp({ initialContacts }: UsersAppProps) {
  const [contacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType | "all">("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<ViewToggleView>("grid");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Derived company list
  const companies = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.company) set.add(c.company);
    });
    return Array.from(set).sort();
  }, [contacts]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = contacts.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (companyFilter !== "all" && c.company !== companyFilter) return false;
      if (q) {
        const nameMatch = (c.name ?? "").toLowerCase().includes(q);
        const emailMatch = (c.email ?? "").toLowerCase().includes(q);
        const companyMatch = (c.company ?? "").toLowerCase().includes(q);
        const titleMatch = (c.title ?? "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !companyMatch && !titleMatch) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return dir * (a.name ?? "").localeCompare(b.name ?? "");
      if (sortKey === "company")
        return dir * (a.company ?? "").localeCompare(b.company ?? "");
      if (sortKey === "researched")
        return dir * ((a.last_researched_at ?? "").localeCompare(b.last_researched_at ?? ""));
      return 0;
    });

    return list;
  }, [contacts, search, typeFilter, companyFilter, sortKey, sortDir]);

  // Type counts for filter pills
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length };
    contacts.forEach((c) => {
      if (c.type) counts[c.type] = (counts[c.type] ?? 0) + 1;
    });
    return counts;
  }, [contacts]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="👥 Contacts"
        subtitle={`${contacts.length} contacts · ${contacts.filter(hasInsights).length} with insights`}
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search name, email, company…"
          className="flex-1 min-w-[200px]"
        />

        {/* Company dropdown */}
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-white/70 backdrop-blur-sm focus:border-amber-500/60 focus:outline-none"
        >
          <option value="all">All Companies</option>
          {companies.map((co) => (
            <option key={co} value={co}>
              {co}
            </option>
          ))}
        </select>

        {/* Sort buttons */}
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                sortKey === opt.value
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {opt.label}
              {sortKey === opt.value && (
                <span className="ml-0.5">{sortDir === "asc" ? " ↑" : " ↓"}</span>
              )}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => {
          const count = typeCounts[f.value] ?? 0;
          if (f.value !== "all" && count === 0) return null;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${
                typeFilter === f.value
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                  : "border-white/12 bg-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No contacts match"
          description="Try adjusting the search or filters"
        />
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onClick={() => setSelectedContact(contact)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              onClick={() => setSelectedContact(contact)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      <ContactDetail
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
      />
    </div>
  );
}

// ── Contact Card (grid view) ──────────────────────────────────────────────────

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
}

function ContactCard({ contact, onClick }: ContactCardProps) {
  return (
    <Card
      className="cursor-pointer p-4 transition-all duration-150 hover:border-amber-500/30 hover:bg-white/6"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/12">
            {contact.avatar ? (
              <AvatarImage src={contact.avatar} alt={contact.name} />
            ) : null}
            <AvatarFallback className="bg-amber-500/15 text-amber-300 text-xs font-semibold">
              {initials(contact.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <span className="font-semibold text-sm text-white truncate">
                {contact.name}
              </span>
              {contact.type && <ContactTypeBadge type={contact.type} />}
            </div>

            {(contact.title || contact.company) && (
              <p className="text-xs text-white/45 mt-0.5 truncate">
                {[contact.title, contact.company].filter(Boolean).join(" · ")}
              </p>
            )}

            {contact.email && (
              <p className="text-xs text-white/30 mt-0.5 truncate">{contact.email}</p>
            )}
          </div>
        </div>

        {/* Bottom row: social icons + insights indicator */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/6">
          <div className="flex gap-2">
            {contact.linkedin_url && (
              <SocialDot
                href={contact.linkedin_url}
                label="LinkedIn"
                className="text-[#0a66c2]"
              >
                in
              </SocialDot>
            )}
            {contact.github_handle && (
              <SocialDot
                href={`https://github.com/${contact.github_handle}`}
                label="GitHub"
                className="text-white/40"
              >
                gh
              </SocialDot>
            )}
            {contact.twitter_handle && (
              <SocialDot
                href={`https://twitter.com/${contact.twitter_handle}`}
                label="Twitter"
                className="text-sky-400"
              >
                𝕏
              </SocialDot>
            )}
            {contact.slack_handle && (
              <span className="text-[11px] text-[#e01e5a]/70">
                @{contact.slack_handle}
              </span>
            )}
          </div>

          {contact.insights && (
            <Badge
              className="border-0 text-[10px] px-1.5 py-0.5"
              style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
            >
              insights
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Contact Row (list view) ───────────────────────────────────────────────────

function ContactRow({ contact, onClick }: ContactCardProps) {
  return (
    <div
      className="flex items-center gap-3 cursor-pointer rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 transition-all hover:border-amber-500/25 hover:bg-white/5"
      onClick={onClick}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {contact.avatar ? <AvatarImage src={contact.avatar} alt={contact.name} /> : null}
        <AvatarFallback className="bg-amber-500/15 text-amber-300 text-[10px] font-semibold">
          {initials(contact.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 items-center">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white truncate block">{contact.name}</span>
          {contact.title && (
            <span className="text-xs text-white/40 truncate block">{contact.title}</span>
          )}
        </div>

        <div className="min-w-0 hidden sm:block">
          {contact.company && (
            <span className="text-xs text-white/50 truncate block">{contact.company}</span>
          )}
          {contact.email && (
            <span className="text-xs text-white/30 truncate block">{contact.email}</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {contact.type && <ContactTypeBadge type={contact.type} />}
          {contact.insights && (
            <span
              className="hidden sm:inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                background: "rgba(124,58,237,0.12)",
                color: "#a78bfa",
                borderColor: "rgba(124,58,237,0.3)",
              }}
            >
              insights
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Social dot link ───────────────────────────────────────────────────────────

function SocialDot({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-bold transition-opacity hover:opacity-60 ${className}`}
    >
      {children}
    </a>
  );
}
