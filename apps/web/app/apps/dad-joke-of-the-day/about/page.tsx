import { Card, CardContent } from "@repo/ui";
import { Badge } from "@repo/ui";
import Link from "next/link";

const features = [
  {
    icon: "🗓️",
    title: "Joke of the Day",
    description:
      "Same joke for everyone, all day. Deterministic by date so you can share it.",
    color: "text-amber-400",
  },
  {
    icon: "🎲",
    title: "Random Mode",
    description:
      "Can't wait until tomorrow? Hit random for instant dad-joke gratification.",
    color: "text-violet-400",
  },
  {
    icon: "👁️",
    title: "Punchline Reveal",
    description:
      "The setup builds suspense. Click to reveal. Groan accordingly.",
    color: "text-blue-400",
  },
  {
    icon: "⭐",
    title: "Rate Jokes",
    description:
      "Was it groan-worthy, eye-roll material, or actually funny? You decide.",
    color: "text-green-400",
  },
  {
    icon: "🗂️",
    title: "7 Categories",
    description:
      "Classic, Food, Animals, Tech, Holiday, Work, and Science jokes in the mix.",
    color: "text-pink-400",
  },
  {
    icon: "📊",
    title: "Community Ratings",
    description:
      "Ratings are aggregated across all users — see which jokes earn the most groans.",
    color: "text-cyan-400",
  },
];

const steps = [
  {
    title: "Open the App",
    description:
      "Today's joke is already waiting. The setup is right there, punchline hidden.",
  },
  {
    title: "Reveal the Punchline",
    description: "Click the button. Brace yourself. Let the groan escape.",
  },
  {
    title: "Rate and Repeat",
    description:
      "Rate it, then hit random for another. Share the pain with friends.",
  },
];

export default function DadJokeAboutPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <Badge
          variant="outline"
          className="border-amber-400/40 text-amber-400 bg-amber-400/10"
        >
          👔 Daily Dad-Grade Humor 👔
        </Badge>
        <h2 className="text-4xl font-bold text-foreground">
          One Groan
          <br />
          Per Day.
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          A fresh dad joke every day, with punchline reveals, ratings, and 55+
          jokes to keep you cringing.
        </p>
        <Link
          href="/apps/dad-joke-of-the-day"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Get Today's Joke →
        </Link>
      </div>

      {/* Features */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            What it does
          </p>
          <h3 className="text-2xl font-bold text-foreground">Peak Dad Energy</h3>
          <p className="text-muted-foreground mt-2">
            Everything you need to deliver maximum eye-rolls at the dinner table.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="glass-sm"
            >
              <CardContent className="p-5 space-y-2">
                <div className={`text-2xl ${f.color}`}>{f.icon}</div>
                <h4 className="font-semibold text-foreground">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            How it works
          </p>
          <h3 className="text-2xl font-bold text-foreground">
            Three Steps to Peak Cringe
          </h3>
          <p className="text-muted-foreground mt-2">
            It's simpler than explaining why the chicken crossed the road.
          </p>
        </div>
        <div className="space-y-4 max-w-lg mx-auto">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Who it's for
          </p>
          <h3 className="text-2xl font-bold text-foreground">
            Certified Dad Joke Enthusiasts
          </h3>
          <p className="text-muted-foreground mt-2">
            If you've ever said "Hi Hungry, I'm Dad" — this is your app.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "👨‍👧‍👦",
              title: "Actual Dads",
              description:
                "Arm yourself with a fresh joke every morning. Your kids will pretend to hate it.",
              color: "text-amber-400",
            },
            {
              icon: "☕",
              title: "Office Ice-Breakers",
              description:
                "Start every standup with a dad joke. Morale through mandatory cringing.",
              color: "text-violet-400",
            },
            {
              icon: "😊",
              title: "Anyone Who Needs a Laugh",
              description:
                "Bad day? A terrible joke somehow makes everything a little better.",
              color: "text-green-400",
            },
          ].map((uc) => (
            <Card
              key={uc.title}
              className="glass-sm"
            >
              <CardContent className="p-5 space-y-2">
                <div className={`text-2xl ${uc.color}`}>{uc.icon}</div>
                <h4 className="font-semibold text-foreground">{uc.title}</h4>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4">
        <h3 className="text-2xl font-bold text-foreground">Ready to Groan?</h3>
        <p className="text-muted-foreground">
          Your daily dose of dad humor is one click away.
        </p>
        <Link
          href="/apps/dad-joke-of-the-day"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Get Today's Joke →
        </Link>
      </section>
    </div>
  );
}
