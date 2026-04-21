import { createServiceRoleClient } from "@repo/db/service-role";

/**
 * Returns the Supabase Storage API. Server-only — uses the service role key
 * which bypasses RLS, so callers must enforce their own authorization.
 *
 * Buckets must be created out-of-band in the Supabase dashboard. The package
 * does not auto-create buckets — silent creation would obscure permission
 * misconfiguration.
 */
export function getStorageClient() {
  return createServiceRoleClient().storage;
}
