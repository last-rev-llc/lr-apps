"use server";

// Server actions for the meme-generator app — read-side only:
//   - listTemplates()        — cached for 5 min in Upstash; cache key
//                              `meme:templates:active:${CACHE_VERSION}`.
//                              `scripts/seed-meme-templates.ts` should call
//                              `cacheDel([TEMPLATE_LIST_CACHE_KEY])` after a
//                              run so refreshed catalogs surface immediately.
//   - listMyMemes()          — caller's rows only (RLS + explicit eq).
//                              Each row carries a 1-hour signed URL.
//   - getMemeSignedUrl(id)   — re-sign one owned meme; rejects everything
//                              else.
import { z } from "zod";
import { requireAccess } from "@repo/auth/server";
import { createClient } from "@repo/db/server";
import { CACHE_VERSION, cacheGet, cacheSet } from "@repo/db/cache";
import {
  createSignedUrl,
  uploadFile,
  deleteFiles,
  StorageValidationError,
} from "@repo/storage";
import { getSubscription, type Tier } from "@repo/billing";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import type {
  MemeTemplateRow,
  MemeCreationRow,
} from "@repo/db/types";
import type { MemeTemplate, MemeCreation } from "./lib/types";
import { QuotaExceededError } from "./lib/errors";
import { SAVE_QUOTAS, UPGRADE_TIER } from "./lib/quotas";

const APP_SLUG = "meme-generator";
const TEMPLATES_TTL_SECONDS = 300;
const SIGNED_URL_TTL_SECONDS = 3600;
const MEMES_BUCKET = "memes";
const MAX_PNG_BYTES = 1_048_576;
const MAX_PNG_DIMENSION = 4096;

export const TEMPLATE_LIST_CACHE_KEY = `meme:templates:active:${CACHE_VERSION}`;

const IdSchema = z.string().uuid();
const TitleSchema = z.string().trim().min(1).max(200);
const FontSizeSchema = z.coerce.number().int().min(12).max(200);
const TemplateIdSchema = z.string().min(1).max(200);
const TextZonesSchema = z.record(z.string(), z.string());

const SaveMemeInputSchema = z
  .object({
    title: TitleSchema,
    templateId: TemplateIdSchema,
    textZones: TextZonesSchema,
    fontSize: FontSizeSchema,
  })
  .strict();

const UpdateTitleSchema = z
  .object({
    id: IdSchema,
    title: TitleSchema,
  })
  .strict();

export type SaveMemeResult =
  | { ok: true; meme: MemeCreation }
  | { ok: false; error: string };

export type UpdateMemeResult =
  | { ok: true; meme: MemeCreation }
  | { ok: false; error: string };

export type DeleteMemeResult =
  | { ok: true }
  | { ok: false; error: string };

interface PngDimensions {
  width: number;
  height: number;
}

