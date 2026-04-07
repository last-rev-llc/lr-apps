export type SectionId =
  | "verbal"
  | "quantitative"
  | "reading"
  | "math"
  | "language";

export interface TutorQuestion {
  id: string;
  section: SectionId;
  topic: string;
  question: string;
  choices: string[]; // e.g. ["A. Museum", "B. Canvas", ...]
  correct: string; // single letter e.g. "B"
  explanation: string;
}

export interface TopicStat {
  section: SectionId;
  topic: string;
  correct: number;
  total: number;
  pct: number;
}

export interface QuizAnswer {
  section: SectionId;
  topic: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
}

export interface QuizRecord {
  id: string;
  date: string;
  score: number;
  total: number;
  topics: string[];
  answers: QuizAnswer[];
}

export interface QuizState {
  questions: TutorQuestion[];
  current: number;
  answers: QuizAnswer[];
  answered: boolean; // whether current question has been answered
}

export type AppTab = "dashboard" | "quiz" | "progress";
