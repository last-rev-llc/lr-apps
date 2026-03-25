"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Badge,
  Button,
  Card,
  CardContent,
} from "@repo/ui";
import { GEN_X_MAP } from "../lib/gen-x-map";
import type {
  SlangEntry,
  GenerationFilter,
  QuizState,
  QuizQuestion,
} from "../lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function vibeColor(score: number) {
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#eab308";
  return "#ef4444";
}

function VibeBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[11px] text-muted-foreground">Vibe</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: vibeColor(score) }}
        />
      </div>
      <span
        className="text-[12px] font-bold"
        style={{ color: vibeColor(score) }}
      >
        {score}/10
      </span>
    </div>
  );
}

function GenBadge({ gen }: { gen: "gen-alpha" | "gen-x" }) {
  return gen === "gen-alpha" ? (
    <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wide bg-violet-500/15 text-violet-300">
      Gen Alpha
    </span>
  ) : (
    <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wide bg-amber-500/15 text-amber-300">
      Gen X
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    compliment: "#22c55e",
    Approval: "#22c55e",
    insult: "#ef4444",
    Insult: "#ef4444",
    reaction: "#eab308",
    Reaction: "#eab308",
    lifestyle: "#8b5cf6",
    Lifestyle: "#8b5cf6",
    "internet culture": "#06b6d4",
    "Internet Culture": "#ec4899",
    Disapproval: "#f97316",
    Greeting: "#06b6d4",
  };
  const color = colorMap[category] ?? "#6b7280";
  return (
    <span
      className="inline-block text-[11px] px-2.5 py-0.5 rounded-lg font-semibold uppercase tracking-wide"
      style={{ background: `${color}22`, color }}
    >
      {category}
    </span>
  );
}

function getEquivalent(
  s: SlangEntry
): { gen: string; text: string } | null {
  if (s.generation === "gen-alpha") {
    const text = GEN_X_MAP[s.id];
    return text ? { gen: "Gen X", text } : null;
  }
  if (s.generation === "gen-x" && s.equivalents?.genAlpha) {
    return { gen: "Gen Alpha", text: s.equivalents.genAlpha };
  }
  return null;
}

// ─── Dictionary tab ──────────────────────────────────────────────────────────

