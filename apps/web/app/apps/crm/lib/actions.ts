"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/db/server";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import { ContactInputSchema, type ContactInput } from "./schemas";
import type { Contact } from "./types";

const CRM_PATH = "/apps/crm";

function buildContactRow(input: ContactInput | Partial<ContactInput>) {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    row[key] = value;
  }
  return row;
}

export async function createContact(input: ContactInput): Promise<Contact> {
  return withSpan("crm.createContact", {}, async () => {
    const data = ContactInputSchema.parse(input);

    const supabase = await createClient();
    const { data: row, error } = await (supabase as any)
      .from("contacts")
      .insert(buildContactRow(data))
      .select("*")
      .single();

    if (error) {
      log.error("crm.createContact db error", { err: error });
      throw new Error(error.message ?? "failed to create contact");
    }

    revalidatePath(CRM_PATH);
    return row as unknown as Contact;
  });
}

export async function updateContact(
  id: string,
  input: Partial<ContactInput>,
): Promise<Contact> {
  return withSpan("crm.updateContact", { contactId: id }, async () => {
    const data = ContactInputSchema.partial().parse(input);

    const supabase = await createClient();
    const { data: row, error } = await (supabase as any)
      .from("contacts")
      .update(buildContactRow(data))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      log.error("crm.updateContact db error", { err: error, contactId: id });
      throw new Error(error.message ?? "failed to update contact");
    }

    revalidatePath(CRM_PATH);
    return row as unknown as Contact;
  });
}

export async function deleteContact(id: string): Promise<void> {
  return withSpan("crm.deleteContact", { contactId: id }, async () => {
    const supabase = await createClient();
    const { error } = await (supabase as any).from("contacts").delete().eq("id", id);

    if (error) {
      log.error("crm.deleteContact db error", { err: error, contactId: id });
      throw new Error(error.message ?? "failed to delete contact");
    }

    revalidatePath(CRM_PATH);
  });
}
