export default function ProperWinePourAboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl mb-2" style={{ color: "var(--color-pill-6)" }}>
          Every Glass Deserves a Proper Pour.
        </h1>
        <p className="text-muted-foreground">
          Know what you should be getting — and call it out when you don&apos;t.
        </p>
      </div>

      {/* The Golden Rule callout */}
      <div
        className="rounded-xl p-5 text-center border"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--color-red) 25%, transparent), color-mix(in srgb, var(--color-red) 18%, transparent))",
          borderColor: "var(--color-red)",
        }}
      >
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-pill-6)" }}>750ml</div>
            <div className="text-xs text-muted-foreground">Standard Bottle</div>
          </div>
          <div className="text-muted-foreground text-2xl">=</div>
          <div>
            <div className="text-3xl font-bold text-green">5</div>
            <div className="text-xs text-muted-foreground">Proper Glasses (5oz)</div>
          </div>
        </div>
        <p className="text-muted-foreground text-xs mt-3">
          If a restaurant is getting six or seven glasses out of a bottle, every customer is being shorted. That&apos;s not economy — that&apos;s theft.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: "Pour Guide",
            desc: "Visual diagrams of proper pour sizes. Know exactly what 5oz looks like in your glass.",
          },
          {
            title: "Pour Calculator",
            desc: "Enter the bottle price and restaurant markup. The rip-off meter tells you if you're getting fleeced.",
          },
          {
            title: "Pour Tracker",
            desc: "Log and rate restaurant pours. Build a leaderboard of who's generous and who's criminal.",
          },
          {
            title: "Wine Knowledge",
            desc: "Serving temps, food pairings, corkage fees, and how to tell if you're being shorted.",
          },
          {
            title: "Community Wall",
            desc: "Share pour stories — the glory and the shame. Upvote the best, call out the worst.",
          },
          {
            title: "Rip-Off Meter",
            desc: "Real-time markup calculator that goes from Fair Deal to Highway Robbery. The math doesn't lie.",
          },
        ].map((f) => (
          <div key={f.title} className="glass-sm p-4">
            <h3 className="text-sm font-medium mb-1" style={{ color: "var(--color-pill-6)" }}>{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl" style={{ color: "var(--color-pill-6)" }}>Three Steps to Pour Justice</h2>
        <ol className="space-y-3">
          {[
            {
              step: "Learn What's Right",
              desc: "Use the visual pour guide to understand exactly what a standard 5oz pour looks like in different glass types. A bottle should give you 5 glasses — no more, no less.",
            },
            {
              step: "Check the Math",
              desc: "Run the numbers with the calculator. Enter the bottle price and what you're paying per glass. The rip-off meter doesn't lie.",
            },
            {
              step: "Rate & Share",
              desc: "Log your restaurant visits. Rate the pour. Share stories on the community wall. Together we hold restaurants accountable.",
            },
          ].map((item, i) => (
            <li key={item.step} className="glass-sm p-4 flex gap-4">
              <span className="font-bold text-lg shrink-0" style={{ color: "var(--color-pill-6)" }}>
                {i + 1}.
              </span>
              <div>
                <h3 className="text-sm font-medium mb-0.5">{item.step}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-center">
        <a
          href="/apps/proper-wine-pour"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "var(--color-red)", color: "white" }}
        >
          Check Your Pour →
        </a>
      </div>
    </div>
  );
}
