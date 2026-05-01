#!/usr/bin/env node
// Seeds the `meme_templates` table with popular templates from the imgflip
// public API. For each template, downloads the image, uploads it to the
// `meme-templates` Supabase Storage bucket, derives `textZones` (hard-coded
// layout for box_count <= 4, Claude vision via generateObject for >4), and
// upserts a row into `meme_templates`.
//
// Re-runnable: skips templates that already have a non-zero displayOrder so
// existing edits are preserved across runs. Use `--dryRun` to preview the
// changes without writing.
//
// Required env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Optional env:
//   ANTHROPIC_API_KEY    Required only if a candidate has box_count > 4.
//                        Without it, those templates are skipped (logged).
//
// Usage: pnpm seed:meme-templates [--dryRun] [--top=<N>]
import { Buffer } from "node:buffer";
import { createServiceRoleClient } from "../packages/db/src/service-role.ts";
import { CACHE_VERSION, cacheDel } from "../packages/db/src/cache.ts";
import { uploadFile } from "../packages/storage/src/upload.ts";
import type {
  MemeTemplateRow,
  MemeTextZone,
} from "../packages/db/src/types.ts";

// Mirrors `TEMPLATE_LIST_CACHE_KEY` in
// apps/web/app/apps/meme-generator/actions.ts. Bumping `CACHE_VERSION`
// already busts it on deploy; this keeps the local seed run in sync.
const TEMPLATE_LIST_CACHE_KEY = `meme:templates:active:${CACHE_VERSION}`;

const DEFAULT_TOP_N = 30;
const MAX_RETRIES = 3;
const IMG_WIDTH_MAX = 4000;
const IMG_HEIGHT_MAX = 4000;
const TEMPLATE_BUCKET = "meme-templates";

// Imgflip ids to skip (e.g. licensing concerns). Keep small and documented.
export const EXCLUDED_TEMPLATE_IDS = new Set<string>([
  // intentionally empty by default
]);

interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

interface ImgflipResponse {
  success: boolean;
  data?: { memes: ImgflipMeme[] };
  error_message?: string;
}

