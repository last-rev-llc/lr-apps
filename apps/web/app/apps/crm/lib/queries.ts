import { createClient } from "@repo/db/server";
import { withSpan } from "@/lib/otel";
import type { Contact } from "./types";

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export async function getContacts(): Promise<Contact[]> {
  return withSpan("crm.contacts.getContacts", {}, async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("contacts fetch error:", error);
      return [];
    }

    const rows = (data ?? []) as unknown as Contact[];

    rows.forEach((r) => {
      const raw = r as unknown as Record<string, unknown>;
      raw["tags"] = parseJsonField(raw["tags"], []);
      raw["insights"] = parseJsonField(raw["insights"], null);
    });

    return rows;
  });
}

export async function getContactById(id: string): Promise<Contact | null> {
  return withSpan("crm.contacts.getContactById", { "contact.id": id }, async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("contact fetch error:", error);
      return null;
    }
    if (!data) return null;

    const row = data as unknown as Record<string, unknown>;
    row["tags"] = parseJsonField(row["tags"], []);
    row["insights"] = parseJsonField(row["insights"], null);
    return row as unknown as Contact;
  });
}
