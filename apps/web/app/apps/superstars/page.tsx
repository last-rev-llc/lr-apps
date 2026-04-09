import Link from "next/link";
import peopleData from "./data/people.json";
import { PersonCard } from "./components/person-card";

export default function SuperstarsPage() {
  const people = peopleData as Array<{
    id: string;
    name: string;
    tagline: string;
    currentRole: string;
    currentOrg: string;
    photos: Record<string, string>;
    theme?: { primary?: string; accent?: string };
  }>;

  // If only one person, redirect straight to their page
  if (people.length === 1) {
    const p = people[0];
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-white/50 text-sm mb-6">Redirecting to profile…</p>
        <Link
          href={`/apps/superstars/${p.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--ss-primary)] border border-[var(--ss-accent)] text-[var(--ss-accent)] font-semibold hover:opacity-80 transition-opacity"
        >
          View {p.name}&apos;s Profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl font-bold text-white mb-3">
          ⭐ Superstars
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto">
          A personal showcase celebrating athletes and notable individuals.
        </p>
      </div>

      {/* People grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>
    </div>
  );
}
