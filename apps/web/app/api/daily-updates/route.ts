import { z } from "zod";
import { createClient } from "@repo/db/server";
import { requireAccess } from "@repo/auth/server";
import type { DailyUpdate } from "@/app/apps/daily-updates/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: Request): Promise<Response> {
  await requireAccess("daily-updates", "view");

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    offset: url.searchParams.get("offset") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid offset/limit" },
      { status: 400 },
    );
  }
  const { offset, limit } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_updates")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(((data ?? []) as unknown) as DailyUpdate[]);
}
