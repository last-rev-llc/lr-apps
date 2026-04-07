import Link from "next/link";
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

export default async function GenerationsHubPage() {
  const termCounts = await getTermCounts();
  const totalTerms = Object.values(termCounts).reduce((a, b) => a + b, 0);

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
          {[
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
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-xl border border-surface-border bg-surface-card text-center"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline teaser */}
      <section className="border-t border-surface-border pt-8">
        <h2 className="font-heading text-xl font-bold mb-4 text-center">
          The Language Timeline
        </h2>
        <div className="relative">
          {/* Horizontal line */}
          <div className="absolute top-5 left-0 right-0 h-px bg-surface-border" />
          <div className="relative flex justify-between gap-2 overflow-x-auto pb-4">
            {GENERATIONS.slice().reverse().map((gen) => (
              <Link
                key={gen.slug}
                href={`/apps/generations/${gen.slug}`}
                className="flex flex-col items-center gap-2 min-w-[80px] group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-surface-bg relative z-10 group-hover:scale-110 transition-transform"
                  style={{
                    background: gen.color + "20",
                    borderColor: gen.color,
                  }}
                >
                  {gen.emoji}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{gen.name}</p>
                  <p className="text-[10px] text-muted-foreground">{gen.era}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
