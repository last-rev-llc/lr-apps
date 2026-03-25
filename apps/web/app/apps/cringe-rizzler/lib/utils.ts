import { SLANG_MAP } from "../data/slang";

function pickUnique(arr: string[], count: number): string[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomTerms(count: number): string[] {
  const terms = Object.keys(SLANG_MAP);
  return pickUnique(terms, count);
}
