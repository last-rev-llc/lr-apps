"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  TutorQuestion,
  TopicStat,
  QuizAnswer,
  QuizRecord,
  QuizState,
  AppTab,
  SectionId,
} from "../lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_META: Record<
  SectionId,
  { label: string; emoji: string; color: string; strokeColor: string }
> = {
  verbal: {
    label: "Verbal",
    emoji: "📖",
    color: "text-amber-400",
    strokeColor: "#f59e0b",
  },
  quantitative: {
    label: "Quantitative",
    emoji: "🔢",
    color: "text-blue-400",
    strokeColor: "#3b82f6",
  },
  reading: {
    label: "Reading",
    emoji: "📚",
    color: "text-emerald-400",
    strokeColor: "#10b981",
  },
  math: {
    label: "Math",
    emoji: "➗",
    color: "text-red-400",
    strokeColor: "#ef4444",
  },
  language: {
    label: "Language",
    emoji: "✍️",
    color: "text-purple-400",
    strokeColor: "#a855f7",
  },
};

const SECTION_ORDER: SectionId[] = [
  "verbal",
  "quantitative",
  "reading",
  "math",
  "language",
];

const STORAGE_KEY = "hspt_tutor_quizzes";
const QUIZ_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadQuizHistory(): QuizRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQuizRecord(record: QuizRecord) {
  try {
    const existing = loadQuizHistory();
    const updated = [record, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function computeTopicStats(quizHistory: QuizRecord[]): Map<string, TopicStat> {
  const map = new Map<string, TopicStat>();
  for (const quiz of quizHistory) {
    for (const answer of quiz.answers) {
      const key = `${answer.section}/${answer.topic}`;
      const existing = map.get(key) ?? {
        section: answer.section,
        topic: answer.topic,
        correct: 0,
        total: 0,
        pct: 0,
      };
      existing.total++;
      if (answer.correct) existing.correct++;
      existing.pct =
        existing.total > 0
          ? Math.round((existing.correct / existing.total) * 100)
          : 0;
      map.set(key, existing);
    }
  }
  return map;
}

function getPctColor(pct: number): string {
  if (pct >= 75) return "text-emerald-400";
  if (pct >= 50) return "text-amber-400";
  return "text-red-400";
}

function getPctBorderColor(pct: number): string {
  if (pct >= 75) return "border-emerald-500";
  if (pct >= 50) return "border-amber-500";
  return "border-red-500";
}

function getPctBarColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getPctEmoji(pct: number): string {
  if (pct >= 75) return "🟢";
  if (pct >= 50) return "🟡";
  return "🔴";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildAdaptiveQuiz(
  allQuestions: TutorQuestion[],
  topicStats: Map<string, TopicStat>
): TutorQuestion[] {
  // Sort topic stats by pct ascending (weakest first)
  const sortedStats = [...topicStats.values()].sort((a, b) => a.pct - b.pct);
  const weakKeys = new Set(
    sortedStats.slice(0, 5).map((t) => `${t.section}/${t.topic}`)
  );

  // Prefer weak-area questions, fill up to QUIZ_SIZE from the rest
  const weakPool = shuffle(
    allQuestions.filter((q) => weakKeys.has(`${q.section}/${q.topic}`))
  );
  const otherPool = shuffle(
    allQuestions.filter((q) => !weakKeys.has(`${q.section}/${q.topic}`))
  );

  const combined = [...weakPool, ...otherPool];
  return combined.slice(0, QUIZ_SIZE);
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({
  pct,
  size = 64,
  strokeWidth = 6,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const colorClass = getPctColor(pct);

  // map text class to stroke color
  const strokeColor =
    pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
      <text
        x={cx}
        y={cx}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cx}px` }}
        className={`text-[13px] font-bold fill-current ${colorClass}`}
        fill={strokeColor}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 76 + 2;
      const y = 22 - (v / 100) * 20;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={80} height={24} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke="#10b981"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({
  topicStats,
  quizHistory,
  onStartQuiz,
}: {
  topicStats: Map<string, TopicStat>;
  quizHistory: QuizRecord[];
  onStartQuiz: () => void;
}) {
  // Compute overall
  let totalCorrect = 0;
  let totalAll = 0;
  for (const stat of topicStats.values()) {
    totalCorrect += stat.correct;
    totalAll += stat.total;
  }
  const overall =
    totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : null;

  const encourageMsg =
    overall === null
      ? "Take your first practice session to see your readiness!"
      : overall >= 85
        ? "You're crushing it! 🔥"
        : overall >= 70
          ? "Looking strong! Keep it up! 💪"
          : overall >= 50
            ? "Good progress — let's target those weak spots! 🎯"
            : "Every practice session makes you stronger! Let's go! 🚀";

  // Group stats by section
  const bySection = new Map<
    SectionId,
    { topics: TopicStat[]; correct: number; total: number }
  >();
  for (const stat of topicStats.values()) {
    const existing = bySection.get(stat.section) ?? {
      topics: [],
      correct: 0,
      total: 0,
    };
    existing.topics.push(stat);
    existing.correct += stat.correct;
    existing.total += stat.total;
    bySection.set(stat.section, existing);
  }

  return (
    <div>
      {/* Overall readiness */}
      <div className="text-center mb-8">
        {overall !== null ? (
          <>
            <div
              className={`text-6xl font-extrabold mb-1 ${getPctColor(overall)}`}
            >
              {overall}%
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              Overall Readiness
            </div>
            <div className="text-emerald-400 font-semibold text-sm">
              {encourageMsg}
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl font-extrabold mb-1 text-muted-foreground">
              --
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Overall Readiness
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {encourageMsg}
            </p>
            <Button onClick={onStartQuiz} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Start First Practice
            </Button>
          </>
        )}
      </div>

      {/* Section cards */}
      {bySection.size === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-10 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-muted-foreground text-sm">
              No data yet — practice to see section breakdowns!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTION_ORDER.filter((sec) => bySection.has(sec)).map((sec) => {
            const data = bySection.get(sec)!;
            const pct =
              data.total > 0
                ? Math.round((data.correct / data.total) * 100)
                : 0;
            const meta = SECTION_META[sec];
            const sortedTopics = [...data.topics].sort(
              (a, b) => a.pct - b.pct
            );
            return (
              <Card key={sec} className="bg-white/5 border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <ProgressRing pct={pct} />
                    <div>
                      <div className={`text-lg font-bold ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {data.correct}/{data.total} correct
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sortedTopics.map((t) => (
                      <div key={t.topic}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            {getPctEmoji(t.pct)} {t.topic}
                          </span>
                          <span className={getPctColor(t.pct)}>
                            {t.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getPctBarColor(t.pct)}`}
                            style={{ width: `${t.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent quizzes */}
      {quizHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-foreground text-sm mb-3">
            Recent Quizzes
          </h3>
          <div className="space-y-2">
            {quizHistory.slice(0, 5).map((quiz) => {
              const pct = Math.round((quiz.score / quiz.total) * 100);
              return (
                <Card key={quiz.id} className="bg-white/5 border-white/10">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-foreground">
                        {quiz.score}/{quiz.total} correct
                      </span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {quiz.date}
                      </span>
                    </div>
                    <span className={`font-bold text-sm ${getPctColor(pct)}`}>
                      {pct}%
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────

function QuizTab({
  allQuestions,
  topicStats,
  onComplete,
}: {
  allQuestions: TutorQuestion[];
  topicStats: Map<string, TopicStat>;
  onComplete: (record: QuizRecord) => void;
}) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [showResult, setShowResult] = useState<{
    score: number;
    total: number;
    breakdown: Record<string, { c: number; t: number }>;
  } | null>(null);

  const startQuiz = useCallback(() => {
    const questions = buildAdaptiveQuiz(allQuestions, topicStats);
    if (questions.length === 0) return;
    setQuizState({
      questions,
      current: 0,
      answers: [],
      answered: false,
    });
    setShowResult(null);
  }, [allQuestions, topicStats]);

  const selectAnswer = useCallback(
    (choice: string, q: TutorQuestion) => {
      if (!quizState || quizState.answered) return;
      const letter = choice.charAt(0);
      const isCorrect = letter === q.correct;
      const answer: QuizAnswer = {
        section: q.section,
        topic: q.topic,
        correct: isCorrect,
        userAnswer: letter,
        correctAnswer: q.correct,
      };
      setQuizState((prev) =>
        prev
          ? { ...prev, answers: [...prev.answers, answer], answered: true }
          : prev
      );
    },
    [quizState]
  );

  const nextQuestion = useCallback(() => {
    if (!quizState) return;
    if (quizState.current >= quizState.questions.length - 1) {
      // Finish
      const answers = quizState.answers;
      const score = answers.filter((a) => a.correct).length;
      const total = answers.length;

      const breakdown: Record<string, { c: number; t: number }> = {};
      for (const a of answers) {
        if (!breakdown[a.topic]) breakdown[a.topic] = { c: 0, t: 0 };
        breakdown[a.topic].t++;
        if (a.correct) breakdown[a.topic].c++;
      }

      const record: QuizRecord = {
        id: `quiz-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        score,
        total,
        topics: [...new Set(answers.map((a) => `${a.section}/${a.topic}`))],
        answers,
      };
      onComplete(record);
      setShowResult({ score, total, breakdown });
      setQuizState(null);
    } else {
      setQuizState((prev) =>
        prev
          ? { ...prev, current: prev.current + 1, answered: false }
          : prev
      );
    }
  }, [quizState, onComplete]);

  // ── Start screen ──
  if (!quizState && !showResult) {
    const hasData = topicStats.size > 0;
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div className="text-5xl mb-4">🧠</div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Ready to level up?
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {hasData
            ? `We'll pick ${QUIZ_SIZE} questions from your weakest areas. Let's crush it!`
            : `We'll pick ${QUIZ_SIZE} questions across all sections to get you started!`}
        </p>
        <Button
          onClick={startQuiz}
          disabled={allQuestions.length === 0}
          className="px-8 py-6 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Practice Weak Areas
        </Button>
      </div>
    );
  }

  // ── Results screen ──
  if (showResult) {
    const pct = Math.round((showResult.score / showResult.total) * 100);
    const emoji = pct >= 80 ? "🔥" : pct >= 60 ? "💪" : "📈";
    const msg =
      pct >= 80
        ? "Outstanding work!"
        : pct >= 60
          ? "Nice job! You're getting stronger!"
          : "Keep at it — you're learning every time!";
    return (
      <div className="max-w-lg mx-auto py-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{emoji}</div>
          <div className={`text-4xl font-extrabold mb-1 ${getPctColor(pct)}`}>
            {showResult.score}/{showResult.total}
          </div>
          <div className="text-muted-foreground text-sm">{msg}</div>
        </div>
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Topic Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {Object.entries(showResult.breakdown).map(([topic, d]) => {
              const p = d.t > 0 ? Math.round((d.c / d.t) * 100) : 0;
              return (
                <div key={topic}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {getPctEmoji(p)} {topic}
                    </span>
                    <span className={getPctColor(p)}>
                      {d.c}/{d.t}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getPctBarColor(p)}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <div className="text-center">
          <Button
            onClick={startQuiz}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Practice Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Active quiz ──
  if (!quizState) return null;
  const q = quizState.questions[quizState.current];
  const total = quizState.questions.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {quizState.questions.map((_, i) => {
          let cls = "h-1.5 rounded-full transition-all duration-200";
          if (i < quizState.current) {
            const a = quizState.answers[i];
            cls += a?.correct
              ? " bg-emerald-500 w-6"
              : " bg-red-500 w-6";
          } else if (i === quizState.current) {
            cls += " bg-emerald-400 w-8";
          } else {
            cls += " bg-white/20 w-6";
          }
          return <div key={i} className={cls} />;
        })}
      </div>

      {/* Question number & topic */}
      <div className="text-xs text-muted-foreground mb-2">
        Question {quizState.current + 1} of {total} &bull;{" "}
        <span className={SECTION_META[q.section]?.color ?? ""}>
          {SECTION_META[q.section]?.label ?? q.section}
        </span>{" "}
        → {q.topic}
      </div>

      {/* Question */}
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="p-5">
          <p className="text-base leading-relaxed font-medium text-foreground">
            {q.question}
          </p>
        </CardContent>
      </Card>

      {/* Choices */}
      <div className="space-y-2 mb-4">
        {q.choices.map((choice) => {
          const letter = choice.charAt(0);
          const isAnswered = quizState.answered;
          const isCorrect = letter === q.correct;
          const isSelected =
            isAnswered &&
            quizState.answers[quizState.answers.length - 1]?.userAnswer ===
              letter;

          let cls =
            "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all font-medium ";
          if (!isAnswered) {
            cls +=
              "border-white/10 bg-white/5 text-muted-foreground hover:border-emerald-500/50 hover:bg-white/10 hover:text-foreground cursor-pointer";
          } else if (isCorrect) {
            cls +=
              "border-emerald-500 bg-emerald-500/15 text-foreground cursor-default";
          } else if (isSelected && !isCorrect) {
            cls +=
              "border-red-500 bg-red-500/15 text-foreground cursor-default";
          } else {
            cls +=
              "border-white/10 bg-white/5 text-muted-foreground cursor-default opacity-60";
          }

          return (
            <button
              key={choice}
              className={cls}
              onClick={() => selectAnswer(choice, q)}
              disabled={isAnswered}
            >
              {choice}
              {isAnswered && isCorrect && (
                <span className="ml-2 text-emerald-400">✓</span>
              )}
              {isAnswered && isSelected && !isCorrect && (
                <span className="ml-2 text-red-400">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {quizState.answered && (
        <div
          className={`p-4 rounded-xl border text-sm mb-4 leading-relaxed ${
            quizState.answers[quizState.answers.length - 1]?.correct
              ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
              : "bg-red-500/10 border-red-500/40 text-foreground"
          }`}
        >
          {quizState.answers[quizState.answers.length - 1]?.correct ? (
            <>
              <strong className="text-emerald-400">Correct!</strong>{" "}
              {q.explanation}
            </>
          ) : (
            <>
              <strong className="text-red-400">Not quite.</strong> The answer
              is <strong>{q.correct}</strong>. {q.explanation}
            </>
          )}
        </div>
      )}

      {/* Next button */}
      {quizState.answered && (
        <Button
          onClick={nextQuestion}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {quizState.current === total - 1 ? "See Results 🎉" : "Next →"}
        </Button>
      )}
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────

function ProgressTab({
  topicStats,
  quizHistory,
}: {
  topicStats: Map<string, TopicStat>;
  quizHistory: QuizRecord[];
}) {
  // Mastery badges — topics at 85%+
  const mastered = [...topicStats.values()].filter((t) => t.pct >= 85);

  // Build topic history for sparklines
  const topicHistory = new Map<string, number[]>();
  for (const quiz of [...quizHistory].reverse()) {
    const quizTopics = new Map<string, { c: number; t: number }>();
    for (const a of quiz.answers) {
      const k = `${a.section}/${a.topic}`;
      const existing = quizTopics.get(k) ?? { c: 0, t: 0 };
      existing.t++;
      if (a.correct) existing.c++;
      quizTopics.set(k, existing);
    }
    for (const [k, v] of quizTopics.entries()) {
      const existing = topicHistory.get(k) ?? [];
      existing.push(Math.round((v.c / v.t) * 100));
      topicHistory.set(k, existing);
    }
  }

  // Topic trend rows sorted by pct ascending
  const sortedStats = [...topicStats.values()].sort((a, b) => a.pct - b.pct);

  // Build chart data from quiz history (overall score per quiz)
  const chartData = [...quizHistory]
    .reverse()
    .slice(-20)
    .map((q, i) => ({
      quiz: `#${i + 1}`,
      score: Math.round((q.score / q.total) * 100),
    }));

  return (
    <div className="space-y-6">
      {/* Mastery badges */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">🏅 Mastery Badges</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {mastered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Keep practicing to earn badges! (85%+ mastery required)
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mastered.map((t) => (
                <Badge
                  key={`${t.section}/${t.topic}`}
                  className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-xs font-semibold"
                >
                  🏅 {t.topic} ({t.pct}%)
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score trend chart */}
      {chartData.length >= 2 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📈 Score Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="quiz"
                  tick={{ fill: "#888", fontSize: 11 }}
                  stroke="transparent"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#888", fontSize: 11 }}
                  stroke="transparent"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Topic trends table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">📊 Topic Trends</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sortedStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Take some quizzes to see your progress!
            </p>
          ) : (
            <div className="space-y-0">
              {sortedStats.map((stat) => {
                const key = `${stat.section}/${stat.topic}`;
                const history = topicHistory.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground truncate block">
                        {getPctEmoji(stat.pct)}{" "}
                        <span className={SECTION_META[stat.section]?.color ?? ""}>
                          {SECTION_META[stat.section]?.label}
                        </span>{" "}
                        → {stat.topic}
                      </span>
                    </div>
                    {history.length >= 2 && <Sparkline values={history} />}
                    <span
                      className={`text-xs font-bold w-10 text-right ${getPctColor(stat.pct)}`}
                    >
                      {stat.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS: { id: AppTab; label: string }[] = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "quiz", label: "⚡ Practice" },
  { id: "progress", label: "📈 Progress" },
];

export function TutorApp({ questions }: { questions: TutorQuestion[] }) {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);
  const [topicStats, setTopicStats] = useState<Map<string, TopicStat>>(
    new Map()
  );

  // Load quiz history from localStorage on mount
  useEffect(() => {
    const history = loadQuizHistory();
    setQuizHistory(history);
    setTopicStats(computeTopicStats(history));
  }, []);

  const handleQuizComplete = useCallback((record: QuizRecord) => {
    saveQuizRecord(record);
    setQuizHistory((prev) => {
      const updated = [record, ...prev].slice(0, 100);
      setTopicStats(computeTopicStats(updated));
      return updated;
    });
  }, []);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white/15 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <DashboardTab
          topicStats={topicStats}
          quizHistory={quizHistory}
          onStartQuiz={() => setActiveTab("quiz")}
        />
      )}
      {activeTab === "quiz" && (
        <QuizTab
          allQuestions={questions}
          topicStats={topicStats}
          onComplete={handleQuizComplete}
        />
      )}
      {activeTab === "progress" && (
        <ProgressTab topicStats={topicStats} quizHistory={quizHistory} />
      )}
    </div>
  );
}
