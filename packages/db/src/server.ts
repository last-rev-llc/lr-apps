import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

const isProduction = process.env.NODE_ENV === "production";

/** Prefer service role on the server when Auth0 (or any non-Supabase session) fronts the app. */
function serverSupabaseKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
}
