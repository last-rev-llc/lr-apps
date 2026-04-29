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

const SNOOZE_DURATION_MS: Record<string, number> = {
  "1d": 86_400_000,
  "1w": 604_800_000,
  "2w": 1_209_600_000,
  "1mo": 2_592_000_000,
};

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

const RateIdeaSchema = z
  .object({
    id: IdSchema,
    stars: z.number().int().min(0).max(5),
  })
  .strict();

const SnoozeDurationSchema = z
  .union([z.enum(["1d", "1w", "2w", "1mo"]), z.null()]);

const SnoozeIdeaSchema = z
  .object({
    id: IdSchema,
    duration: SnoozeDurationSchema,
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

      const supabase = await createClient();
      const update: Record<string, unknown> = { status: parsed.data.status };
      if (parsed.data.status === "completed") {
        update.completedAt = new Date().toISOString();
      } else if (parsed.data.status !== "archived") {
        // Transitioning to a non-archived, non-completed status clears the
        // completion timestamp. Archiving preserves it so the history stays
        // intact regardless of whether the user archives via the row menu
        // (archiveIdea) or the status dropdown (this action).
        update.completedAt = null;
      }

      const { data: row, error } = await supabase
        .from("ideas")
        .update(update)
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

export async function rateIdea(
  id: string,
  stars: number,
): Promise<ActionResult> {
  return withSpan(
    "ideas.rateIdea",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsed = RateIdeaSchema.safeParse({ id, stars });
      if (!parsed.success) {
        log.warn("ideas.rateIdea invalid input", {
          action: "rateIdea",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const ratingValue = parsed.data.stars === 0 ? null : parsed.data.stars;

      const supabase = await createClient();
      const { data: row, error } = await supabase
        .from("ideas")
        .update({ rating: ratingValue })
        .eq("id", parsed.data.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        log.error("ideas.rateIdea db error", {
          action: "rateIdea",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to rate idea" };
      }

      log.debug("ideas.rateIdea ok", { action: "rateIdea", userId });
      return { ok: true, idea: row as unknown as Idea };
    },
  );
}

export async function toggleHideIdea(id: string): Promise<ActionResult> {
  return withSpan(
    "ideas.toggleHideIdea",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsedId = IdSchema.safeParse(id);
      if (!parsedId.success) {
        log.warn("ideas.toggleHideIdea invalid input", {
          action: "toggleHideIdea",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const { data: existing, error: fetchError } = await supabase
        .from("ideas")
        .select("hidden")
        .eq("id", parsedId.data)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existing) {
        log.error("ideas.toggleHideIdea fetch error", {
          action: "toggleHideIdea",
          userId,
          err: fetchError,
        });
        return { ok: false, error: "idea not found" };
      }

      const current = (existing as { hidden: boolean | null }).hidden ?? false;
      const next = !current;

      const { data: row, error } = await supabase
        .from("ideas")
        .update({ hidden: next })
        .eq("id", parsedId.data)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        log.error("ideas.toggleHideIdea db error", {
          action: "toggleHideIdea",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to toggle hidden" };
      }

      log.debug("ideas.toggleHideIdea ok", {
        action: "toggleHideIdea",
        userId,
      });
      return { ok: true, idea: row as unknown as Idea };
    },
  );
}

export async function snoozeIdea(
  id: string,
  duration: "1d" | "1w" | "2w" | "1mo" | null,
): Promise<ActionResult> {
  return withSpan(
    "ideas.snoozeIdea",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsed = SnoozeIdeaSchema.safeParse({ id, duration });
      if (!parsed.success) {
        log.warn("ideas.snoozeIdea invalid input", {
          action: "snoozeIdea",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const snoozedUntil =
        parsed.data.duration === null
          ? null
          : new Date(
              Date.now() + SNOOZE_DURATION_MS[parsed.data.duration],
            ).toISOString();

      const supabase = await createClient();
      const { data: row, error } = await supabase
        .from("ideas")
        .update({ snoozedUntil })
        .eq("id", parsed.data.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        log.error("ideas.snoozeIdea db error", {
          action: "snoozeIdea",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to snooze idea" };
      }

      log.debug("ideas.snoozeIdea ok", { action: "snoozeIdea", userId });
      return { ok: true, idea: row as unknown as Idea };
    },
  );
}

export async function archiveIdea(id: string): Promise<ActionResult> {
  return withSpan(
    "ideas.archiveIdea",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsedId = IdSchema.safeParse(id);
      if (!parsedId.success) {
        log.warn("ideas.archiveIdea invalid input", {
          action: "archiveIdea",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const { data: row, error } = await supabase
        .from("ideas")
        .update({ status: "archived" })
        .eq("id", parsedId.data)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        log.error("ideas.archiveIdea db error", {
          action: "archiveIdea",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to archive idea" };
      }

      log.debug("ideas.archiveIdea ok", { action: "archiveIdea", userId });
      return { ok: true, idea: row as unknown as Idea };
    },
  );
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteIdea(id: string): Promise<DeleteResult> {
  return withSpan(
    "ideas.deleteIdea",
    { "app.slug": "ideas", "idea.id": id },
    async () => {
      const { user } = await requireAccess("ideas");
      const userId = user.id;

      const parsedId = IdSchema.safeParse(id);
      if (!parsedId.success) {
        log.warn("ideas.deleteIdea invalid input", {
          action: "deleteIdea",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const { error } = await supabase
        .from("ideas")
        .delete()
        .eq("id", parsedId.data)
        .eq("user_id", userId);

      if (error) {
        log.error("ideas.deleteIdea db error", {
          action: "deleteIdea",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to delete idea" };
      }

      log.debug("ideas.deleteIdea ok", { action: "deleteIdea", userId });
      return { ok: true };
    },
  );
}
