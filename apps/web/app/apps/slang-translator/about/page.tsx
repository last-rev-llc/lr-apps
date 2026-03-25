export default function SlangTranslatorAboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-accent mb-2">
          The Rosetta Stone for Generational Slang
        </h1>
        <p className="text-muted-foreground">
          Bridge the communication gap between Gen Alpha and Gen X.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: "Unified Dictionary",
            desc: "All slang from both generations in one searchable card grid with generation badges and filters.",
          },
          {
            title: "Live Translator",
            desc: "Two-panel translator that converts Gen Alpha slang to Gen X and vice versa in real time.",
          },
          {
            title: "Side-by-Side Comparisons",
            desc: "Matched pairs showing how the same concept was expressed across generations.",
          },
          {
            title: "Cross-Gen Quiz",
            desc: "Test your knowledge with quizzes that ask for equivalents across generations.",
          },
          {
            title: "Smart Search",
            desc: "Search across terms, definitions, and aliases from both generations simultaneously.",
          },
          {
            title: "Generation Filters",
            desc: "Filter by generation, category, and vibe score to find exactly what you need.",
          },
        ].map((f) => (
          <div key={f.title} className="glass-sm p-4">
            <h3 className="text-sm font-medium text-accent mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-xl text-accent">How it works</h2>
        <ol className="space-y-3">
          {[
            {
              step: "Browse the Dictionary",
              desc: "Explore all slang from both generations with rich cards showing definitions, examples, vibe scores, and cross-generation equivalents.",
            },
            {
              step: "Translate Between Eras",
              desc: "Paste text into the translator and see recognized slang highlighted with their cross-generation equivalents.",
            },
            {
              step: "Test Your Knowledge",
              desc: "Take the cross-generational quiz to see if you can speak both languages fluently.",
            },
          ].map((item, i) => (
            <li key={item.step} className="glass-sm p-4 flex gap-4">
              <span className="text-accent font-bold text-lg shrink-0">
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
          href="/apps/slang-translator"
          className="inline-block px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Open Translator →
        </a>
      </div>
    </div>
  );
}
