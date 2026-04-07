import { createClient } from "@repo/db/server";
import type { Dance, DanceSubmission } from "./types";

export async function getDances(): Promise<Dance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dances")
    .select("*")
    .order("rating", { ascending: false });

  if (error) {
    console.error("dances fetch error:", error.message);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase row
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    emoji: r.emoji ?? "🎵",
    description: r.description ?? "",
    code: r.code ?? "",
    difficulty: r.difficulty ?? "intermediate",
    tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : (r.tags ?? []),
    rating: r.rating ?? 0,
    ratingCount: r.ratingcount ?? r.ratingCount ?? 0,
    createdAt: r.createdat ?? r.createdAt ?? new Date().toISOString(),
  })) as Dance[];
}

export async function getDanceSubmissions(): Promise<DanceSubmission[]> {
  const supabase = await createClient();
  // Try createdAt first (camelCase column), fall back to created_at
  let result = await supabase
    .from("dance_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (result.error?.message?.includes("does not exist")) {
    result = await supabase
      .from("dance_submissions")
      .select("*")
      .order("createdAt", { ascending: false });
  }

  const { data, error } = result;

  if (error) {
    console.error("dance_submissions fetch error:", error.message);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase row
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    emoji: r.emoji ?? "🎵",
    description: r.description ?? "",
    difficulty: r.difficulty ?? "intermediate",
    tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : (r.tags ?? []),
    submittedBy: r.submitted_by ?? r.submittedBy ?? "anonymous",
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    status: r.status ?? "pending",
  })) as DanceSubmission[];
}
