import Link from "next/link";
import { Card, CardContent, Timeline } from "@repo/ui";
import type { TimelineEvent } from "@repo/ui";
import { GENERATIONS } from "./lib/generations";
import { GenerationCard } from "./components/generation-card";
import type { SlangTerm } from "./lib/types";

// Load term counts for each generation
async function getTermCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const gen of GENERATIONS) {
    try {
      const data = (await import(`./data/${gen.slug}.json`)) as { default: SlangTerm[] };
      counts[gen.slug] = data.default.length;
    } catch {
      counts[gen.slug] = 0;
    }
  }
  return counts;
}

export const metadata = {
  title: "🕰️ Generations — Slang Hub",
  description:
    "Explore slang dictionaries, translators, and quizzes for every generation — from Silent Gen to Gen Alpha.",
};

const FEATURES = [
  {
    icon: "📖",
    title: "Dictionary",
    desc: "Browse and search every slang term with definitions, examples, and vibe scores.",
  },
  {
    icon: "🔄",
    title: "Translator",
    desc: "Translate plain English into generational slang, or decode slang back to English.",
  },
  {
    icon: "🎯",
    title: "Quiz",
    desc: "Test your knowledge with a 10-question multiple-choice quiz on each generation.",
  },
  {
    icon: "🔥",
    title: "Trending Wall",
    desc: "See the top-rated slang terms by vibe score for each generation.",
  },
];

export default async function GenerationsHubPage() {
  const termCounts = await getTermCounts();
  const totalTerms = Object.values(termCounts).reduce((a, b) => a + b, 0);

  const timelineEvents: TimelineEvent[] = GENERATIONS.slice()
    .reverse()
    .map((gen) => ({
      date: gen.era,
      title: gen.name,
      icon: <span>{gen.emoji}</span>,
    }));

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 py-6">
        <h1 className="font-heading text-4xl font-bold">🕰️ Generations</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Every generation has its own language. Explore{" "}
          <span className="text-accent font-semibold">{totalTerms}+ slang terms</span> across{" "}
          {GENERATIONS.length} generations — with dictionaries, translators, and quizzes.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {GENERATIONS.map((gen) => (
            <Link
              key={gen.slug}
              href={`/apps/generations/${gen.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                background: gen.color + "20",
                color: gen.color,
              }}
            >
              {gen.emoji} {gen.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Generation Cards Grid */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">
          Choose Your Generation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GENERATIONS.map((gen) => (
            <GenerationCard
              key={gen.slug}
              gen={gen}
              termCount={termCounts[gen.slug] ?? 0}
            />
          ))}
        </div>
      </section>

      {/* Feature overview */}
      <section className="border-t border-surface-border pt-8">
        <h2 className="font-heading text-xl font-bold mb-6 text-center">
          What&apos;s Inside Each Generation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="border-surface-border bg-surface-card text-center"
            >
              <CardContent className="p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-surface-border pt-8">
        <h2 className="font-heading text-xl font-bold mb-4 text-center">
          The Language Timeline
        </h2>
        <Timeline events={timelineEvents} />
      </section>
    </div>
  );
}
