"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAccess } from "@repo/auth/server";
import { createServiceRoleClient } from "@repo/db/service-role";

const TierSchema = z.enum(["free", "pro", "enterprise"]);
const FlagKeySchema = z.string().min(1).max(64);

const REVALIDATE = "/apps/command-center/cc-flags";

async function requireAdmin(): Promise<void> {
  await requireAccess("command-center", "admin");
}

export async function setGlobalFlag(
  key: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsedKey = FlagKeySchema.safeParse(key);
  if (!parsedKey.success) return { ok: false, error: "invalid key" };

  const db = createServiceRoleClient();
  const { data: existing } = await db
    .from("feature_flags")
    .select("id")
    .eq("key", parsedKey.data)
    .is("user_id", null)
    .is("tier", null)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await db
      .from("feature_flags")
      .update({ enabled })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await db
      .from("feature_flags")
      .insert({ key: parsedKey.data, enabled });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(REVALIDATE);
  return { ok: true };
}

export async function setTierDefault(
  key: string,
  tier: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsedKey = FlagKeySchema.safeParse(key);
  const parsedTier = TierSchema.safeParse(tier);
  if (!parsedKey.success) return { ok: false, error: "invalid key" };
  if (!parsedTier.success) return { ok: false, error: "invalid tier" };

  const db = createServiceRoleClient();
  const { data: existing } = await db
    .from("feature_flags")
    .select("id")
    .eq("key", parsedKey.data)
    .eq("tier", parsedTier.data)
    .is("user_id", null)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await db
      .from("feature_flags")
      .update({ enabled })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await db
      .from("feature_flags")
      .insert({ key: parsedKey.data, tier: parsedTier.data, enabled });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(REVALIDATE);
  return { ok: true };
}

export async function addUserOverride(
  key: string,
  email: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsedKey = FlagKeySchema.safeParse(key);
  const parsedEmail = z.string().email().safeParse(email);
  if (!parsedKey.success) return { ok: false, error: "invalid key" };
  if (!parsedEmail.success) return { ok: false, error: "invalid email" };

  const db = createServiceRoleClient();
  let userId: string | null = null;
  try {
    const { data: list } = await db.auth.admin.listUsers();
    const match = list?.users?.find(
      (u) => u.email?.toLowerCase() === parsedEmail.data.toLowerCase(),
    );
    userId = match?.id ?? null;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "user lookup failed",
    };
  }
  if (!userId) return { ok: false, error: "user not found" };

  const { error } = await db
    .from("feature_flags")
    .upsert(
      { key: parsedKey.data, user_id: userId, enabled },
      { onConflict: "key,user_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath(REVALIDATE);
  return { ok: true };
}

export async function removeOverride(
  rowId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = z.string().uuid().safeParse(rowId);
  if (!parsed.success) return { ok: false, error: "invalid id" };

  const db = createServiceRoleClient();
  const { error } = await db
    .from("feature_flags")
    .delete()
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath(REVALIDATE);
  return { ok: true };
}
