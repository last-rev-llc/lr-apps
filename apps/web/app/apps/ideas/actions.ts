"use server";

import { z } from "zod";
import { requireAccess } from "@repo/auth/server";
import { createClient } from "@repo/db/server";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import { computeComposite } from "./lib/score";
import type { Idea } from "./lib/types";

type ActionResult =
  | { ok: true; idea: Idea }
  | { ok: false; error: string };

const TitleSchema = z.string().trim().min(1).max(200);
const DescriptionSchema = z.string().max(5000).optional();
const CategorySchema = z.string().max(80).optional();
const TagsSchema = z.array(z.string().max(80)).max(50).optional();
const SourceSchema = z.enum(["generated", "community", "manual"]).optional();
const SourceUrlSchema = z.string().url().max(2048).optional();
const StatusSchema = z.enum([
  "new",
  "backlog",
  "in-progress",
  "completed",
  "archived",
]);
const FeasibilitySchema = z.number().int().min(0).max(10).nullable();
const ImpactSchema = z.number().int().min(0).max(10).nullable();
const EffortSchema = z.enum(["Low", "Medium", "High"]).nullable();
const IdSchema = z.string().uuid();

const CreateIdeaSchema = z
  .object({
    title: TitleSchema,
    description: DescriptionSchema,
    category: CategorySchema,
    tags: TagsSchema,
    source: SourceSchema,
    sourceUrl: SourceUrlSchema,
  })
  .strict();

const UpdateIdeaPatchSchema = z
  .object({
    title: TitleSchema.optional(),
    description: DescriptionSchema,
    category: CategorySchema,
    tags: TagsSchema,
    sourceUrl: SourceUrlSchema,
    feasibility: FeasibilitySchema.optional(),
    impact: ImpactSchema.optional(),
    effort: EffortSchema.optional(),
  })
  .strict();

const SetStatusSchema = z
  .object({
    id: IdSchema,
    status: StatusSchema,
  })
  .strict();

export async function createIdea(
  input: z.input<typeof CreateIdeaSchema>,
): Promise<ActionResult> {
  return withSpan("ideas.createIdea", { "app.slug": "ideas" }, async () => {
    const { user } = await requireAccess("ideas");
    const userId = user.id;

    const parsed = CreateIdeaSchema.safeParse(input);
    if (!parsed.success) {
      log.warn("ideas.createIdea invalid input", {
        action: "createIdea",
        userId,
      });
      return { ok: false, error: "invalid input" };
    }

    const data = parsed.data;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("ideas")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? null,
        tags: data.tags ?? [],
        source: data.source ?? "manual",
        sourceUrl: data.sourceUrl ?? null,
        status: "new",
      })
      .select("*")
      .single();

    if (error) {
      log.error("ideas.createIdea db error", {
        action: "createIdea",
        userId,
        err: error,
      });
      return { ok: false, error: "failed to create idea" };
    }

    log.debug("ideas.createIdea ok", { action: "createIdea", userId });
    return { ok: true, idea: row as unknown as Idea };
  });
}

export async function updateIdea(
  id: string,
  patch: z.input<typeof UpdateIdeaPatchSchema>,
): Promise<ActionResult> {
  return withSpan(
    "ideas.updateIdea",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsedId = IdSchema.safeParse(id);
      const parsedPatch = UpdateIdeaPatchSchema.safeParse(patch);
      if (!parsedId.success || !parsedPatch.success) {
        log.warn("ideas.updateIdea invalid input", {
          action: "updateIdea",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const update: Record<string, unknown> = {};
      const p = parsedPatch.data;
      if (p.title !== undefined) update.title = p.title;
      if (p.description !== undefined)
        update.description = p.description ?? null;
      if (p.category !== undefined) update.category = p.category ?? null;
      if (p.tags !== undefined) update.tags = p.tags ?? [];
      if (p.sourceUrl !== undefined)
        update.sourceUrl = p.sourceUrl ?? null;
      if (p.feasibility !== undefined) update.feasibility = p.feasibility;
      if (p.impact !== undefined) update.impact = p.impact;
      if (p.effort !== undefined) update.effort = p.effort;

      const scoringChanged =
        p.feasibility !== undefined ||
        p.impact !== undefined ||
        p.effort !== undefined;

      if (scoringChanged) {
        const { data: existing, error: fetchError } = await supabase
          .from("ideas")
          .select("feasibility,impact,effort")
          .eq("id", parsedId.data)
          .eq("user_id", userId)
          .single();
        if (fetchError || !existing) {
          log.error("ideas.updateIdea fetch error", {
            action: "updateIdea",
            userId,
            err: fetchError,
          });
          return { ok: false, error: "idea not found" };
        }
        const merged = existing as {
          feasibility: number | null;
          impact: number | null;
          effort: string | null;
        };
        const feasibility =
          p.feasibility !== undefined ? p.feasibility : merged.feasibility;
        const impact = p.impact !== undefined ? p.impact : merged.impact;
        const effort = p.effort !== undefined ? p.effort : merged.effort;
        update.compositeScore = computeComposite(feasibility, impact, effort);
      }

      const { data: row, error } = await supabase
        .from("ideas")
        .update(update)
        .eq("id", parsedId.data)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        log.error("ideas.updateIdea db error", {
          action: "updateIdea",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to update idea" };
      }

      log.debug("ideas.updateIdea ok", { action: "updateIdea", userId });
      return { ok: true, idea: row as unknown as Idea };
    },
  );
}

export async function setIdeaStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  return withSpan(
    "ideas.setIdeaStatus",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsed = SetStatusSchema.safeParse({ id, status });
      if (!parsed.success) {
        log.warn("ideas.setIdeaStatus invalid input", {
          action: "setIdeaStatus",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const completedAt =
        parsed.data.status === "completed" ? new Date().toISOString() : null;

      const supabase = await createClient();
      const { data: row, error } = await supabase
        .from("ideas")
        .update({ status: parsed.data.status, completedAt })
        .eq("id", parsed.data.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        log.error("ideas.setIdeaStatus db error", {
          action: "setIdeaStatus",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to set status" };
      }

      log.debug("ideas.setIdeaStatus ok", {
        action: "setIdeaStatus",
        userId,
      });
      return { ok: true, idea: row as unknown as Idea };
    },
  );
}
