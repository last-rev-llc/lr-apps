import { Card, CardContent } from "@repo/ui";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-accent mb-2">
          Track Team Sentiment in Real-Time
        </h1>
        <p className="text-muted-foreground">
          Monitor mood, identify blockers, celebrate highlights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Mood Tracking", desc: "Daily sentiment scores from 1-10 with mood labels" },
          { title: "Blocker Detection", desc: "Surface and address team blockers early" },
          { title: "Highlight Capture", desc: "Celebrate wins and positive moments" },
          { title: "Trend Analysis", desc: "Interactive charts showing sentiment over time" },
          { title: "Team Dashboard", desc: "At-a-glance view of every team member" },
          { title: "Member Filtering", desc: "Drill into individual team member data" },
        ].map((f) => (
          <Card key={f.title} className="glass-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-accent mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
