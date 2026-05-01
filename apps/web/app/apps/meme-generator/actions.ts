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
import { createSignedUrl } from "@repo/storage";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import type {
  MemeTemplateRow,
  MemeCreationRow,
} from "@repo/db/types";
import type { MemeTemplate, MemeCreation } from "./lib/types";

const APP_SLUG = "meme-generator";
const TEMPLATES_TTL_SECONDS = 300;
const SIGNED_URL_TTL_SECONDS = 3600;
const MEMES_BUCKET = "memes";

export const TEMPLATE_LIST_CACHE_KEY = `meme:templates:active:${CACHE_VERSION}`;

const IdSchema = z.string().uuid();

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
