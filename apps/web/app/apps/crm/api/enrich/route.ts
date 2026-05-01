import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAccess } from "@repo/auth/server";
import { createClient } from "@repo/db/server";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import { rateLimit, rateLimitNextResponse } from "@/lib/rate-limit";
import { enrichContact } from "../../lib/enrich";
import { getContactById } from "../../lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENRICH_RATE_LIMIT = 30;
const ENRICH_RATE_WINDOW_MS = 60 * 60 * 1000;

const BodySchema = z.object({ contactId: z.string().uuid() }).strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSpan("crm.enrich", {}, async (span) => {
    const { user } = await requireAccess("crm", "admin");

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_input", message: "body must be JSON" },
        { status: 400 },
      );
    }

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { contactId } = parsed.data;
    span.setAttribute("contactId", contactId);

    const limit = rateLimit(
      `crm:enrich:${user.id}`,
      ENRICH_RATE_LIMIT,
      ENRICH_RATE_WINDOW_MS,
    );
    if (!limit.allowed) {
      log.warn("crm.enrich rate limited", {
        userId: user.id,
        contactId,
        resetAt: limit.reset,
      });
      return rateLimitNextResponse(limit);
    }

    const contact = await getContactById(contactId);
    if (!contact) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    try {
      const insights = await enrichContact(contact);
      const supabase = await createClient();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("contacts")
        .update({ insights, last_researched_at: now })
        .eq("id", contact.id);

      if (error) {
        log.error("crm.enrich db error", { err: error, contactId: contact.id });
        return NextResponse.json(
          { error: "persist_failed" },
          { status: 500 },
        );
      }

      return NextResponse.json({ insights, last_researched_at: now });
    } catch (err) {
      log.error("crm.enrich failed", { err, contactId });
      return NextResponse.json({ error: "enrich_failed" }, { status: 500 });
    }
  });
}
