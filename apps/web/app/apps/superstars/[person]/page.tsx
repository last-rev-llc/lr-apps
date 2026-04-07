import { notFound } from "next/navigation";
import peopleData from "../data/people.json";
import { PersonProfile } from "../components/person-profile";
import type { Metadata } from "next";

// Full person type (mirrors the JSON structure)
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
  theme?: {
    primary?: string;
    primaryLight?: string;
    accent?: string;
    accentDark?: string;
  };
  timeline?: Array<{
    year: string;
    title: string;
    detail: string;
    icon: string;
  }>;
  stats?: Record<string, string | number>;
  careerTeams?: Array<{
    name: string;
    years: string;
    league: string;
    color: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    sport?: string;
    years?: string;
  }>;
  careerHighlights?: Array<{ title: string; detail: string }>;
  coachingHighlights?: Array<{
    player: string;
    achievement: string;
    stats: string;
  }>;
  internationalExhibitions?: Array<{
    year: string;
    match: string;
    context: string;
  }>;
  articles?: Array<{
    title: string;
    url: string;
    source: string;
    date: string;
  }>;
  quotes?: Array<{ text: string; source: string }>;
  linkedinUrl?: string;
  wikiUrl?: string;
  mlsUrl?: string;
  transfermarktUrl?: string;
}

const people = peopleData as unknown as Person[];

export function generateStaticParams() {
  return people.map((p) => ({ person: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ person: string }>;
}): Promise<Metadata> {
  const { person: personId } = await params;
  const person = people.find((p) => p.id === personId);
  if (!person) return {};
  return {
    title: `${person.name} — Superstars`,
    description: `${person.tagline} · ${person.currentRole} at ${person.currentOrg}`,
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person: personId } = await params;
  const person = people.find((p) => p.id === personId);

  if (!person) {
    notFound();
  }

  return <PersonProfile person={person} />;
}
