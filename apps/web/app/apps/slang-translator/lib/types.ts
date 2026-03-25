export interface SlangEntry {
  id: string;
  term: string;
  definition: string;
  example: string;
  category: string;
  vibe_score: number;
  vibeScore?: number;
  origin: string;
  era: string;
  aliases: string[];
  generation: "gen-alpha" | "gen-x";
  equivalents?: {
    genAlpha?: string;
    genX?: string;
  };
}

export type GenerationFilter = "all" | "gen-alpha" | "gen-x";
export type CategoryFilter = string;

export interface QuizQuestion {
  question: string;
  correct: string;
  options: string[];
  badge: "gen-alpha" | "gen-x";
}

export interface QuizState {
  questions: QuizQuestion[];
  current: number;
  score: number;
  answered: boolean[];
  done: boolean;
  lastPick?: string;
}
