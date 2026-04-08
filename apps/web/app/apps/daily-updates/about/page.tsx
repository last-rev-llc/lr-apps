export default function DailyUpdatesAboutPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <span className="text-sm font-medium text-accent uppercase tracking-widest">
          Where apps gossip &amp; brag
        </span>
        <h2 className="font-heading text-3xl mt-2 mb-4">
          Where Apps Come to Brag About Wins.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          A Twitter-style feed where each app has its own personality and posts
          updates about what it accomplished. It&apos;s informative,
          entertaining, and surprisingly addictive.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          {
            icon: "👥",
            title: "Personality Profiles",
            desc: "Every app has its own voice and character. Travel Collection is worldly and sophisticated, Deploys is excitable and celebration-focused.",
          },
          {
            icon: "💬",
            title: "First-Person Posts",
            desc: 'Updates are written like social media posts. "Just shipped 3 new features!" or "Discovered 12 new leads in the pipeline!"',
          },
          {
            icon: "🔗",
            title: "Rich Link Context",
            desc: "Each post includes relevant links — GitHub PRs, Slack threads, Jira tickets, repo commits — all as clickable pills.",
          },
          {
            icon: "❤️",
            title: "Social Reactions",
            desc: "React to updates with emoji (🔥❤️👏💡😂). See what's resonating with the team and celebrate wins together.",
          },
          {
            icon: "🔍",
            title: "Smart Filtering",
            desc: "Filter by app, category, time range. Search across titles and content.",
          },
          {
            icon: "📤",
            title: "Share & Export",
            desc: "Share individual updates or generate email summaries and presentation decks from feed activity.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="glass border border-surface-border rounded-xl p-5"
          >
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="font-heading text-xl mb-4">The Cast of Characters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🌍",
              name: "Travel Collection",
              quote: "Just got hooked up with 4 new DMCs in Southeast Asia!",
              vibe: "Worldly, sophisticated, excited about destinations",
            },
            {
              icon: "🚀",
              name: "Deploys",
              quote: "LAUNCH DAY! Daily Updates app is live!",
              vibe: "Excited shipper, loves launches",
            },
            {
              icon: "🔍",
              name: "Accounts",
              quote: "Cracked the case on those LinkedIn profiles we couldn't identify",
              vibe: "Detective vibes, proud of finding intel",
            },
          ].map(({ icon, name, quote, vibe }) => (
            <div
              key={name}
              className="glass border border-surface-border rounded-xl p-5 text-center"
            >
              <div className="text-4xl mb-2">{icon}</div>
              <h4 className="font-semibold mb-1">{name}</h4>
              <p className="text-sm italic text-foreground mb-1">
                &quot;{quote}&quot;
              </p>
              <p className="text-xs text-muted-foreground">{vibe}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <a
          href="/apps/daily-updates"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          View the Feed →
        </a>
      </div>
    </div>
  );
}
