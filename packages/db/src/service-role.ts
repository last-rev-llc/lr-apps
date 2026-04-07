import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** Server-only client with the service role (no cookies). Use from hooks / callbacks only. */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createServiceRoleClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient<Database>(url, key);
}
