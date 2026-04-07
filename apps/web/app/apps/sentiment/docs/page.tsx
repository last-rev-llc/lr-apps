export default function DocsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl text-accent">Documentation</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Team Sentiment tracks daily mood scores, work summaries, blockers, and
          highlights for each team member. Data is stored in Supabase and
          displayed as interactive charts and timelines.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Data Schema</h2>
        <p className="text-sm text-muted-foreground">Each entry includes:</p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li><strong className="text-foreground">date</strong> — entry date</li>
          <li><strong className="text-foreground">member_name</strong> — team member</li>
          <li><strong className="text-foreground">sentiment_score</strong> — mood score (0-10)</li>
          <li><strong className="text-foreground">mood</strong> — label (positive, neutral, frustrated, blocked, excited)</li>
          <li><strong className="text-foreground">work_summary</strong> — brief work description</li>
          <li><strong className="text-foreground">blockers</strong> — array of blocker strings</li>
          <li><strong className="text-foreground">highlights</strong> — array of highlight strings</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Scoring Guide</h2>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li><strong className="text-foreground">9-10:</strong> Excited — exceptional day</li>
          <li><strong className="text-foreground">7-8:</strong> Positive — good progress</li>
          <li><strong className="text-foreground">5-6:</strong> Neutral — average day</li>
          <li><strong className="text-foreground">3-4:</strong> Frustrated — challenges present</li>
          <li><strong className="text-foreground">1-2:</strong> Blocked — unable to make progress</li>
        </ul>
      </section>
    </div>
  );
}
