"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  Dialog,
  DialogContent,
  DialogTitle,
  Textarea,
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
  if (score >= 8) return "var(--color-green)";
  if (score >= 6) return "var(--color-yellow)";
  return "var(--color-red)";
}

function VibeBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  const t = useTranslations("slang-translator.vibe");
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[11px] text-muted-foreground">{t("label")}</span>
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
  const t = useTranslations("slang-translator.badges");
  return gen === "gen-alpha" ? (
    <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wide bg-pill-8/15 text-pill-8">
      {t("genAlpha")}
    </span>
  ) : (
    <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wide bg-accent/15 text-accent">
      {t("genX")}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    compliment: "var(--color-green)",
    Approval: "var(--color-green)",
    insult: "var(--color-red)",
    Insult: "var(--color-red)",
    reaction: "var(--color-yellow)",
    Reaction: "var(--color-yellow)",
    lifestyle: "var(--color-pill-8)",
    Lifestyle: "var(--color-pill-8)",
    "internet culture": "var(--color-pill-7)",
    "Internet Culture": "var(--color-pill-6)",
    Disapproval: "var(--color-orange)",
    Greeting: "var(--color-pill-7)",
  };
  const color = colorMap[category] ?? "var(--color-slate-dim)";
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
  s: SlangEntry,
  labels: { genAlpha: string; genX: string },
): { gen: string; text: string } | null {
  if (s.generation === "gen-alpha") {
    const text = GEN_X_MAP[s.id];
    return text ? { gen: labels.genX, text } : null;
  }
  if (s.generation === "gen-x" && s.equivalents?.genAlpha) {
    return { gen: labels.genAlpha, text: s.equivalents.genAlpha };
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
  const tBadges = useTranslations("slang-translator.badges");
  const tDict = useTranslations("slang-translator.dictionary");
  const eq = getEquivalent(slang, {
    genAlpha: tBadges("genAlpha"),
    genX: tBadges("genX"),
  });
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
                ? "bg-accent/[0.08] border-l-[3px] border-accent text-accent"
                : "bg-pill-8/[0.08] border-l-[3px] border-pill-8 text-pill-8"
            }`}
          >
            {tDict("equivalentLabel", { gen: eq.gen })}{" "}
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
  slang: SlangEntry | null;
  onClose: () => void;
}) {
  const tBadges = useTranslations("slang-translator.badges");
  const tDict = useTranslations("slang-translator.dictionary");
  if (!slang) return null;
  const eq = getEquivalent(slang, {
    genAlpha: tBadges("genAlpha"),
    genX: tBadges("genX"),
  });
  const vs = slang.vibeScore ?? slang.vibe_score ?? 0;

  return (
    <Dialog open={!!slang} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass max-w-md space-y-3">
        <DialogTitle className="font-heading text-2xl text-accent">
          {slang.term}
        </DialogTitle>
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
                ? "bg-accent/[0.08] border-l-[3px] border-accent text-accent"
                : "bg-pill-8/[0.08] border-l-[3px] border-pill-8 text-pill-8"
            }`}
          >
            {tDict("equivalentLabel", { gen: eq.gen })}{" "}
            <strong className="font-bold">{eq.text}</strong>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DictionaryTab({ allSlang }: { allSlang: SlangEntry[] }) {
  const t = useTranslations("slang-translator.dictionary");
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

  const genLabel = (g: "all" | "gen-alpha" | "gen-x") =>
    g === "all"
      ? t("filterAllGenerations")
      : g === "gen-alpha"
        ? t("filterGenAlpha")
        : t("filterGenX");

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-lg"
      />

      {/* Generation filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "gen-alpha", "gen-x"] as const).map((g) => (
          <Button
            key={g}
            variant="outline"
            size="sm"
            onClick={() => setGenFilter(g)}
            className={`rounded-full text-xs ${
              genFilter === g ? "border-accent bg-accent/15 text-accent" : ""
            }`}
          >
            {genLabel(g)}
          </Button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((c) => (
          <Button
            key={c}
            variant="outline"
            size="sm"
            onClick={() => setCatFilter(c)}
            className={`rounded-lg capitalize text-xs ${
              catFilter === c ? "border-accent bg-accent/15 text-accent" : ""
            }`}
          >
            {c === "all" ? t("filterAllCategories") : c}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {t(filtered.length === 1 ? "termsFoundSingular" : "termsFoundPlural", {
          count: filtered.length,
        })}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t("emptyState")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SlangCard key={`${s.generation}-${s.id}`} slang={s} onClick={setSelected} />
          ))}
        </div>
      )}

      <SlangDetailModal slang={selected} onClose={() => setSelected(null)} />
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
  const t = useTranslations("slang-translator.translator");
  const tBadges = useTranslations("slang-translator.badges");
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
      isA2X ? "var(--color-accent-400)" : "var(--color-neon-violet)"
    );
  }, [input, translationMap, isA2X]);

  const fromLabel = isA2X ? tBadges("genAlpha") : tBadges("genX");
  const toLabel = isA2X ? tBadges("genX") : tBadges("genAlpha");

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-semibold ${isA2X ? "text-pill-8" : "text-accent"}`}
        >
          {fromLabel} →
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDirection(isA2X ? "x-to-alpha" : "alpha-to-x");
            setInput("");
          }}
          title={t("swapTitle")}
          className="px-3"
        >
          {t("swap")}
        </Button>
        <span
          className={`text-sm font-semibold ${isA2X ? "text-accent" : "text-pill-8"}`}
        >
          {toLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input panel */}
        <div className="glass rounded-xl p-4 space-y-2">
          <p
            className={`text-sm font-bold ${isA2X ? "text-pill-8" : "text-accent"}`}
          >
            {fromLabel}
          </p>
          <Textarea
            className="min-h-[160px] bg-transparent resize-y font-sans"
            placeholder={isA2X ? t("inputPlaceholderAlpha") : t("inputPlaceholderX")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Output panel */}
        <div className="glass rounded-xl p-4 space-y-2">
          <p
            className={`text-sm font-bold ${isA2X ? "text-accent" : "text-pill-8"}`}
          >
            {toLabel}
          </p>
          <div className="min-h-[160px] text-sm leading-relaxed">
            {!input.trim() ? (
              <span className="text-muted-foreground">
                {t("outputPlaceholder")}
              </span>
            ) : translatedHtml ? (
              <span
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: translatedHtml }}
              />
            ) : (
              <span className="text-muted-foreground">
                {t("noMatches")}
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
  const t = useTranslations("slang-translator.compare");
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
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
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
              <div className="glass rounded-xl p-3 border-t-[3px] border-pill-8 space-y-1">
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
              <div className="glass rounded-xl p-3 border-t-[3px] border-accent space-y-1">
                <GenBadge gen="gen-x" />
                <p className="text-sm font-extrabold mt-1">
                  {p.xEntry ? p.xEntry.term : p.xText}
                </p>
                <p className="text-[12px] text-muted-foreground line-clamp-2">
                  {p.xEntry ? p.xEntry.definition : t("fallbackXDefinition")}
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

function buildQuiz(
  allSlang: SlangEntry[],
  templates: { questionAlpha: (term: string) => string; questionX: (term: string) => string },
): QuizQuestion[] {
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
      question: templates.questionAlpha(s.term),
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
      question: templates.questionX(s.term),
      correct,
      options: shuffle([correct, ...wrongs]),
      badge: "gen-x",
    });
  }

  return shuffle(pool).slice(0, 10);
}