function readPngDimensions(bytes: Uint8Array): PngDimensions | null {
  // PNG signature (8 bytes) + 4-byte chunk length + 4-byte "IHDR" + 4-byte
  // width + 4-byte height. We only need the first 24 bytes to read sizes.
  if (bytes.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return null;
  }
  if (
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    return null;
  }
  const width =
    (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height =
    (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width: width >>> 0, height: height >>> 0 };
}

export type MemeWithSignedUrl = MemeCreation & { signedUrl: string };

export type SignedUrlResult =
  | { ok: true; signedUrl: string }
  | { ok: false; error: string };

export async function listTemplates(): Promise<MemeTemplate[]> {
  return withSpan(
    "memeGenerator.listTemplates",
    { "app.slug": APP_SLUG },
    async () => {
      await requireAccess(APP_SLUG);

      const cached = await cacheGet<MemeTemplate[]>(TEMPLATE_LIST_CACHE_KEY);
      if (cached) {
        log.debug("memeGenerator.listTemplates cache hit", {
          action: "listTemplates",
        });
        return cached;
      }

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("meme_templates")
        .select("*")
        .eq("isActive", true)
        .order("displayOrder", { ascending: true });

      if (error) {
        log.error("memeGenerator.listTemplates db error", {
          action: "listTemplates",
          err: error,
        });
        throw new Error("failed to list templates");
      }

      const rows = (data ?? []) as unknown as MemeTemplateRow[];
      await cacheSet(TEMPLATE_LIST_CACHE_KEY, rows, TEMPLATES_TTL_SECONDS);
      log.debug("memeGenerator.listTemplates ok", {
        action: "listTemplates",
        count: rows.length,
      });
      return rows;
    },
  );
}

export async function listMyMemes(): Promise<MemeWithSignedUrl[]> {
  return withSpan(
    "memeGenerator.listMyMemes",
    { "app.slug": APP_SLUG },
    async () => {
      const { user } = await requireAccess(APP_SLUG);
      const userId = user.id;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("meme_creations")
        .select("*")
        // RLS already scopes selects to auth.uid(); the explicit eq is a
        // belt-and-suspenders guard so a service-role misconfig can't leak.
        .eq("user_id", userId)
        .order("createdAt", { ascending: false });

      if (error) {
        log.error("memeGenerator.listMyMemes db error", {
          action: "listMyMemes",
          userId,
          err: error,
        });
        throw new Error("failed to list memes");
      }

      const rows = (data ?? []) as unknown as MemeCreationRow[];
      const signed = await Promise.all(
        rows.map(async (row) => {
          try {
            const signedUrl = await createSignedUrl({
              bucket: MEMES_BUCKET,
              path: row.storagePath,
              expiresInSeconds: SIGNED_URL_TTL_SECONDS,
            });
            return { ...row, signedUrl } satisfies MemeWithSignedUrl;
          } catch (err) {
            log.error("memeGenerator.listMyMemes sign error", {
              action: "listMyMemes",
              userId,
              memeId: row.id,
              err,
            });
            return null;
          }
        }),
      );

      const visible = signed.filter(
        (row): row is MemeWithSignedUrl => row !== null,
      );
      log.debug("memeGenerator.listMyMemes ok", {
        action: "listMyMemes",
        userId,
        total: rows.length,
        signed: visible.length,
      });
      return visible;
    },
  );
}

async function resolveTier(userId: string): Promise<Tier> {
  const subscription = await getSubscription(userId);
  return subscription?.tier ?? "free";
}

export async function saveMeme(formData: FormData): Promise<SaveMemeResult> {
  return withSpan(
    "meme-generator.saveMeme",
    { "app.slug": APP_SLUG },
    async () => {
      const { user } = await requireAccess(APP_SLUG);
      const userId = user.id;

      const rawTextZones = formData.get("textZones");
      let parsedTextZones: unknown;
      if (typeof rawTextZones === "string") {
        try {
          parsedTextZones = JSON.parse(rawTextZones);
        } catch {
          parsedTextZones = undefined;
        }
      }

      const inputResult = SaveMemeInputSchema.safeParse({
        title: formData.get("title"),
        templateId: formData.get("templateId"),
        textZones: parsedTextZones,
        fontSize: formData.get("fontSize"),
      });
      if (!inputResult.success) {
        log.warn("meme-generator.saveMeme invalid input", {
          action: "saveMeme",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }
      const { title, templateId, textZones, fontSize } = inputResult.data;

      const file = formData.get("file");
      if (!(file instanceof Blob)) {
        log.warn("meme-generator.saveMeme missing file", {
          action: "saveMeme",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }
      if (file.type !== "image/png") {
        log.warn("meme-generator.saveMeme bad mime", {
          action: "saveMeme",
          userId,
          contentType: file.type,
        });
        return { ok: false, error: "file must be image/png" };
      }
      if (file.size > MAX_PNG_BYTES) {
        log.warn("meme-generator.saveMeme oversize", {
          action: "saveMeme",
          userId,
          size: file.size,
        });
        return { ok: false, error: "file too large" };
      }

      const buffer = new Uint8Array(await file.arrayBuffer());
      const dims = readPngDimensions(buffer);
      if (
        !dims ||
        dims.width <= 0 ||
        dims.height <= 0 ||
        dims.width > MAX_PNG_DIMENSION ||
        dims.height > MAX_PNG_DIMENSION
      ) {
        log.warn("meme-generator.saveMeme bad dimensions", {
          action: "saveMeme",
          userId,
          dims,
        });
        return { ok: false, error: "invalid PNG" };
      }

      const supabase = await createClient();
      const { data: templateRow, error: templateError } = await supabase
        .from("meme_templates")
        .select("id, isActive, textZones")
        .eq("id", templateId)
        .maybeSingle();
      if (templateError) {
        log.error("meme-generator.saveMeme template lookup error", {
          action: "saveMeme",
          userId,
          err: templateError,
        });
        return { ok: false, error: "template lookup failed" };
      }
      const template = templateRow as
        | { id: string; isActive: boolean; textZones: { id: string }[] }
        | null;
      if (!template || !template.isActive) {
        return { ok: false, error: "template not found" };
      }

      const allowedZoneIds = new Set(template.textZones.map((z) => z.id));
      for (const zoneId of Object.keys(textZones)) {
        if (!allowedZoneIds.has(zoneId)) {
          log.warn("meme-generator.saveMeme unknown zone", {
            action: "saveMeme",
            userId,
            zoneId,
          });
          return { ok: false, error: "invalid zone id" };
        }
      }

      const tier = await resolveTier(userId);
      const limit = SAVE_QUOTAS[tier];

      // Benign race: two concurrent saves can both observe count = limit-1
      // and both pass the check, ending at count = limit+1. We accept this
      // — the per-tier limits are loose UX guardrails, not security
      // boundaries, and exact counting would require a transaction or DB
      // trigger we don't want to maintain. Don't "fix" without context.
      const { count, error: countError } = await supabase
        .from("meme_creations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (countError) {
        log.error("meme-generator.saveMeme count error", {
          action: "saveMeme",
          userId,
          err: countError,
        });
        return { ok: false, error: "quota check failed" };
      }
      const current = count ?? 0;
      if (current >= limit) {
        log.warn("meme-generator.saveMeme quota exceeded", {
          action: "saveMeme",
          userId,
          tier,
          current,
          limit,
        });
        throw new QuotaExceededError({
          feature: "memes:save-quota",
          current,
          limit,
          upgradeTier: UPGRADE_TIER[tier],
        });
      }

      const storagePath = `${userId}/${crypto.randomUUID()}.png`;
      try {
        await uploadFile(
          {
            bucket: MEMES_BUCKET,
            path: storagePath,
            file: buffer,
            contentType: "image/png",
          },
          { maxBytes: MAX_PNG_BYTES, allowedMimeTypes: ["image/png"] },
        );
      } catch (err) {
        if (err instanceof StorageValidationError) {
          log.warn("meme-generator.saveMeme storage validation", {
            action: "saveMeme",
            userId,
            err: err.message,
          });
          return { ok: false, error: "invalid upload" };
        }
        log.error("meme-generator.saveMeme upload error", {
          action: "saveMeme",
          userId,
          err,
        });
        return { ok: false, error: "upload failed" };
      }

      const { data: row, error } = await supabase
        .from("meme_creations")
        .insert({
          user_id: userId,
          title,
          templateId,
          textZones,
          fontSize,
          storagePath,
          widthPx: dims.width,
          heightPx: dims.height,
        })
        .select("*")
        .single();

      if (error || !row) {
        log.error("meme-generator.saveMeme insert error", {
          action: "saveMeme",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to save meme" };
      }

      log.debug("meme-generator.saveMeme ok", {
        action: "saveMeme",
        userId,
        memeId: (row as MemeCreationRow).id,
      });
      return { ok: true, meme: row as unknown as MemeCreation };
    },
  );
}

export async function getMemeSignedUrl(id: string): Promise<SignedUrlResult> {
  return withSpan(
    "memeGenerator.getMemeSignedUrl",
    { "app.slug": APP_SLUG, "meme.id": id },
    async () => {
      const { user } = await requireAccess(APP_SLUG);
      const userId = user.id;

      const parsed = IdSchema.safeParse(id);
      if (!parsed.success) {
        log.warn("memeGenerator.getMemeSignedUrl invalid input", {
          action: "getMemeSignedUrl",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("meme_creations")
        .select("storagePath, user_id")
        .eq("id", parsed.data)
        // RLS would already filter, but pin ownership explicitly so a future
        // refactor (e.g. service-role usage) can't open cross-user reads.
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        log.error("memeGenerator.getMemeSignedUrl db error", {
          action: "getMemeSignedUrl",
          userId,
          err: error,
        });
        return { ok: false, error: "failed to fetch meme" };
      }

      if (!data) {
        return { ok: false, error: "not found" };
      }

      const row = data as { storagePath: string; user_id: string };

      try {
        const signedUrl = await createSignedUrl({
          bucket: MEMES_BUCKET,
          path: row.storagePath,
          expiresInSeconds: SIGNED_URL_TTL_SECONDS,
        });
        log.debug("memeGenerator.getMemeSignedUrl ok", {
          action: "getMemeSignedUrl",
          userId,
        });
        return { ok: true, signedUrl };
      } catch (err) {
        log.error("memeGenerator.getMemeSignedUrl sign error", {
          action: "getMemeSignedUrl",
          userId,
          err,
        });
        return { ok: false, error: "failed to sign url" };
      }
    },
  );
}

export async function updateMemeTitle(
  id: string,
  title: string,
): Promise<UpdateMemeResult> {
  return withSpan(
    "meme-generator.updateMemeTitle",
    { "app.slug": APP_SLUG, "meme.id": id },
    async () => {
      const { user } = await requireAccess(APP_SLUG);
      const userId = user.id;

      const parsed = UpdateTitleSchema.safeParse({ id, title });
      if (!parsed.success) {
        log.warn("meme-generator.updateMemeTitle invalid input", {
          action: "updateMemeTitle",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const { data: row, error } = await supabase
        .from("meme_creations")
        .update({ title: parsed.data.title })
        // RLS already scopes updates to auth.uid(); the explicit eq is a
        // belt-and-suspenders guard against future service-role refactors.
        .eq("id", parsed.data.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error || !row) {
        log.warn("meme-generator.updateMemeTitle not found", {
          action: "updateMemeTitle",
          userId,
          err: error,
        });
        return { ok: false, error: "not found" };
      }

      log.debug("meme-generator.updateMemeTitle ok", {
        action: "updateMemeTitle",
        userId,
      });
      return { ok: true, meme: row as unknown as MemeCreation };
    },
  );
}

export async function deleteMeme(id: string): Promise<DeleteMemeResult> {
  return withSpan(
    "meme-generator.deleteMeme",
    { "app.slug": APP_SLUG, "meme.id": id },
    async () => {
      const { user } = await requireAccess(APP_SLUG);
      const userId = user.id;

      const parsedId = IdSchema.safeParse(id);
      if (!parsedId.success) {
        log.warn("meme-generator.deleteMeme invalid input", {
          action: "deleteMeme",
          userId,
        });
        return { ok: false, error: "invalid input" };
      }

      const supabase = await createClient();
      const { data: existing, error: fetchError } = await supabase
        .from("meme_creations")
        .select("storagePath")
        .eq("id", parsedId.data)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        log.error("meme-generator.deleteMeme fetch error", {
          action: "deleteMeme",
          userId,
          err: fetchError,
        });
        return { ok: false, error: "delete failed" };
      }
      if (!existing) {
        return { ok: false, error: "not found" };
      }
      const storagePath = (existing as { storagePath: string }).storagePath;

      const { error: deleteError } = await supabase
        .from("meme_creations")
        .delete()
        .eq("id", parsedId.data)
        .eq("user_id", userId);
      if (deleteError) {
        log.error("meme-generator.deleteMeme row delete error", {
          action: "deleteMeme",
          userId,
          err: deleteError,
        });
        return { ok: false, error: "delete failed" };
      }

      // Ordered cleanup: row first, blob second. If the blob delete fails,
      // we leave the orphaned blob behind and surface a structured warning
      // so a future cron sweep can pick it up. Do NOT roll back the row
      // delete — the user already saw "deleted" and the contract is
      // weighted toward not resurrecting rows.
      try {
        await deleteFiles({ bucket: MEMES_BUCKET, paths: [storagePath] });
      } catch (err) {
        log.warn("meme-generator.deleteMeme blob delete failed — needs sweep", {
          action: "deleteMeme",
          feature: "meme-generator",
          phase: "delete-blob",
          userId,
          memeId: parsedId.data,
          storagePath,
          err,
        });
      }

      log.debug("meme-generator.deleteMeme ok", {
        action: "deleteMeme",
        userId,
      });
      return { ok: true };
    },
  );
}