function SlangCard({
  slang,
  onClick,
}: {
  slang: SlangEntry;
  onClick: (s: SlangEntry) => void;
}) {
  const eq = getEquivalent(slang);
  const vs = slang.vibeScore ?? slang.vibe_score ?? 0;

  return (
    <Card
      className="cursor-pointer hover:border-accent/50 transition-colors"
      onClick={() => onClick(slang)}
    >
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <span className="text-[1.2rem] font-extrabold leading-tight">
            {slang.term}
          </span>
          <div className="flex gap-1.5 items-center flex-wrap">
            <GenBadge gen={slang.generation} />
            <CategoryBadge category={slang.category} />
          </div>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {slang.definition}
        </p>
        <p className="italic text-muted-foreground text-[13px] bg-white/[0.03] px-3 py-2 rounded-lg">
          &ldquo;{slang.example}&rdquo;
        </p>
        <VibeBar score={vs} />
        <p className="text-[11px] text-muted-foreground">
          {slang.origin} · {slang.era}
        </p>
        {slang.aliases.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {slang.aliases.map((a) => (
              <span
                key={a}
                className="text-[11px] px-2 py-0.5 bg-white/[0.06] rounded-md text-muted-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        {eq && (
          <div
            className={`text-[12px] px-3 py-2.5 rounded-r-lg mt-2 ${
              slang.generation === "gen-alpha"
                ? "bg-amber-500/[0.08] border-l-[3px] border-amber-500 text-amber-300"
                : "bg-violet-500/[0.08] border-l-[3px] border-violet-500 text-violet-300"
            }`}
          >
            {eq.gen} equivalent:{" "}
            <strong className="font-bold">{eq.text}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SlangDetailModal({
  slang,
  onClose,
}: {
  slang: SlangEntry;
  onClose: () => void;
}) {
  const eq = getEquivalent(slang);
  const vs = slang.vibeScore ?? slang.vibe_score ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass max-w-md w-full rounded-2xl p-6 space-y-3 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg leading-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="font-heading text-2xl text-accent">{slang.term}</h2>
        <div className="flex gap-1.5 flex-wrap">
          <GenBadge gen={slang.generation} />
          <CategoryBadge category={slang.category} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {slang.definition}
        </p>
        <p className="italic text-muted-foreground text-[13px] bg-white/[0.03] px-3 py-2 rounded-lg">
          &ldquo;{slang.example}&rdquo;
        </p>
        <VibeBar score={vs} />
        <p className="text-[11px] text-muted-foreground">{slang.origin}</p>
        <p className="text-[11px] text-muted-foreground">{slang.era}</p>
        {slang.aliases.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {slang.aliases.map((a) => (
              <span
                key={a}
                className="text-[11px] px-2 py-0.5 bg-white/[0.06] rounded-md text-muted-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        {eq && (
          <div
            className={`text-[12px] px-3 py-2.5 rounded-r-lg ${
              slang.generation === "gen-alpha"
                ? "bg-amber-500/[0.08] border-l-[3px] border-amber-500 text-amber-300"
                : "bg-violet-500/[0.08] border-l-[3px] border-violet-500 text-violet-300"
            }`}
          >
            {eq.gen} equivalent:{" "}
            <strong className="font-bold">{eq.text}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function DictionaryTab({ allSlang }: { allSlang: SlangEntry[] }) {
  const [search, setSearch] = useState("");
  const [genFilter, setGenFilter] = useState<GenerationFilter>("all");
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<SlangEntry | null>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(allSlang.map((s) => s.category).filter(Boolean)))],
    [allSlang]
  );

  const filtered = useMemo(() => {
    let r = allSlang;
    if (genFilter !== "all") r = r.filter((s) => s.generation === genFilter);
    if (catFilter !== "all") r = r.filter((s) => s.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (s) =>
          s.term.toLowerCase().includes(q) ||
          s.definition.toLowerCase().includes(q) ||
          s.aliases.some((a) => a.toLowerCase().includes(q))
      );
    }
    return r;
  }, [allSlang, genFilter, catFilter, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search slang terms, definitions, aliases…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-lg"
      />

      {/* Generation filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "gen-alpha", "gen-x"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGenFilter(g)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              genFilter === g
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted-foreground hover:border-accent/50"
            }`}
          >
            {g === "all" ? "All Generations" : g === "gen-alpha" ? "Gen Alpha" : "Gen X"}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${
              catFilter === c
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted-foreground hover:border-accent/50"
            }`}
          >
            {c === "all" ? "All Categories" : c}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} term{filtered.length !== 1 ? "s" : ""} found
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No slang found for that filter combo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SlangCard key={`${s.generation}-${s.id}`} slang={s} onClick={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <SlangDetailModal slang={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Translator tab ───────────────────────────────────────────────────────────

function applyTranslationMap(
  text: string,
  map: Record<string, string>,
  color: string
): string {
  const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  // Escape HTML entities first
  let result = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let found = false;
  for (const [term, equiv] of sorted) {
    const re = new RegExp(
      `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    if (re.test(result)) {
      found = true;
      result = result.replace(
        re,
        `<strong style="color:${color};" title="${equiv.replace(/"/g, "&quot;")}">${equiv}</strong>`
      );
    }
  }
  return found ? result : "";
}

function TranslatorTab({ allSlang }: { allSlang: SlangEntry[] }) {
  const [direction, setDirection] = useState<"alpha-to-x" | "x-to-alpha">(
    "alpha-to-x"
  );
  const [input, setInput] = useState("");

  const isA2X = direction === "alpha-to-x";

  const translationMap = useMemo(() => {
    if (isA2X) {
      const genAlpha = allSlang.filter((s) => s.generation === "gen-alpha");
      const map: Record<string, string> = {};
      for (const s of genAlpha) {
        const eq = GEN_X_MAP[s.id];
        if (eq) {
          map[s.term.toLowerCase()] = eq;
          for (const a of s.aliases) {
            if (a) map[a.toLowerCase()] = eq;
          }
        }
      }
      return map;
    } else {
      const genX = allSlang.filter((s) => s.generation === "gen-x");
      const map: Record<string, string> = {};
      for (const s of genX) {
        if (s.equivalents?.genAlpha) {
          map[s.term.toLowerCase()] = s.equivalents.genAlpha;
          for (const a of s.aliases) {
            if (a) map[a.toLowerCase()] = s.equivalents.genAlpha;
          }
        }
      }
      return map;
    }
  }, [allSlang, isA2X]);

  const translatedHtml = useMemo(() => {
    if (!input.trim()) return "";
    return applyTranslationMap(
      input,
      translationMap,
      isA2X ? "#fbbf24" : "#a78bfa"
    );
  }, [input, translationMap, isA2X]);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-semibold ${isA2X ? "text-violet-300" : "text-amber-300"}`}
        >
          {isA2X ? "Gen Alpha" : "Gen X"} →
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDirection(isA2X ? "x-to-alpha" : "alpha-to-x");
            setInput("");
          }}
          title="Swap direction"
          className="px-3"
        >
          ⇄ Swap
        </Button>
        <span
          className={`text-sm font-semibold ${isA2X ? "text-amber-300" : "text-violet-300"}`}
        >
          {isA2X ? "Gen X" : "Gen Alpha"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input panel */}
        <div className="glass rounded-xl p-4 space-y-2">
          <p
            className={`text-sm font-bold ${isA2X ? "text-violet-300" : "text-amber-300"}`}
          >
            {isA2X ? "Gen Alpha" : "Gen X"}
          </p>
          <textarea
            className="w-full min-h-[160px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-y outline-none border border-border rounded-lg p-3 focus:border-accent transition-colors font-sans"
            placeholder={`Type or paste ${isA2X ? "Gen Alpha" : "Gen X"} slang here…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Output panel */}
        <div className="glass rounded-xl p-4 space-y-2">
          <p
            className={`text-sm font-bold ${isA2X ? "text-amber-300" : "text-violet-300"}`}
          >
            {isA2X ? "Gen X" : "Gen Alpha"}
          </p>
          <div className="min-h-[160px] text-sm leading-relaxed">
            {!input.trim() ? (
              <span className="text-muted-foreground">
                Translation appears here…
              </span>
            ) : translatedHtml ? (
              <span
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: translatedHtml }}
              />
            ) : (
              <span className="text-muted-foreground">
                No recognized slang terms found. Try typing some slang!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compare tab ──────────────────────────────────────────────────────────────

function CompareTab({ allSlang }: { allSlang: SlangEntry[] }) {
  const pairs = useMemo(() => {
    const genAlpha = allSlang.filter((s) => s.generation === "gen-alpha");
    const genX = allSlang.filter((s) => s.generation === "gen-x");
    const result = [];
    for (const [alphaId, xText] of Object.entries(GEN_X_MAP)) {
      const alphaEntry = genAlpha.find((s) => s.id === alphaId);
      if (!alphaEntry) continue;
      const xTerms = xText.split("/").map((t) => t.trim().toLowerCase());
      const xEntry = genX.find((s) =>
        xTerms.some((t) => s.term.toLowerCase().includes(t))
      );
      result.push({ alpha: alphaEntry, xText, xEntry });
    }
    return result;
  }, [allSlang]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Side-by-side view of how the same concepts are expressed across
        generations.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pairs.map((p) => {
          const alphaVs = p.alpha.vibeScore ?? p.alpha.vibe_score ?? 0;
          const xVs = p.xEntry
            ? (p.xEntry.vibeScore ?? p.xEntry.vibe_score ?? 0)
            : 0;
          return (
            <div
              key={p.alpha.id}
              className="grid grid-cols-[1fr_auto_1fr] gap-3 items-stretch"
            >
              {/* Gen Alpha card */}
              <div className="glass rounded-xl p-3 border-t-[3px] border-violet-500 space-y-1">
                <GenBadge gen="gen-alpha" />
                <p className="text-sm font-extrabold mt-1">{p.alpha.term}</p>
                <p className="text-[12px] text-muted-foreground line-clamp-2">
                  {p.alpha.definition}
                </p>
                <VibeBar score={alphaVs} />
              </div>

              {/* Arrow */}
              <div className="flex items-center text-muted-foreground text-lg">
                ↔
              </div>

              {/* Gen X card */}
              <div className="glass rounded-xl p-3 border-t-[3px] border-amber-500 space-y-1">
                <GenBadge gen="gen-x" />
                <p className="text-sm font-extrabold mt-1">
                  {p.xEntry ? p.xEntry.term : p.xText}
                </p>
                <p className="text-[12px] text-muted-foreground line-clamp-2">
                  {p.xEntry ? p.xEntry.definition : "Classic Gen X expression"}
                </p>
                {p.xEntry && <VibeBar score={xVs} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quiz tab ─────────────────────────────────────────────────────────────────

function buildQuiz(allSlang: SlangEntry[]): QuizQuestion[] {
  const genAlpha = allSlang.filter(
    (s) => s.generation === "gen-alpha" && GEN_X_MAP[s.id]
  );
  const genX = allSlang.filter(
    (s) => s.generation === "gen-x" && s.equivalents?.genAlpha
  );
  const pool: QuizQuestion[] = [];

  const shuffle = <T,>(arr: T[]): T[] =>
    [...arr].sort(() => Math.random() - 0.5);

  // Alpha → X questions
  for (const s of shuffle(genAlpha).slice(0, 5)) {
    const correct = GEN_X_MAP[s.id];
    const wrongs = shuffle(
      Object.values(GEN_X_MAP).filter((v) => v !== correct)
    ).slice(0, 3);
    pool.push({
      question: `What's the Gen X equivalent of "${s.term}"?`,
      correct,
      options: shuffle([correct, ...wrongs]),
      badge: "gen-alpha",
    });
  }

  // X → Alpha questions
  for (const s of shuffle(genX).slice(0, 5)) {
    const correct = s.equivalents!.genAlpha!;
    const others = genX
      .filter((x) => x.id !== s.id && x.equivalents?.genAlpha)
      .map((x) => x.equivalents!.genAlpha!);
    const fallbacks = [
      "Skibidi",
      "Rizz",
      "Bussin",
      "No Cap",
      "Sus",
      "Slay",
    ].filter((f) => f !== correct);
    const wrongs = shuffle([...others, ...fallbacks])
      .filter((v) => v !== correct)
      .slice(0, 3);
    if (wrongs.length < 3) continue;
    pool.push({
      question: `What's the Gen Alpha equivalent of "${s.term}"?`,
      correct,
      options: shuffle([correct, ...wrongs]),
      badge: "gen-x",
    });
  }

  return shuffle(pool).slice(0, 10);
}

function QuizTab({ allSlang }: { allSlang: SlangEntry[] }) {
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  const startQuiz = useCallback(() => {
    const questions = buildQuiz(allSlang);
    if (questions.length === 0) return;
    setQuiz({ questions, current: 0, score: 0, answered: [], done: false });
  }, [allSlang]);

  if (!quiz) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground text-sm">
          Test your cross-generational slang knowledge. 10 questions mixing
          both directions.
        </p>
        <Button onClick={startQuiz}>Start Quiz</Button>
      </div>
    );
  }

  if (quiz.done) {
    const pct = Math.round((quiz.score / quiz.questions.length) * 100);
    let title: string;
    let msg: string;
    if (pct >= 80) {
      title = "Cross-Gen Master";
      msg = "You speak both generations fluently. Impressive range.";
    } else if (pct >= 60) {
      title = "Bilingual Vibes";
      msg = "Solid knowledge across generations. Almost there.";
    } else if (pct >= 40) {
      title = "Getting There";
      msg = "You know your own generation but need to study the other.";
    } else {
      title = "Generation Gap";
      msg = "Time to brush up on both eras of slang!";
    }
    const barColor = pct >= 60 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-4">
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center">
          {quiz.answered.map((correct, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                correct ? "bg-green-500" : "bg-red-500"
              }`}
            />
          ))}
        </div>
        <h2 className="font-heading text-2xl text-accent mt-6">{title}</h2>
        <div className="text-5xl font-black">
          {quiz.score}/{quiz.questions.length}
        </div>
        <p className="text-muted-foreground text-sm">{msg}</p>
        <div className="h-2 bg-muted rounded-full overflow-hidden mx-auto max-w-xs">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <Button onClick={startQuiz}>Try Again</Button>
      </div>
    );
  }

  const curr = quiz.questions[quiz.current];
  const hasAnswered = quiz.answered.length > quiz.current;

  function handleAnswer(picked: string) {
    if (hasAnswered) return;
    const correct = picked === curr.correct;
    setQuiz((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        score: correct ? prev.score + 1 : prev.score,
        answered: [...prev.answered, correct],
        lastPick: picked,
      };
    });
  }

  function handleNext() {
    setQuiz((prev) => {
      if (!prev) return prev;
      const next = prev.current + 1;
      return {
        ...prev,
        current: next,
        done: next >= prev.questions.length,
        lastPick: undefined,
      };
    });
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 py-4">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {quiz.questions.map((_, i) => {
          let cls =
            "w-2.5 h-2.5 rounded-full transition-colors ";
          if (i < quiz.answered.length)
            cls += quiz.answered[i] ? "bg-green-500" : "bg-red-500";
          else if (i === quiz.current)
            cls += "bg-accent shadow-[0_0_8px_var(--accent)]";
          else cls += "bg-muted";
          return <div key={i} className={cls} />;
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Question {quiz.current + 1} of {quiz.questions.length}
      </p>

      <div className="flex justify-center">
        <GenBadge gen={curr.badge} />
      </div>

      <p className="text-center font-heading text-lg font-bold">
        {curr.question}
      </p>

      <div className="space-y-2">
        {curr.options.map((opt) => {
          let cls =
            "w-full px-4 py-3 rounded-xl border text-sm text-left transition-all ";
          if (hasAnswered) {
            if (opt === curr.correct) cls += "border-green-500 bg-green-500/15";
            else if (opt === quiz.lastPick)
              cls += "border-red-500 bg-red-500/15";
            else cls += "border-border text-muted-foreground";
          } else {
            cls += "border-border bg-card hover:border-accent cursor-pointer";
          }
          return (
            <button
              key={opt}
              className={cls}
              onClick={() => handleAnswer(opt)}
              disabled={hasAnswered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div className="text-center">
          <Button onClick={handleNext}>
            {quiz.current < quiz.questions.length - 1 ? "Next" : "See Results"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────

interface SlangAppProps {
  allSlang: SlangEntry[];
}

export function SlangApp({ allSlang }: SlangAppProps) {
  return (
    <Tabs defaultValue="dictionary" className="space-y-4">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="dictionary">Dictionary</TabsTrigger>
        <TabsTrigger value="translator">Translator</TabsTrigger>
        <TabsTrigger value="compare">Compare</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
      </TabsList>

      <TabsContent value="dictionary">
        <DictionaryTab allSlang={allSlang} />
      </TabsContent>

      <TabsContent value="translator">
        <TranslatorTab allSlang={allSlang} />
      </TabsContent>

      <TabsContent value="compare">
        <CompareTab allSlang={allSlang} />
      </TabsContent>

      <TabsContent value="quiz">
        <QuizTab allSlang={allSlang} />
      </TabsContent>
    </Tabs>
  );
}
