import { createClient } from "@repo/db/server";
import type { WinePour, WallPost } from "./types";

export async function getWinePours(): Promise<WinePour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wine_pours")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("wine_pours fetch error:", error.message);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase row
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    restaurant_name: r.restaurant_name ?? "",
    wine_name: r.wine_name ?? "",
    pour_rating: r.pour_rating ?? "standard",
    price_paid: r.price_paid ?? null,
    notes: r.notes ?? null,
    user_name: r.user_name ?? "Anonymous",
    created_at: r.created_at ?? new Date().toISOString(),
  })) as WinePour[];
}

export async function getWallPosts(): Promise<WallPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pour_wall")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("pour_wall fetch error:", error.message);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase row
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    user_name: r.user_name ?? "Anonymous",
    pour_type: r.pour_type ?? "glory",
    content: r.content ?? "",
    upvotes: r.upvotes ?? 0,
    created_at: r.created_at ?? new Date().toISOString(),
  })) as WallPost[];
}