interface SeedSummary {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface ParsedFlags {
  dryRun: boolean;
  topN: number;
}

function parseFlags(argv: string[]): ParsedFlags {
  let dryRun = false;
  let topN = DEFAULT_TOP_N;
  for (const arg of argv) {
    if (arg === "--dryRun" || arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--top=")) {
      const n = Number(arg.slice("--top=".length));
      if (Number.isFinite(n) && n > 0) topN = Math.floor(n);
    }
  }
  return { dryRun, topN };
}

// Hard-coded layouts as percentages so they scale to any image size.
type ZoneRect = {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  align: "left" | "center" | "right";
};

const LAYOUTS_BY_BOX_COUNT: Record<number, ZoneRect[]> = {
  1: [
    {
      id: "caption",
      label: "Caption",
      xPct: 0.05,
      yPct: 0.4,
      widthPct: 0.9,
      heightPct: 0.2,
      align: "center",
    },
  ],
  2: [
    {
      id: "top",
      label: "Top text",
      xPct: 0.05,
      yPct: 0.04,
      widthPct: 0.9,
      heightPct: 0.2,
      align: "center",
    },
    {
      id: "bottom",
      label: "Bottom text",
      xPct: 0.05,
      yPct: 0.76,
      widthPct: 0.9,
      heightPct: 0.2,
      align: "center",
    },
  ],
  3: [
    {
      id: "top",
      label: "Top text",
      xPct: 0.05,
      yPct: 0.02,
      widthPct: 0.9,
      heightPct: 0.18,
      align: "center",
    },
    {
      id: "middle",
      label: "Middle text",
      xPct: 0.05,
      yPct: 0.41,
      widthPct: 0.9,
      heightPct: 0.18,
      align: "center",
    },
    {
      id: "bottom",
      label: "Bottom text",
      xPct: 0.05,
      yPct: 0.8,
      widthPct: 0.9,
      heightPct: 0.18,
      align: "center",
    },
  ],
  4: [
    {
      id: "top-left",
      label: "Top-left",
      xPct: 0.03,
      yPct: 0.03,
      widthPct: 0.45,
      heightPct: 0.44,
      align: "center",
    },
    {
      id: "top-right",
      label: "Top-right",
      xPct: 0.52,
      yPct: 0.03,
      widthPct: 0.45,
      heightPct: 0.44,
      align: "center",
    },
    {
      id: "bottom-left",
      label: "Bottom-left",
      xPct: 0.03,
      yPct: 0.53,
      widthPct: 0.45,
      heightPct: 0.44,
      align: "center",
    },
    {
      id: "bottom-right",
      label: "Bottom-right",
      xPct: 0.52,
      yPct: 0.53,
      widthPct: 0.45,
      heightPct: 0.44,
      align: "center",
    },
  ],
};

function scaleLayout(
  layout: ZoneRect[],
  width: number,
  height: number,
): MemeTextZone[] {
  return layout.map((rect) => ({
    id: rect.id,
    label: rect.label,
    x: Math.round(rect.xPct * width),
    y: Math.round(rect.yPct * height),
    width: Math.round(rect.widthPct * width),
    height: Math.round(rect.heightPct * height),
    align: rect.align,
    uppercase: true,
  }));
}

function zoneFitsBounds(
  zone: MemeTextZone,
  width: number,
  height: number,
): boolean {
  return (
    zone.x >= 0 &&
    zone.y >= 0 &&
    zone.width > 0 &&
    zone.height > 0 &&
    zone.x + zone.width <= width &&
    zone.y + zone.height <= height
  );
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;
      const delay = 250 * 2 ** (attempt - 1);
      console.warn(
        `  retry ${attempt}/${MAX_RETRIES} for ${label}: ${(err as Error).message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function fetchImgflip(): Promise<ImgflipMeme[]> {
  return withRetry("imgflip get_memes", async () => {
    const res = await fetch("https://api.imgflip.com/get_memes");
    if (!res.ok) {
      throw new Error(`imgflip ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as ImgflipResponse;
    if (!json.success || !json.data?.memes) {
      throw new Error(
        `imgflip success=false: ${json.error_message ?? "unknown"}`,
      );
    }
    return json.data.memes;
  });
}

function extFromUrl(url: string, contentType?: string): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  if (contentType?.includes("webp")) return "webp";
  const m = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
  if (m && ["png", "jpg", "jpeg", "webp"].includes(m[1].toLowerCase())) {
    return m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  }
  return "png";
}

