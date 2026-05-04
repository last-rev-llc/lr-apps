# Chatflow-eval pgsodium key — provisioning and rotation

The AI Eval and CSV Chatflow apps store per-user Flowise API tokens in
`public.chatflow_targets.api_token_encrypted`, encrypted at rest via
[pgsodium]. This document covers:

1. **Provenance** — where the encryption key comes from.
2. **Provisioning** — first-time setup per environment.
3. **Rotation** — manual re-encrypt procedure.
4. **v1 limitations** — what is *not* automated yet.

[pgsodium]: https://github.com/michelp/pgsodium

## Provenance

The key is a libsodium-managed `crypto_aead_det_xchacha20` key created via
`pgsodium.create_key(name => 'chatflow_targets_api_token_v1')`. We tag it
with a stable name so the seed script is idempotent: re-running it returns
the existing id rather than creating a duplicate.

The key id is a UUID stored in the env var `PGSODIUM_KEY_ID`. The key
material itself never leaves the database. Encryption and decryption happen
inside Postgres (server-side helpers in `@repo/ai-eval/target-store`),
never client-side.

## Provisioning a fresh environment

Run the seed script against the target Postgres:

```sh
SUPABASE_DB_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  pnpm seed:pgsodium-key
```

The script prints either:

- `Created pgsodium key 'chatflow_targets_api_token_v1'.` — first run on
  this database, OR
- `Found existing pgsodium key 'chatflow_targets_api_token_v1'.` — a key
  with that name already exists (idempotent re-run).

Followed by the line you need to copy into env config:

```
PGSODIUM_KEY_ID=<uuid>
```

Set this:

- **Local dev** — append to `.env.local`.
- **Staging / production** — set in the matching Vercel project env scope
  (`Preview` for staging, `Production` for prod). Don't share the same
  key id across environments — each environment has its own pgsodium key
  scoped to its own Postgres.

`apps/web/lib/env.ts` requires `PGSODIUM_KEY_ID` and validates it as a
UUID, so a missing or malformed value fails fast at startup with a clear
message.

## Manual rotation procedure

> **v1 limitation**: there is no automated rotation. Operators must
> coordinate the steps below in a maintenance window.

The general shape: create a new key, re-encrypt every existing
`chatflow_targets.api_token_encrypted` value under the new key, swap the
env var, then retire the old key.

Steps:

1. **Mint the new key** — pick a new stable name and run the create
   manually. Don't reuse the v1 name; bump the suffix:

   ```sql
   select id from pgsodium.create_key(name => 'chatflow_targets_api_token_v2');
   ```

   Record the returned UUID — this is the new `PGSODIUM_KEY_ID`.

2. **Re-encrypt every row** — inside a single transaction, decrypt with
   the old key id and re-encrypt with the new one. Sketch:

   ```sql
   begin;
   update public.chatflow_targets
   set
     api_token_encrypted = encode(
       pgsodium.crypto_aead_det_encrypt(
         pgsodium.crypto_aead_det_decrypt(
           decode(api_token_encrypted, 'base64'),
           convert_to(id::text, 'utf8'),
           api_token_key_id
         ),
         convert_to(id::text, 'utf8'),
         '<new-key-uuid>'::uuid
       ),
       'base64'
     ),
     api_token_key_id = '<new-key-uuid>'::uuid
   where api_token_key_id = '<old-key-uuid>'::uuid;
   commit;
   ```

   The exact encrypt/decrypt invocation must match what
   `@repo/ai-eval/target-store` uses; verify against that module before
   running. Always do a dry-run on a copy first.

3. **Swap `PGSODIUM_KEY_ID`** — update the env var in the target
   environment (Vercel scope or `.env.local`) and redeploy.

4. **Verify** — fetch a target via the app and confirm decryption succeeds
   under the new key. Check Sentry for any `pgsodium`/decryption errors.

5. **Retire the old key** — only after several days of clean traffic, and
   only after confirming no `chatflow_targets` row still references the
   old `api_token_key_id`:

   ```sql
   select count(*) from public.chatflow_targets
   where api_token_key_id = '<old-key-uuid>'::uuid;  -- must be 0
   ```

   Then archive the old key per pgsodium docs (don't drop it without a
   verified DB backup).

## v1 limitations

- **No dual-key window.** During the re-encrypt step the column is briefly
  inconsistent if the transaction is split. Always re-encrypt in one
  transaction.
- **No background rotation worker.** No cron job will roll the key for
  you. Schedule rotations explicitly in a maintenance window.
- **No per-tenant keys.** All `chatflow_targets` rows share a single
  environment-wide key. If you need tenant isolation, that's a v2 design.

## Where this fits in the platform rotation runbook

This key is **not** part of the [mandatory rotation
order](./secrets-rotation.md#mandatory-rotation-order) — it's an
application-scoped secret, independent of Stripe / Supabase service role /
Auth0 / `CRON_SECRET`. Rotate it on its own schedule when one of:

- A user reports a token leak.
- A scheduled audit window calls for it.
- The `chatflow_targets` table is migrated to a new database.

Always log the rotation in [`ROTATION_HISTORY.md`](./ROTATION_HISTORY.md)
with the same one-line format as the other secrets.
