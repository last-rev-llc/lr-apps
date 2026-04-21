import Link from "next/link";
import { CALCULATORS } from "./lib/calculators";
import { CalculatorCard } from "./components/calculator-card";

export default function AgeOfApesHubPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-3 py-8">
        <div className="text-6xl mb-2">🦍</div>
        <h1 className="font-heading text-4xl font-bold">Age of Apes Guide</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Calculators, databases, and guides — everything you need to optimize your Age of Apes
          gameplay. Calculate exact costs, times, and power gains across{" "}
          <span className="text-accent font-semibold">7 calculators</span>.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {CALCULATORS.map((calc) => (
            <Link
              key={calc.slug}
              href={`/apps/age-of-apes/${calc.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                background: calc.color + "20",
                color: calc.color,
              }}
            >
              {calc.icon} {calc.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "35", label: "City Hall Levels" },
            { value: "6", label: "Troop Tiers" },
            { value: "4", label: "Research Trees" },
            { value: "50", label: "Fighter Max Level" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-surface-border bg-surface-card p-4 text-center"
            >
              <div className="font-heading text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Calculator grid */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">Choose a Calculator</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CALCULATORS.map((calc) => (
            <CalculatorCard key={calc.slug} calc={calc} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-surface-border pt-8">
        <h2 className="font-heading text-xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Pick Your Target",
              desc: "Select the building, research, or troop upgrade you want to plan.",
            },
            {
              step: "2",
              title: "Set Your Buffs",
              desc: "Enter speed bonuses, Architect, Rise & Soar — see the real time and cost.",
            },
            {
              step: "3",
              title: "Execute",
              desc: "Know exactly what resources you need and how long it takes. No guessing.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 p-4 rounded-xl border border-surface-border bg-surface-card"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
