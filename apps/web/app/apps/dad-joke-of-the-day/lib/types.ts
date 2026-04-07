export interface DadJoke {
  id: number;
  setup: string;
  punchline: string;
  category: string;
  rating: number | null;
  times_rated: number;
  times_shown: number;
  featured_date: string | null;
}

export const RATING_MAP: Record<string, number> = {
  groan: 1,
  eyeroll: 2,
  funny: 3,
  nocap: 4,
  sus: 1,
  brainrot: 2,
  ratio: 1,
  bussin: 4,
};

export const RATINGS = [
  { key: "groan", emoji: "😩", label: "Groan-worthy" },
  { key: "eyeroll", emoji: "🙄", label: "Eye-roll" },
  { key: "funny", emoji: "😂", label: "Actually funny" },
  { key: "nocap", emoji: "💀", label: "No cap, that slaps" },
  { key: "sus", emoji: "🤨", label: "That's sus" },
  { key: "brainrot", emoji: "🧠", label: "Pure brainrot" },
  { key: "ratio", emoji: "📉", label: "Ratio'd" },
  { key: "bussin", emoji: "🔥", label: "Bussin fr fr" },
] as const;