function QuizTab({ allSlang }: { allSlang: SlangEntry[] }) {
  const t = useTranslations("slang-translator.quiz");
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  const startQuiz = useCallback(() => {
    const questions = buildQuiz(allSlang, {
      questionAlpha: (term) => t("questionAlpha", { term }),
      questionX: (term) => t("questionX", { term }),
    });
    if (questions.length === 0) return;
    setQuiz({ questions, current: 0, score: 0, answered: [], done: false });
  }, [allSlang, t]);

  if (!quiz) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
        <Button onClick={startQuiz}>{t("start")}</Button>
      </div>
    );
  }

  if (quiz.done) {
    const pct = Math.round((quiz.score / quiz.questions.length) * 100);
    let title: string;
    let msg: string;
    if (pct >= 80) {
      title = t("resultMasterTitle");
      msg = t("resultMasterMsg");
    } else if (pct >= 60) {
      title = t("resultBilingualTitle");
      msg = t("resultBilingualMsg");
    } else if (pct >= 40) {
      title = t("resultGettingThereTitle");
      msg = t("resultGettingThereMsg");
    } else {
      title = t("resultGapTitle");
      msg = t("resultGapMsg");
    }
    const barColor = pct >= 60 ? "var(--color-green)" : pct >= 40 ? "var(--color-yellow)" : "var(--color-red)";
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-4">
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center">
          {quiz.answered.map((correct, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                correct ? "bg-green" : "bg-red"
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
        <Button onClick={startQuiz}>{t("tryAgain")}</Button>
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
            cls += quiz.answered[i] ? "bg-green" : "bg-red";
          else if (i === quiz.current)
            cls += "bg-accent shadow-[0_0_8px_var(--accent)]";
          else cls += "bg-muted";
          return <div key={i} className={cls} />;
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("questionProgress", {
          current: quiz.current + 1,
          total: quiz.questions.length,
        })}
      </p>

      <div className="flex justify-center">
        <GenBadge gen={curr.badge} />
      </div>

      <p className="text-center font-heading text-lg font-bold">
        {curr.question}
      </p>

      <div className="space-y-2">
        {curr.options.map((opt) => (
          <Button
            key={opt}
            variant="outline"
            className={[
              "w-full justify-start h-auto px-4 py-3 text-sm text-left whitespace-normal",
              hasAnswered && opt === curr.correct ? "border-green bg-green/15 hover:bg-green/15" : "",
              hasAnswered && opt === quiz.lastPick && opt !== curr.correct ? "border-red bg-red/15 hover:bg-red/15" : "",
              hasAnswered && opt !== curr.correct && opt !== quiz.lastPick ? "text-muted-foreground opacity-70" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => handleAnswer(opt)}
            disabled={hasAnswered}
          >
            {opt}
          </Button>
        ))}
      </div>

      {hasAnswered && (
        <div className="text-center">
          <Button onClick={handleNext}>
            {quiz.current < quiz.questions.length - 1 ? t("next") : t("seeResults")}
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
  const t = useTranslations("slang-translator.app");
  return (
    <Tabs defaultValue="dictionary" className="space-y-4">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="dictionary">{t("tabDictionary")}</TabsTrigger>
        <TabsTrigger value="translator">{t("tabTranslator")}</TabsTrigger>
        <TabsTrigger value="compare">{t("tabCompare")}</TabsTrigger>
        <TabsTrigger value="quiz">{t("tabQuiz")}</TabsTrigger>
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
