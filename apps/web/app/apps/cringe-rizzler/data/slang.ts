import type { SlangTerm } from "../lib/types";

export const SLANG_GLOSSARY: SlangTerm[] = [
  { term: "rizz", definition: "Charisma or charm, especially romantic", category: "personality", vibeScore: 9 },
  { term: "sigma", definition: "Independent, lone-wolf type personality", category: "personality", vibeScore: 8 },
  { term: "skibidi", definition: "Chaotic, absurd, or cool (context-dependent)", category: "expression", vibeScore: 7 },
  { term: "bussin", definition: "Really good, especially food", category: "quality", vibeScore: 9 },
  { term: "no cap", definition: "No lie, for real", category: "expression", vibeScore: 8 },
  { term: "fr fr", definition: "For real for real — emphasis on truthfulness", category: "expression", vibeScore: 8 },
  { term: "mid", definition: "Average, mediocre, nothing special", category: "quality", vibeScore: 4 },
  { term: "sus", definition: "Suspicious or sketchy", category: "judgment", vibeScore: 5 },
  { term: "slay", definition: "To do something exceptionally well", category: "achievement", vibeScore: 9 },
  { term: "bet", definition: "Agreement — 'okay' or 'sounds good'", category: "expression", vibeScore: 8 },
  { term: "brainrot", definition: "When too much internet rots your brain", category: "internet", vibeScore: 6 },
  { term: "gyatt", definition: "Exclamation of surprise/attraction", category: "expression", vibeScore: 7 },
  { term: "mewing", definition: "Jawline exercise technique (or pretending to)", category: "looksmax", vibeScore: 5 },
  { term: "aura", definition: "Your overall vibe or energy points", category: "personality", vibeScore: 9 },
  { term: "ratio", definition: "Getting more replies than likes (a diss)", category: "internet", vibeScore: 6 },
  { term: "delulu", definition: "Delusional", category: "judgment", vibeScore: 5 },
  { term: "npc", definition: "Someone who acts like a background character", category: "internet", vibeScore: 4 },
  { term: "goat", definition: "Greatest of all time", category: "achievement", vibeScore: 10 },
  { term: "drip", definition: "Stylish outfit or accessories", category: "fashion", vibeScore: 8 },
  { term: "yeet", definition: "To throw something with force", category: "action", vibeScore: 7 },
  { term: "simp", definition: "Someone who does too much for their crush", category: "relationship", vibeScore: 3 },
  { term: "based", definition: "Unapologetically yourself, not caring what others think", category: "personality", vibeScore: 9 },
  { term: "lowkey", definition: "Secretly, subtly, on the down-low", category: "expression", vibeScore: 7 },
  { term: "highkey", definition: "Openly, obviously, very much", category: "expression", vibeScore: 7 },
  { term: "fanum tax", definition: "Taking a portion of someone else's food", category: "food", vibeScore: 8 },
  { term: "ohio", definition: "A place where weird/cursed things happen", category: "internet", vibeScore: 7 },
  { term: "cap", definition: "A lie", category: "expression", vibeScore: 6 },
  { term: "ate", definition: "Did an amazing job — 'ate and left no crumbs'", category: "achievement", vibeScore: 9 },
  { term: "understood the assignment", definition: "Perfectly executed what was needed", category: "achievement", vibeScore: 9 },
  { term: "main character", definition: "Acting like the protagonist of life", category: "personality", vibeScore: 8 },
  { term: "rent free", definition: "Living in someone's head without paying", category: "expression", vibeScore: 7 },
  { term: "caught in 4k", definition: "Caught red-handed with evidence", category: "internet", vibeScore: 8 },
  { term: "periodt", definition: "Period — end of discussion, final word", category: "expression", vibeScore: 8 },
  { term: "glazing", definition: "Excessively praising or complimenting someone", category: "behavior", vibeScore: 4 },
  { term: "mogging", definition: "Outshining someone in looks", category: "looksmax", vibeScore: 7 },
  { term: "looksmaxxing", definition: "Trying to maximize your physical appearance", category: "looksmax", vibeScore: 6 },
  { term: "ick", definition: "A sudden turn-off or feeling of disgust", category: "relationship", vibeScore: 3 },
  { term: "cook", definition: "Let someone do their thing — 'let him cook'", category: "expression", vibeScore: 8 },
  { term: "W", definition: "A win", category: "achievement", vibeScore: 9 },
  { term: "L", definition: "A loss", category: "achievement", vibeScore: 2 },
];

// Flat map for quick lookups
export const SLANG_MAP: Record<string, string> = Object.fromEntries(
  SLANG_GLOSSARY.map((s) => [s.term, s.definition])
);

export const SCENARIOS = [
  "texting my kids",
  "at the office meeting",
  "family dinner",
  "parent-teacher conference",
  "neighborhood BBQ",
  "grocery store checkout",
  "calling tech support",
  "writing a birthday card",
  "leaving a Yelp review",
  "coaching little league",
];

export const CATEGORIES = [
  "all",
  ...Array.from(new Set(SLANG_GLOSSARY.map((s) => s.category))).sort(),
];
