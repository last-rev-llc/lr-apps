"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui";
import type { SlangTerm, GenerationConfig, QuizQuestion, QuizState } from "../lib/types";

function buildQuiz(terms: SlangTerm[]): QuizQuestion[] {
  const shuffled = [...terms].sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map((term) => {
    const wrong = terms
      .filter((t) => t.id !== term.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((t) => t.definition);
    const options = [term.definition, ...wrong].sort(() => Math.random() - 0.5);
    return {
      termId: term.id,
      term: term.term,
      correctDef: term.definition,
      options,
    };
  });
}

function getResultMessage(pct: number, gen: GenerationConfig): { title: string; msg: string } {
  if (pct >= 90) {
    return {
      title: `${gen.emoji} Certified ${gen.name}!`,
      msg: `You're basically a living dictionary of ${gen.name} slang. Absolute legend.`,
    };
  }
  if (pct >= 70) {
    return {
      title: `${gen.emoji} Solid ${gen.name} Knowledge`,
      msg: `Not bad — you clearly know your ${gen.name} lingo. Keep grinding.`,
    };
  }
  if (pct >= 50) {
    return {
      title: "📖 Getting There",
      msg: `Halfway there! Do a bit more studying and you'll be fluent in ${gen.name}.`,
    };
  }
  if (pct >= 30) {
    return {
      title: "😬 Needs Work",
      msg: `You're not quite fluent in ${gen.name} yet. Time to study up.`,
    };
  }
  return {
    title: "💀 Total Outsider",
    msg: `You have zero ${gen.name} credentials. Head back to the dictionary!`,
  };
}

interface Props {
  terms: SlangTerm[];
  gen: GenerationConfig;
}

export function SlangQuiz({ terms, gen }: Props) {
  const [quiz, setQuiz] = useState<QuizState>(() => ({
    questions: buildQuiz(terms),
    current: 0,
    score: 0,
    answered: [],
    done: false,
  }));

  const restart = useCallback(() => {
    setQuiz({
      questions: buildQuiz(terms),
      current: 0,
      score: 0,
      answered: [],
      done: false,
    });
  }, [terms]);

  const handleAnswer = (picked: string) => {
    if (quiz.answered.length > quiz.current) return; // already answered
    const correct = picked === quiz.questions[quiz.current].correctDef;
    setQuiz((prev) => ({
      ...prev,
      score: prev.score + (correct ? 1 : 0),
      answered: [...prev.answered, correct],
      lastPick: picked,
    }));
  };

  const handleNext = () => {
    setQuiz((prev) => {
      const next = prev.current + 1;
      return { ...prev, current: next, done: next >= prev.questions.length };
    });
  };

  const { questions, current, score, answered, done, lastPick } = quiz;
  const isAnswered = answered.length > current;
  const pct = done ? Math.round((score / questions.length) * 100) : 0;

  if (done) {
    const { title, msg } = getResultMessage(pct, gen);
    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center">
          {answered.map((correct, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${correct ? "bg-green-500" : "bg-red-500"}`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-6">{title}</h2>
        <div className="text-5xl font-black" style={{ color: gen.color }}>
          {score}/{questions.length}
        </div>
        <p className="text-muted-foreground">{msg}</p>

        {/* Score bar */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {gen.name} Fluency: {pct}%
          </p>
          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background:
                  pct >= 70 ? "var(--color-green)" : pct >= 50 ? "var(--color-yellow)" : "var(--color-red)",
              }}
            />
          </div>
        </div>

        <Button
          onClick={restart}
          className="mt-4 text-black font-semibold"
          style={{ background: gen.color }}
        >
          Try Again 🔁
        </Button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {questions.map((_, i) => {
          let cls = "w-2.5 h-2.5 rounded-full ";
          if (i < answered.length) {
            cls += answered[i] ? "bg-green-500" : "bg-red-500";
          } else if (i === current) {
            cls += "bg-accent shadow-[0_0_8px_var(--accent)]";
          } else {
            cls += "bg-surface-raised";
          }
          return <div key={i} className={cls} />;
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Question {current + 1} of {questions.length}
      </p>

      <div
        className="text-center p-6 rounded-2xl border"
        style={{ borderColor: gen.color + "40" }}
      >
        <p className="text-xs text-muted-foreground mb-2">What does this mean?</p>
        <h3 className="text-2xl font-bold" style={{ color: gen.color }}>
          &quot;{q.term}&quot;
        </h3>
      </div>

      <div className="space-y-2.5">
        {q.options.map((opt) => {
          let cls =
            "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";
          if (isAnswered) {
            if (opt === q.correctDef) {
              cls += "border-green-500 bg-green-500/10 text-green-400 font-semibold";
            } else if (opt === lastPick && opt !== q.correctDef) {
              cls += "border-red-500 bg-red-500/10 text-red-400";
            } else {
              cls += "border-surface-border bg-surface-card text-muted-foreground opacity-50";
            }
          } else {
            cls +=
              "border-surface-border bg-surface-card hover:border-accent hover:bg-accent/5 cursor-pointer";
          }
          return (
            <button
              key={opt}
              className={cls}
              disabled={isAnswered}
              onClick={() => handleAnswer(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleNext}
            className="text-black font-semibold px-8"
            style={{ background: gen.color }}
          >
            {current < questions.length - 1 ? "Next →" : "See Results 🏆"}
          </Button>
        </div>
      )}
    </div>
  );
}
