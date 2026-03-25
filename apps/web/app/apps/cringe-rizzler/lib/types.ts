export interface SlangTerm {
  term: string;
  definition: string;
  category: string;
  vibeScore: number;
}

export interface GeneratedPhrase {
  text: string;
  terms: Array<{ term: string; def: string }>;
}

export interface SavedItem {
  id: string;
  type: "phrase" | "meme";
  content: string;
  scenario?: string;
  slang_terms?: string[];
  created_at: string;
}

export type FilterType = "all" | "phrase" | "meme";
