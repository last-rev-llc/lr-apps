import Link from "next/link";
import { Card, CardContent, Button } from "@repo/ui";

export const metadata = {
  title: "About Cringe Rizzler — Embarrass Gen Alpha",
  description:
    "AI-powered cringe phrases and memes that weaponize Gen Alpha slang for maximum parental embarrassment.",
};

const FEATURES = [
  {
    icon: "✨",
    title: "AI Phrase Generator",
    desc: "One-click cringe phrases that hilariously misuse Gen Alpha slang in Boomer speech patterns.",
    color: "#f59e0b",
  },
  {
    icon: "🖼️",
    title: "Meme Generator",
    desc: "AI-captioned memes on classic templates for every awkward parent scenario — from family dinner to parent-teacher night.",
    color: "#a855f7",
  },
  {
    icon: "📖",
    title: "Slang Glossary",
    desc: "Every generated phrase shows the Gen Alpha terms used with definitions so you know exactly what you're mangling.",
    color: "#22c55e",
  },
  {
    icon: "⎘",
    title: "Copy & Share",
    desc: "One-tap copy to clipboard. Paste into the family group chat for instant chaos.",
    color: "#ec4899",
  },
  {
    icon: "🏆",
    title: "Vibe Scores",
    desc: "Each slang term is rated 1–10 so you know which words pack the most cringe power.",
    color: "#3b82f6",
  },
  {
    icon: "🎯",
    title: "Category Filters",
    desc: "Browse slang by personality, fashion, internet culture, and more. Study before you deploy.",
    color: "#f43f5e",
  },
];

const USE_CASES = [
  {
    icon: "👨‍👩‍👧",
    title: "Gen X Parents",
    desc: "You grew up saying \"radical\" and \"gnarly.\" Now weaponize \"sigma\" and \"rizz\" with the same chaotic energy.",
    color: "#f59e0b",
  },
  {
    icon: "☕",
    title: "Boomer Grandparents",
    desc: "Take your \"back in my day\" energy and combine it with Gen Alpha brainrot for legendary family dinners.",
    color: "#a855f7",
  },
  {
    icon: "💼",
    title: "Cool Coworkers",
    desc: "Spice up that Slack message or all-hands meeting. \"This quarterly report is bussin no cap fr fr.\"",
    color: "#22c55e",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Generate",
    desc: "Hit the button. AI creates a phrase that would make any teenager want to disappear.",
  },
  {
    num: "2",
    title: "Study",
    desc: "Learn what the slang terms actually mean. Knowledge is power. Cringe power.",
  },
  {
    num: "3",
    title: "Deploy",
    desc: "Drop the phrase at dinner, in the car, or loudly in front of their friends. Maximum impact.",
  },
];

export default function CringeRizzlerAboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <p className="text-xs font-bold uppercase tracking-widest text-pink-400">
          🔥 Maximum Cringe Unlocked 🔥
        </p>
        <h1
          className="font-heading text-4xl font-black leading-tight"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Embarrass Gen Alpha.<br />
          One Phrase at a Time.
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          AI-powered cringe phrases and memes that weaponize Gen Alpha slang for maximum
          parental embarrassment. No cap fr fr.
        </p>
        <Button
          asChild
          className="rounded-xl px-8 py-3 font-bold text-white hover:opacity-90 hover:scale-105 border-0"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            boxShadow: "0 0 24px rgba(236,72,153,0.4)",
          }}
        >
          <Link href="/apps/cringe-rizzler">Start the Cringe →</Link>
        </Button>
      </div>

      {/* Features */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            What it does
          </p>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Your Dad Joke Arsenal,<br />Gen Alpha Edition
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Tools designed to make your kids cringe so hard they question their life choices.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="glass-sm hover:bg-white/8 transition-all"
            >
              <CardContent className="p-5 space-y-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: f.color + "20", border: `1px solid ${f.color}30` }}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            How it works
          </p>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Three Steps to<br />Maximum Embarrassment
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            It&apos;s never been easier to ruin your kid&apos;s social standing.
          </p>
        </div>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <Card
              key={step.num}
              className="glass-sm"
            >
              <CardContent className="flex gap-5 p-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0"
                  style={{
                    background: i === 0
                      ? "linear-gradient(135deg, #ec4899, #a855f7)"
                      : i === 1
                      ? "linear-gradient(135deg, #a855f7, #3b82f6)"
                      : "linear-gradient(135deg, #f59e0b, #ec4899)",
                    color: "white",
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Who it&apos;s for
          </p>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Built for Parents.<br />Feared by Teenagers.
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            If you&apos;ve ever said &ldquo;that&apos;s fire&rdquo; and gotten an eye roll, this is your app.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {USE_CASES.map((u) => (
            <Card
              key={u.title}
              className="glass-sm hover:bg-white/8 transition-all"
            >
              <CardContent className="p-5 space-y-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: u.color + "20", border: `1px solid ${u.color}30` }}
                >
                  {u.icon}
                </div>
                <h3 className="font-semibold text-foreground">{u.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{u.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-8 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Get started
        </p>
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Ready to Be the Most<br />Embarrassing Parent Ever?
        </h2>
        <p className="text-muted-foreground text-sm">
          Your kids will never recover. That&apos;s the point.
        </p>
        <Button
          asChild
          className="rounded-xl px-8 py-3 font-bold text-white hover:opacity-90 hover:scale-105 border-0"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            boxShadow: "0 0 24px rgba(236,72,153,0.4)",
          }}
        >
          <Link href="/apps/cringe-rizzler">Start the Cringe →</Link>
        </Button>
      </section>
    </div>
  );
}
