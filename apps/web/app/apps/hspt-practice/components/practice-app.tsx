"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SECTIONS } from "../lib/sections";
import type {
  AppState,
  AnswerLetter,
  HSPTData,
  Question,
  Session,
  SectionId,
} from "../lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getQuestions(data: HSPTData, sectionKey: SectionId): Question[] {
  const cfg = SECTIONS[sectionKey];
  if (sectionKey === "reading") {
    const shuffled = shuffle(data.passages);
    const qs: Question[] = [];
    for (const p of shuffled) {
      if (qs.length >= cfg.count) break;
      for (const q of p.questions) {
        qs.push({
          ...q,
          _passageId: p.id,
          _passageTitle: p.title,
          _passageText: p.text,
        });
      }
    }
    return qs.slice(0, cfg.count);
  }
  return shuffle(data[sectionKey as Exclude<SectionId, "reading">]).slice(
    0,
    cfg.count
  );
}

function loadSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem("hspt_sessions") || "[]");
  } catch {
    return [];
  }
}

function persistSession(session: Session) {
  const existing = loadSessions();
  const updated = [session, ...existing].slice(0, 50);
  try {
    localStorage.setItem("hspt_sessions", JSON.stringify(updated));
  } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionMenu({
  sessions,
  onStart,
  onHistory,
}: {
  sessions: Session[];
  onStart: (key: SectionId) => void;
  onHistory: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Choose a Section
        </h2>
        <p className="text-muted-foreground text-sm">
          Select a section to start a timed practice exam
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {(Object.entries(SECTIONS) as [SectionId, (typeof SECTIONS)[SectionId]][]).map(
          ([key, cfg]) => (
            <button
              key={key}
              onClick={() => onStart(key)}
              className="text-left group"
            >
              <Card className="h-full bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group-focus-visible:ring-2 group-focus-visible:ring-white/40">
                <CardContent className="p-5">
                  <div className="text-3xl mb-2">{cfg.icon}</div>
                  <h3 className={`font-semibold text-lg mb-1 ${cfg.color}`}>
                    {cfg.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-3">
                    {cfg.count} questions · {cfg.time} minutes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cfg.types.slice(0, 4).map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="text-[10px] border-white/20 text-muted-foreground"
                      >
                        {t}
                      </Badge>
                    ))}
                    {cfg.types.length > 4 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-white/20 text-muted-foreground"
                      >
                        +{cfg.types.length - 4}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Recent Sessions</h3>
        {sessions.length > 0 && (
          <Button variant="outline" size="sm" onClick={onHistory}>
            View All
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-10 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-muted-foreground text-sm">
              No practice sessions yet — start your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 5).map((s) => {
            const cfg = SECTIONS[s.section];
            const pctColor =
              s.percentage >= 80
                ? "text-green-400"
                : s.percentage >= 60
                  ? "text-amber-400"
                  : "text-red-400";
            return (
              <Card
                key={s.id}
                className="bg-white/5 border-white/10"
              >
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-foreground">
                      {cfg?.icon} {cfg?.name ?? s.section}
                    </span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`font-bold text-base ${pctColor}`}>
                    {s.percentage}%
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizView({
  questions,
  sectionKey,
  currentQ,
  answers,
  timeLeft,
  onAnswer,
  onPrev,
  onNext,
  onFinish,
  onNavigate,
}: {
  questions: Question[];
  sectionKey: SectionId;
  currentQ: number;
  answers: Record<number, AnswerLetter>;
  timeLeft: number;
  onAnswer: (letter: AnswerLetter) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onNavigate: (i: number) => void;
}) {
  const cfg = SECTIONS[sectionKey];
  const q = questions[currentQ];
  const letters: AnswerLetter[] = ["A", "B", "C", "D"];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isWarning = timeLeft < 60;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className={`font-bold text-lg ${cfg.color}`}>
          {cfg.icon} {cfg.name}
        </h2>
        <span
          className={`font-mono text-xl font-bold ${isWarning ? "text-red-400 animate-pulse" : "text-foreground"}`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        <span>
          Question {currentQ + 1} of {questions.length}
        </span>
        <span>{Object.keys(answers).length} answered</span>
      </div>

      {/* Reading passage */}
      {q._passageText && (
        <Card className="bg-white/5 border-white/10 mb-4">
          <CardContent className="p-4 max-h-56 overflow-y-auto">
            <p className="text-sm font-semibold text-foreground mb-2">
              {q._passageTitle ?? "Reading Passage"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {q._passageText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question card */}
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed mb-4">
            <strong>Q{currentQ + 1}.</strong> {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const letter = letters[i];
              const isSelected = answers[currentQ] === letter;
              return (
                <button
                  key={letter}
                  onClick={() => onAnswer(letter)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all
                    ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/15 text-foreground"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10 hover:text-foreground"
                    }
                  `}
                >
                  <strong className="text-foreground">{letter}.</strong> {opt}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={currentQ === 0}>
          ← Previous
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={onFinish}
          >
            Finish
          </Button>
          <Button size="sm" onClick={onNext}>
            {currentQ === questions.length - 1 ? "Finish →" : "Next →"}
          </Button>
        </div>
      </div>

      {/* Question navigator */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground mb-2 select-none">
          Question Navigator
        </summary>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`w-9 h-9 rounded text-[11px] border transition-all
                ${
                  i === currentQ
                    ? "ring-2 ring-indigo-400 border-indigo-400 text-foreground"
                    : answers[i] !== undefined
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-white/20 bg-white/5 text-muted-foreground hover:border-white/40"
                }
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

function ResultsView({
  session,
  questions,
  answers,
  onReview,
  onMenu,
}: {
  session: Session;
  questions: Question[];
  answers: Record<number, AnswerLetter>;
  onReview: () => void;
  onMenu: () => void;
}) {
  const cfg = SECTIONS[session.section];
  const timeM = Math.floor(session.time_spent / 60);
  const timeS = session.time_spent % 60;

  // Type breakdown
  const byType: Record<string, { correct: number; total: number }> = {};
  for (let i = 0; i < questions.length; i++) {
    const t = questions[i].type || "general";
    if (!byType[t]) byType[t] = { correct: 0, total: 0 };
    byType[t].total++;
    if (answers[i] === questions[i].answer) byType[t].correct++;
  }

  // Difficulty breakdown
  const byDiff: Record<number, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
  };
  for (let i = 0; i < questions.length; i++) {
    const d = questions[i].difficulty ?? 1;
    byDiff[d].total++;
    if (answers[i] === questions[i].answer) byDiff[d].correct++;
  }

  const pctColor =
    session.percentage >= 80
      ? "text-green-400 border-green-400"
      : session.percentage >= 60
        ? "text-amber-400 border-amber-400"
        : "text-red-400 border-red-400";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {cfg.icon} {cfg.name} — Results
        </h2>
        <div
          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center mx-auto mb-3 ${pctColor}`}
        >
          <span className="text-3xl font-bold">{session.percentage}%</span>
          <span className="text-xs text-muted-foreground">
            {session.score}/{session.total}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Completed in {timeM}m {timeS}s
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              By Question Type
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {Object.entries(byType).map(([t, v]) => (
              <div
                key={t}
                className="flex justify-between items-center py-1 border-b border-white/10 last:border-0 text-xs"
              >
                <Badge
                  variant="outline"
                  className="text-[10px] border-white/20 text-muted-foreground"
                >
                  {t}
                </Badge>
                <span className="text-muted-foreground">
                  {v.correct}/{v.total} (
                  {v.total ? Math.round((v.correct / v.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              By Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {([1, 2, 3] as const).filter((d) => byDiff[d].total > 0).map((d) => (
              <div
                key={d}
                className="flex justify-between items-center py-1 border-b border-white/10 last:border-0 text-xs"
              >
                <span className="text-muted-foreground">
                  {"⭐".repeat(d)} Level {d}
                </span>
                <span className="text-muted-foreground">
                  {byDiff[d].correct}/{byDiff[d].total} (
                  {byDiff[d].total
                    ? Math.round((byDiff[d].correct / byDiff[d].total) * 100)
                    : 0}
                  %)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={onReview}>📋 Review Answers</Button>
        <Button variant="outline" onClick={onMenu}>
          ← Back to Menu
        </Button>
      </div>
    </div>
  );
}

function ReviewView({
  questions,
  answers,
  currentQ,
  onPrev,
  onNext,
  onBack,
}: {
  questions: Question[];
  answers: Record<number, AnswerLetter>;
  currentQ: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const q = questions[currentQ];
  const letters: AnswerLetter[] = ["A", "B", "C", "D"];
  const userAns = answers[currentQ];
  const correct = q.answer;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">
          Review — Q{currentQ + 1}/{questions.length}
        </h2>
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Results
        </Button>
      </div>

      {q._passageText && (
        <Card className="bg-white/5 border-white/10 mb-4">
          <CardContent className="p-4 max-h-56 overflow-y-auto">
            <p className="text-sm font-semibold text-foreground mb-2">
              {q._passageTitle ?? "Reading Passage"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {q._passageText}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed mb-4">
            <strong>Q{currentQ + 1}.</strong> {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const letter = letters[i];
              let cls =
                "border-white/10 bg-white/5 text-muted-foreground cursor-default";
              if (letter === correct)
                cls =
                  "border-green-500 bg-green-500/15 text-foreground cursor-default";
              else if (letter === userAns && userAns !== correct)
                cls =
                  "border-red-500 bg-red-500/15 text-foreground cursor-default";
              return (
                <div
                  key={letter}
                  className={`px-4 py-3 rounded-lg border text-sm ${cls}`}
                >
                  <strong>{letter}.</strong> {opt}{" "}
                  {letter === correct && "✅"}
                  {letter === userAns && userAns !== correct && "❌"}
                </div>
              );
            })}
          </div>
          {q.explanation && (
            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground">
              <strong className="text-foreground">Explanation:</strong>{" "}
              {q.explanation}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={currentQ === 0}>
          ← Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={currentQ >= questions.length - 1}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

const SECTION_COLORS: Record<SectionId, string> = {
  verbal: "var(--color-accent)",
  quantitative: "var(--color-pill-1)",
  reading: "var(--color-green)",
  mathematics: "var(--color-pill-4)",
  language: "var(--color-pill-0)",
};

function HistoryView({
  sessions,
  onBack,
}: {
  sessions: Session[];
  onBack: () => void;
}) {
  // Build chart data — group by date, average % per section
  const bySectionReversed: Record<SectionId, Session[]> = {
    verbal: [],
    quantitative: [],
    reading: [],
    mathematics: [],
    language: [],
  };
  sessions.forEach((s) => bySectionReversed[s.section]?.push(s));

  // Build unified x-axis from all sessions (chronological)
  const allSorted = [...sessions].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const chartData = allSorted.map((s) => ({
    date: new Date(s.created_at).toLocaleDateString(),
    section: s.section,
    percentage: s.percentage,
  }));

  // For recharts: one entry per session, keyed by section
  const chartRows = allSorted.map((s) => {
    const row: Record<string, number | string> = {
      date: new Date(s.created_at).toLocaleDateString(),
    };
    row[s.section] = s.percentage;
    return row;
  });

  const activeSections = (
    Object.keys(bySectionReversed) as SectionId[]
  ).filter((k) => bySectionReversed[k].length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">📊 Session History</h2>
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      </div>

      {sessions.length > 0 && (
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--color-slate-dim)", fontSize: 11 }}
                  stroke="transparent"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--color-slate-dim)", fontSize: 11 }}
                  stroke="transparent"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-surface-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--color-slate)" }}
                  formatter={(value) =>
                    SECTIONS[value as SectionId]?.name ?? value
                  }
                />
                {activeSections.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={SECTION_COLORS[key]}
                    dot={{ r: 3 }}
                    strokeWidth={2}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-muted-foreground text-sm">
              No sessions yet — start practicing!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Section
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    %
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const cfg = SECTIONS[s.section];
                  const pct = s.percentage;
                  const pctCls =
                    pct >= 80
                      ? "text-green-400"
                      : pct >= 60
                        ? "text-amber-400"
                        : "text-red-400";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {cfg?.icon} {cfg?.name ?? s.section}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.score}/{s.total}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${pctCls}`}>{pct}%</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {Math.floor(s.time_spent / 60)}m {s.time_spent % 60}s
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function PracticeApp({ data }: { data: HSPTData }) {
  const [appState, setAppState] = useState<AppState>("menu");
  const [sectionKey, setSectionKey] = useState<SectionId>("verbal");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, AnswerLetter>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [startTime, setStartTime] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishQuiz = useCallback(
    (qs: Question[], ans: Record<number, AnswerLetter>, sect: SectionId, start: number) => {
      stopTimer();
      const timeSpent = Math.round((Date.now() - start) / 1000);
      const score = qs.reduce(
        (s, q, i) => s + (ans[i] === q.answer ? 1 : 0),
        0
      );
      const total = qs.length;
      const session: Session = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        section: sect,
        score,
        total,
        percentage: Math.round((score / total) * 100),
        time_spent: timeSpent,
        answers: ans,
      };
      setCurrentSession(session);
      setSessions((prev) => {
        const updated = [session, ...prev].slice(0, 50);
        try {
          localStorage.setItem("hspt_sessions", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setAppState("results");
    },
    [stopTimer]
  );

  const startQuiz = useCallback(
    (key: SectionId) => {
      stopTimer();
      const qs = getQuestions(data, key);
      const cfg = SECTIONS[key];
      const now = Date.now();
      setSectionKey(key);
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(cfg.time * 60);
      setStartTime(now);
      setAppState("quiz");

      let tl = cfg.time * 60;
      timerRef.current = setInterval(() => {
        tl--;
        setTimeLeft(tl);
        if (tl <= 0) {
          stopTimer();
          // Read the latest answers/qs from state via callback form
          setAnswers((currentAns) => {
            setQuestions((currentQs) => {
              finishQuiz(currentQs, currentAns, key, now);
              return currentQs;
            });
            return currentAns;
          });
        }
      }, 1000);
    },
    [data, stopTimer, finishQuiz]
  );

  // Cleanup timer on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  const handleAnswer = useCallback((letter: AnswerLetter) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: letter }));
  }, [currentQ]);

  const handleNext = useCallback(() => {
    if (currentQ >= questions.length - 1) {
      if (confirm("Finish this practice session?")) {
        finishQuiz(questions, answers, sectionKey, startTime);
      }
    } else {
      setCurrentQ((q) => q + 1);
    }
  }, [currentQ, questions, answers, sectionKey, startTime, finishQuiz]);

  const handleFinish = useCallback(() => {
    if (confirm("Finish this practice session?")) {
      finishQuiz(questions, answers, sectionKey, startTime);
    }
  }, [questions, answers, sectionKey, startTime, finishQuiz]);

  if (appState === "quiz") {
    return (
      <QuizView
        questions={questions}
        sectionKey={sectionKey}
        currentQ={currentQ}
        answers={answers}
        timeLeft={timeLeft}
        onAnswer={handleAnswer}
        onPrev={() => setCurrentQ((q) => Math.max(0, q - 1))}
        onNext={handleNext}
        onFinish={handleFinish}
        onNavigate={setCurrentQ}
      />
    );
  }

  if (appState === "results" && currentSession) {
    return (
      <ResultsView
        session={currentSession}
        questions={questions}
        answers={answers}
        onReview={() => { setCurrentQ(0); setAppState("review"); }}
        onMenu={() => setAppState("menu")}
      />
    );
  }

  if (appState === "review") {
    return (
      <ReviewView
        questions={questions}
        answers={answers}
        currentQ={currentQ}
        onPrev={() => setCurrentQ((q) => Math.max(0, q - 1))}
        onNext={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
        onBack={() => setAppState("results")}
      />
    );
  }

  if (appState === "history") {
    return (
      <HistoryView
        sessions={sessions}
        onBack={() => setAppState("menu")}
      />
    );
  }

  return (
    <SectionMenu
      sessions={sessions}
      onStart={startQuiz}
      onHistory={() => setAppState("history")}
    />
  );
}
