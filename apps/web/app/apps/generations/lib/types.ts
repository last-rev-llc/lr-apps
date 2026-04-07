export interface SlangTerm {
  id: string;
  term: string;
  definition: string;
  example: string;
  category: string;
  vibeScore: number;
  origin: string;
  era: string;
  aliases: string[];
  generation?: string;
  equivalents?: Record<string, string>;
}

export interface GenerationConfig {
  slug: string;
  name: string;
  era: string;
  color: string;
  emoji: string;
  tagline: string;
}

export interface QuizQuestion {
  termId: string;
  term: string;
  correctDef: string;
  options: string[];
}

export interface QuizState {
  questions: QuizQuestion[];
  current: number;
  score: number;
  answered: boolean[];
  done: boolean;
  lastPick?: string;
}
