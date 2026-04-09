"use client";

import { useState } from "react";
import { Button, Card, CardContent, PageHeader } from "@repo/ui";

interface RizzTip {
  id: string;
  category: string;
  title: string;
  tip: string;
  example?: string;
}

interface RizzScenario {
  id: string;
  label: string;
  icon: string;
}

const SCENARIOS: RizzScenario[] = [
  { id: "opener", label: "Opening Line", icon: "👋" },
  { id: "callback", label: "Callback", icon: "🔄" },
  { id: "banter", label: "Banter", icon: "⚡" },
  { id: "deepconvo", label: "Deep Convo", icon: "🧠" },
  { id: "exit", label: "Exit / Close", icon: "🎯" },
];

const TIPS: RizzTip[] = [
  {
    id: "t1", category: "opener",
    title: "Specific compliment beats generic",
    tip: "Mention something specific and genuine rather than 'you're pretty.' It shows you actually paid attention.",
    example: "\"That book you mentioned last week — I looked it up. You have great taste.\"",
  },
  {
    id: "t2", category: "opener",
    title: "The confident pause",
    tip: "After saying something, pause instead of filling silence. Silence = confidence. Let them respond.",
    example: "Say your opener. Smile. Wait.",
  },
  {
    id: "t3", category: "banter",
    title: "Playful disagreement",
    tip: "Agree with everything and you're boring. Disagree playfully on small things to create tension.",
    example: "\"That's the worst movie taste I've ever heard. I'll fix this.\"",
  },
  {
    id: "t4", category: "banter",
    title: "Callback humor",
    tip: "Reference something from earlier in the conversation — shows you were listening and builds inside jokes.",
    example: "They mention loving coffee → later: \"I forgive you for the terrible movie opinions. The coffee obsession makes up for it.\"",
  },
  {
    id: "t5", category: "deepconvo",
    title: "Question stacking",
    tip: "Ask a surface question, listen to the answer, then ask a deeper question about the answer. Don't interrogate.",
    example: "\"What do you do?\" → \"What made you choose that?\" → \"Is that still what excites you about it?\"",
  },
  {
    id: "t6", category: "deepconvo",
    title: "Vulnerability earns vulnerability",
    tip: "Share something real about yourself to invite them to do the same. People open up when you go first.",
    example: "\"I was honestly terrified of that the first time. What was it like for you?\"",
  },
  {
    id: "t7", category: "callback",
    title: "The 24h follow-up",
    tip: "Reference something specific from your last conversation in the first message. Shows you remembered.",
    example: "\"Did that presentation end up going well? You seemed stressed about it.\"",
  },
  {
    id: "t8", category: "callback",
    title: "Inside joke callbacks",
    tip: "Build one recurring bit or joke across conversations. It becomes your shared language.",
    example: "Keep a running theme from a funny moment and bring it up again naturally.",
  },
  {
    id: "t9", category: "exit",
    title: "End before it's over",
    tip: "Leave when energy is highest. Don't drag conversations until they fizzle. Always end on a high note.",
    example: "\"This was genuinely fun. I have to go but let's do this again.\"",
  },
  {
    id: "t10", category: "exit",
    title: "Make the next step obvious",
    tip: "Don't leave the next interaction ambiguous. State when/how you'll connect next.",
    example: "\"I'm free Thursday evening — want to grab coffee?\"",
  },
];

const TEMPLATES = [
  { scenario: "First message after meeting IRL", template: "Hey [name], [specific callback to something you talked about]. I was thinking about that and [genuine follow-up thought]." },
  { scenario: "Reigniting a cold conversation", template: "Random thought: [thing that reminded you of them]. Made me think of that [reference from before]." },
  { scenario: "Asking them out casually", template: "I'm doing [specific thing] on [day]. You should come." },
  { scenario: "After a great date", template: "That was actually really fun. The [specific moment] part especially." },
];

export function RizzGuideApp() {
  const [activeScenario, setActiveScenario] = useState<string>("opener");

  const visibleTips = TIPS.filter((t) => t.category === activeScenario);

  return (
    <div className="space-y-6">
      <PageHeader
        title="✨ Rizz Guide"
        subtitle="Communication coaching — tips, templates, and scenarios"
      />

      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map((s) => (
          <Button
            key={s.id}
            variant={activeScenario === s.id ? "outline" : "ghost"}
            size="sm"
            onClick={() => setActiveScenario(s.id)}
            className={activeScenario === s.id ? "border-purple-500/60 bg-purple-500/15 text-purple-400" : ""}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </Button>
        ))}
      </div>

      {/* Tips for selected scenario */}
      {visibleTips.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {visibleTips.map((tip) => (
            <Card key={tip.id} className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="text-sm font-semibold text-white">{tip.title}</div>
                <p className="text-xs text-white/55 leading-relaxed">{tip.tip}</p>
                {tip.example && (
                  <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/8">
                    <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wide">Example</div>
                    <div className="text-xs text-amber-400/80 italic leading-relaxed">{tip.example}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <CardContent className="p-0 text-center text-white/30 text-sm">
            No tips for this scenario yet
          </CardContent>
        </Card>
      )}

      {/* Conversation Templates */}
      <div>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <span>📝</span> Message Templates
        </h3>
        <div className="space-y-3">
          {TEMPLATES.map((t, i) => (
            <Card key={i} className="p-4">
              <CardContent className="p-0">
                <div className="text-xs text-purple-400 mb-1.5 font-semibold">{t.scenario}</div>
                <div className="text-sm text-white/70 leading-relaxed font-mono bg-white/5 rounded-lg px-3 py-2">
                  {t.template}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Golden rules */}
      <Card className="p-4">
        <CardContent className="p-0">
          <h3 className="font-semibold text-white mb-3">🏆 Golden Rules</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Be genuinely interested, not interesting",
              "Specificity > generality always",
              "Match their energy, then lead",
              "Silence is not awkward — it's magnetic",
              "End every interaction on a high",
              "People remember how you made them feel",
            ].map((rule, i) => (
              <div key={i} className="flex gap-2 text-xs text-white/60">
                <span className="text-amber-400 shrink-0">→</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
