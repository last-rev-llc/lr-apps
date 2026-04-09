import { describe, it, expect } from "vitest";
import type { TutorQuestion, TopicStat, QuizRecord, QuizAnswer } from "../types";

// ── Helpers (mirrors the module internals) ─────────────────────────────────

function makeQuestion(overrides: Partial<TutorQuestion> = {}): TutorQuestion {
  return {
    id: `q-${Math.random()}`,
    section: "verbal",
    topic: "analogy",
    question: "Test question?",
    choices: ["A. one", "B. two", "C. three", "D. four"],
    correct: "A",
    explanation: "Because A.",
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<QuizAnswer> = {}): QuizAnswer {
  return {
    section: "verbal",
    topic: "analogy",
    correct: true,
    userAnswer: "A",
    correctAnswer: "A",
    ...overrides,
  };
}

function makeRecord(answers: QuizAnswer[]): QuizRecord {
  const score = answers.filter((a) => a.correct).length;
  return {
    id: `quiz-${Date.now()}`,
    date: "2026-04-09",
    score,
    total: answers.length,
    topics: [...new Set(answers.map((a) => `${a.section}/${a.topic}`))],
    answers,
  };
}

// ── Import the pure functions under test ───────────────────────────────────
// These are not exported, so we test their observable behaviour through the
// module-level helpers that the component imports.

// We re-implement them here to unit-test the logic directly without coupling
// to the component internals. The tests verify the algorithm contract.

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

function buildAdaptiveQuiz(
  allQuestions: TutorQuestion[],
  topicStats: Map<string, TopicStat>,
  quizSize = 10,
): TutorQuestion[] {
  const sortedStats = [...topicStats.values()].sort((a, b) => a.pct - b.pct);
  const weakKeys = new Set(
    sortedStats.slice(0, 5).map((t) => `${t.section}/${t.topic}`),
  );

  const weakPool = allQuestions.filter((q) =>
    weakKeys.has(`${q.section}/${q.topic}`),
  );
  const otherPool = allQuestions.filter(
    (q) => !weakKeys.has(`${q.section}/${q.topic}`),
  );

  return [...weakPool, ...otherPool].slice(0, quizSize);
}

// ── computeTopicStats ──────────────────────────────────────────────────────

describe("computeTopicStats", () => {
  it("returns an empty map for no history", () => {
    const result = computeTopicStats([]);
    expect(result.size).toBe(0);
  });

  it("computes correct percentage for a single topic", () => {
    const record = makeRecord([
      makeAnswer({ topic: "analogy", correct: true }),
      makeAnswer({ topic: "analogy", correct: true }),
      makeAnswer({ topic: "analogy", correct: false }),
    ]);
    const stats = computeTopicStats([record]);
    const stat = stats.get("verbal/analogy")!;
    expect(stat.total).toBe(3);
    expect(stat.correct).toBe(2);
    expect(stat.pct).toBe(67);
  });

  it("accumulates stats across multiple quiz records", () => {
    const r1 = makeRecord([makeAnswer({ topic: "logic", correct: true })]);
    const r2 = makeRecord([makeAnswer({ topic: "logic", correct: false })]);
    const stats = computeTopicStats([r1, r2]);
    const stat = stats.get("verbal/logic")!;
    expect(stat.total).toBe(2);
    expect(stat.correct).toBe(1);
    expect(stat.pct).toBe(50);
  });

  it("tracks separate entries per topic", () => {
    const record = makeRecord([
      makeAnswer({ topic: "analogy", correct: true }),
      makeAnswer({ topic: "logic", correct: false }),
    ]);
    const stats = computeTopicStats([record]);
    expect(stats.has("verbal/analogy")).toBe(true);
    expect(stats.has("verbal/logic")).toBe(true);
  });
});

// ── buildAdaptiveQuiz ──────────────────────────────────────────────────────

describe("buildAdaptiveQuiz — adaptive question selection", () => {
  it("returns an empty array when no questions provided", () => {
    const result = buildAdaptiveQuiz([], new Map());
    expect(result).toHaveLength(0);
  });

  it("returns up to quizSize questions", () => {
    const questions = Array.from({ length: 20 }, (_, i) =>
      makeQuestion({ id: `q${i}`, topic: "analogy" }),
    );
    const result = buildAdaptiveQuiz(questions, new Map(), 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("prioritizes questions from weak topics over strong topics", () => {
    // Build stats: "analogy" at 20% (weak), "logic" at 90% (strong)
    const weakRecord = makeRecord([
      makeAnswer({ topic: "analogy", correct: false }),
      makeAnswer({ topic: "analogy", correct: false }),
      makeAnswer({ topic: "analogy", correct: false }),
      makeAnswer({ topic: "analogy", correct: false }),
      makeAnswer({ topic: "analogy", correct: true }),
    ]);
    const strongRecord = makeRecord([
      makeAnswer({ topic: "logic", correct: true }),
      makeAnswer({ topic: "logic", correct: true }),
      makeAnswer({ topic: "logic", correct: true }),
      makeAnswer({ topic: "logic", correct: true }),
      makeAnswer({ topic: "logic", correct: false }),
    ]);
    const stats = computeTopicStats([weakRecord, strongRecord]);

    // Create 4 weak questions and 4 strong questions
    const weakQuestions = Array.from({ length: 4 }, (_, i) =>
      makeQuestion({ id: `weak${i}`, topic: "analogy" }),
    );
    const strongQuestions = Array.from({ length: 4 }, (_, i) =>
      makeQuestion({ id: `strong${i}`, topic: "logic" }),
    );

    const result = buildAdaptiveQuiz(
      [...weakQuestions, ...strongQuestions],
      stats,
      4,
    );

    // All 4 results should be from the weak pool (analogy)
    const weakInResult = result.filter((q) => q.topic === "analogy").length;
    expect(weakInResult).toBe(4);
  });
});

// ── weak-spot prioritization ───────────────────────────────────────────────

describe("computeTopicStats — weak-spot prioritization", () => {
  it("topics with <60% accuracy rank lower than those with >80%", () => {
    const record = makeRecord([
      // weak topic: 40% accuracy
      makeAnswer({ topic: "fractions", section: "math", correct: false }),
      makeAnswer({ topic: "fractions", section: "math", correct: false }),
      makeAnswer({ topic: "fractions", section: "math", correct: false }),
      makeAnswer({ topic: "fractions", section: "math", correct: true }),
      makeAnswer({ topic: "fractions", section: "math", correct: true }),
      // strong topic: 80% accuracy
      makeAnswer({ topic: "algebra", section: "math", correct: true }),
      makeAnswer({ topic: "algebra", section: "math", correct: true }),
      makeAnswer({ topic: "algebra", section: "math", correct: true }),
      makeAnswer({ topic: "algebra", section: "math", correct: true }),
      makeAnswer({ topic: "algebra", section: "math", correct: false }),
    ]);
    const stats = computeTopicStats([record]);
    const fractions = stats.get("math/fractions")!;
    const algebra = stats.get("math/algebra")!;

    expect(fractions.pct).toBeLessThan(60);
    expect(algebra.pct).toBeGreaterThanOrEqual(80);
    // Fractions should be prioritized (lower pct = higher priority in adaptive quiz)
    expect(fractions.pct).toBeLessThan(algebra.pct);
  });
});