function contentTypeFromExt(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "jpg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

async function downloadImage(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  return withRetry(`download ${url}`, async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`download ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") ?? "image/png";
    const arrayBuf = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuf), contentType };
  });
}

async function deriveZonesViaVision(
  meme: ImgflipMeme,
  buffer: Buffer,
  contentType: string,
): Promise<MemeTextZone[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      `  skip vision for ${meme.id} (${meme.name}): ANTHROPIC_API_KEY missing`,
    );
    return null;
  }
  let generateObject: typeof import("ai").generateObject;
  let anthropic: typeof import("@ai-sdk/anthropic").anthropic;
  let z: typeof import("zod").z;
  try {
    ({ generateObject } = await import("ai"));
    ({ anthropic } = await import("@ai-sdk/anthropic"));
    ({ z } = await import("zod"));
  } catch (err) {
    console.warn(
      `  skip vision for ${meme.id}: ai sdk not installed (${(err as Error).message})`,
    );
    return null;
  }

  const zoneSchema = z.object({
    zones: z
      .array(
        z.object({
          id: z.string().min(1).max(40),
          label: z.string().min(1).max(80),
          x: z.number().int().min(0),
          y: z.number().int().min(0),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          align: z.enum(["left", "center", "right"]),
        }),
      )
      .length(meme.box_count),
  });

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: zoneSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: buffer,
              mediaType: contentType,
            },
            {
              type: "text",
              text: `Identify ${meme.box_count} text-zone rectangles for this meme template.\n` +
                `Image dimensions: ${meme.width} x ${meme.height} px (top-left origin).\n` +
                `Each zone is where caption text should be drawn. Return strict integer pixel coordinates within the image bounds, with non-overlapping rectangles where possible. Use "center" align unless layout dictates otherwise.`,
            },
          ],
        },
      ],
    });

    const zones: MemeTextZone[] = object.zones.map((z) => ({
      ...z,
      uppercase: true,
    }));
    for (const zone of zones) {
      if (!zoneFitsBounds(zone, meme.width, meme.height)) {
        console.warn(
          `  vision zone for ${meme.id} overflows bounds — skip template`,
        );
        return null;
      }
    }
    return zones;
  } catch (err) {
    console.warn(
      `  vision call failed for ${meme.id}: ${(err as Error).message}`,
    );
    return null;
  }
}

export async function seed(
  flags: ParsedFlags = { dryRun: false, topN: DEFAULT_TOP_N },
): Promise<SeedSummary> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  const summary: SeedSummary = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const db = createServiceRoleClient();

  console.log("Fetching imgflip popular templates…");
  const all = await fetchImgflip();
  const candidates = all
    .filter((m) => !EXCLUDED_TEMPLATE_IDS.has(m.id))
    .filter((m) => m.width <= IMG_WIDTH_MAX && m.height <= IMG_HEIGHT_MAX)
    .slice(0, flags.topN);

  console.log(
    `Processing top ${candidates.length} of ${all.length} templates ` +
      `(dryRun=${flags.dryRun})`,
  );

  for (let i = 0; i < candidates.length; i++) {
    const meme = candidates[i];
    const position = i + 1;
    const label = `${meme.id} (${meme.name})`;

    try {
      const { data: existing, error: lookupErr } = await db
        .from("meme_templates")
        .select("id,\"displayOrder\"")
        .eq("id", meme.id)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (existing && existing.displayOrder !== 0) {
        console.log(`  skip ${label}: already seeded`);
        summary.skipped++;
        continue;
      }

      const { buffer, contentType } = await downloadImage(meme.url);
      const ext = extFromUrl(meme.url, contentType);
      const storagePath = `${meme.id}.${ext}`;

      let zones: MemeTextZone[] | null = null;
      if (meme.box_count <= 4) {
        const layout = LAYOUTS_BY_BOX_COUNT[meme.box_count];
        if (!layout) {
          console.warn(`  no layout for box_count=${meme.box_count}: ${label}`);
          summary.skipped++;
          continue;
        }
        zones = scaleLayout(layout, meme.width, meme.height);
      } else {
        zones = await deriveZonesViaVision(meme, buffer, contentType);
        if (!zones) {
          summary.skipped++;
          continue;
        }
      }

      const row = {
        id: meme.id,
        name: meme.name,
        category: "popular",
        imagePath: storagePath,
        imageWidth: meme.width,
        imageHeight: meme.height,
        textZones: zones,
        displayOrder: position,
        isActive: true,
      };

      if (flags.dryRun) {
        console.log(`  [dryRun] would upsert ${label}: ${JSON.stringify(row)}`);
        summary.added++;
        continue;
      }

      await uploadFile({
        bucket: TEMPLATE_BUCKET,
        path: storagePath,
        file: buffer,
        contentType: contentTypeFromExt(ext),
        upsert: true,
      });

      const { error: upsertErr } = await db
        .from("meme_templates")
        .upsert(row, { onConflict: "id" });
      if (upsertErr) throw upsertErr;

      if (existing) {
        console.log(`  updated ${label}`);
        summary.updated++;
      } else {
        console.log(`  added ${label}`);
        summary.added++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  error on ${label}: ${message}`);
      summary.errors++;
    }
  }

  if (!flags.dryRun && (summary.added > 0 || summary.updated > 0)) {
    await cacheDel([TEMPLATE_LIST_CACHE_KEY]);
  }

  return summary;
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  const flags = parseFlags(process.argv.slice(2));
  seed(flags)
    .then((summary) => {
      console.log("\nSeed complete.");
      console.log(
        `  added: ${summary.added}  updated: ${summary.updated}  ` +
          `skipped: ${summary.skipped}  errors: ${summary.errors}`,
      );
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Seed failed: ${message}`);
      process.exit(1);
    });
}
