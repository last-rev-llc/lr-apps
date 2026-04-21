import { z } from "zod";
import { log } from "@repo/logger";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const VITALS_NAMES = ["CLS", "LCP", "INP", "FCP", "TTFB", "FID"] as const;
const RATINGS = ["good", "needs-improvement", "poor"] as const;

const metricSchema = z.object({
  name: z.enum(VITALS_NAMES),
  value: z.number().finite(),
  id: z.string().min(1),
  label: z.string().optional(),
  rating: z.enum(RATINGS).optional(),
  navigationType: z.string().optional(),
  path: z.string().optional(),
  appSlug: z.string().optional(),
});

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const m = parsed.data;
  log.info("web-vital", {
    metric: m.name,
    value: m.value,
    rating: m.rating,
    id: m.id,
    label: m.label,
    navigationType: m.navigationType,
    path: m.path,
    appSlug: m.appSlug,
  });

  return new Response(null, { status: 204 });
}
