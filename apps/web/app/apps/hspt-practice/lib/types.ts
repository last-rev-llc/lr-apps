export type AnswerLetter = "A" | "B" | "C" | "D";

export interface Question {
  id: number;
  type: string;
  question: string;
  options: [string, string, string, string];
  answer: AnswerLetter;
  explanation?: string;
  difficulty?: 1 | 2 | 3;
  // For reading passages — attached at runtime
  _passageId?: string;
  _passageTitle?: string;
  _passageText?: string;
}

export interface Passage {
  id: string;
  title: string;
  text: string;
  questions: Question[];
}

export interface HSPTData {
  verbal: Question[];
  quantitative: Question[];
  mathematics: Question[];
  language: Question[];
  passages: Passage[];
}

export interface SectionKey {
  key: "verbal" | "quantitative" | "reading" | "mathematics" | "language";
}

export type SectionId = "verbal" | "quantitative" | "reading" | "mathematics" | "language";

export interface SectionConfig {
  name: string;
  icon: string;
  time: number; // minutes
  count: number;
  types: string[];
  color: string;
}

export interface Session {
  id: string;
  created_at: string;
  section: SectionId;
  score: number;
  total: number;
  percentage: number;
  time_spent: number; // seconds
  answers: Record<number, AnswerLetter>;
}

export type AppState = "menu" | "quiz" | "results" | "review" | "history";
