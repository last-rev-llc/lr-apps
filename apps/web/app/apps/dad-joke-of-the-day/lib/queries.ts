import { createClient } from "@repo/db/server";
import type { DadJoke } from "./types";

export async function getAllJokes(): Promise<DadJoke[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("dad_jokes")
    .select("*")
    .order("featured_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DadJoke[];
}

export function getJokeOfTheDay(jokes: DadJoke[]): DadJoke | null {
  if (!jokes.length) return null;
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return jokes[seed % jokes.length] ?? null;
}

export function getCategories(jokes: DadJoke[]): string[] {
  return [...new Set(jokes.map((j) => j.category).filter(Boolean))].sort();
}
