import Link from "next/link";
import { CardContent } from "@repo/ui";

interface PersonCardProps {
  person: {
    id: string;
    name: string;
    tagline: string;
    currentRole: string;
    currentOrg: string;
    photos: Record<string, string>;
    theme?: { primary?: string; accent?: string };
  };
}

export function PersonCard({ person }: PersonCardProps) {
  const primary = person.theme?.primary ?? "var(--ss-primary)";
  const accent = person.theme?.accent ?? "var(--ss-accent)";
  const headshot = person.photos?.headshot;

  return (
    <Link
      href={`/apps/superstars/${person.id}`}
      className="group block rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${primary}20 0%, ${primary}08 100%)`,
        borderColor: `${primary}40`,
      }}
    >
      {/* Photo area */}
      <div
        className="relative h-40 flex items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at center, ${primary}40 0%, transparent 70%)`,
        }}
      >
        {headshot ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={headshot}
            alt={person.name}
            className="w-24 h-24 rounded-full object-cover border-4 shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{ borderColor: accent }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl border-4"
            style={{ borderColor: accent, background: `${primary}60` }}
          >
            ⭐
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-5">
        <h3
          className="font-heading text-lg font-bold mb-1 transition-colors group-hover:opacity-90"
          style={{ color: accent }}
        >
          {person.name}
        </h3>
        <p className="text-white/60 text-xs mb-3">{person.tagline}</p>
        <div className="text-white/80 text-xs">
          <span className="font-medium">{person.currentRole}</span>
          {person.currentOrg && (
            <span className="text-white/50"> · {person.currentOrg}</span>
          )}
        </div>
        <div
          className="mt-4 text-xs font-semibold"
          style={{ color: accent }}
        >
          View Profile →
        </div>
      </CardContent>
    </Link>
  );
}
