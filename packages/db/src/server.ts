import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const isProduction = process.env.NODE_ENV === "production";

/** Prefer service role on the server when Auth0 (or any non-Supabase session) fronts the app. */
function serverSupabaseKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Explicit return type — `@supabase/ssr@0.6` declares `createServerClient`
// as `SupabaseClient<Database, SchemaName, Schema>` (3 generics) while
// `SupabaseClient` actually takes 5 (Database, SchemaNameOrClientOptions,
// SchemaName, Schema, ClientOptions). The mis-aligned positional generics
// shift `Schema` into the `SchemaName` slot at the call site, which makes
// the real `Schema` collapse to `never` and every `from(table).insert(...)`
// reject its values as assignable to `never`. The cast through `unknown`
// re-aligns the parameters to the canonical SupabaseClient<Database> shape
// callers expect; we revisit if @supabase/ssr fixes its declaration.
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serverSupabaseKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(isProduction && { domain: ".lastrev.com" }),
              }),
            );
          } catch {
            // Called from a Server Component — ignore.
            // Middleware will refresh the session.
          }
        },
      },
    },
  );
  return client as unknown as SupabaseClient<Database>;
}
