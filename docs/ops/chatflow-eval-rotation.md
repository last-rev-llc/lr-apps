# Chatflow eval — pgsodium key rotation

The `chatflow_targets` table stores Flowise / AI eval API tokens encrypted at
rest via pgsodium. Each row carries its own `api_token_key_id`, so rotation is
*per-row* rather than a database-wide flip.

## Active key id

The encrypt path reads `PGSODIUM_KEY_ID` from the environment at call time and
writes that id into the row. The decrypt path uses the *row's stored key id*
(not the env), so prior rows continue to decrypt under their original key
even after `PGSODIUM_KEY_ID` is rolled forward.

Implications:

- Rolling `PGSODIUM_KEY_ID` immediately changes the key used for *new and
  rewritten* rows. It does not touch existing rows.
- A row that has not been rewritten since the rotation will still decrypt
  under its original key.
- A row whose original key is **deleted** from `pgsodium.key` will start to
  fail decryption with a Postgres error. There is no silent fallback.

## Rotation procedure

1. Mint the new key:
   ```
   pnpm tsx scripts/seed-pgsodium-key.ts
   ```
   The script prints `PGSODIUM_KEY_ID=<uuid>`.

2. Update the env in Vercel / `.env.local` to the new value. Redeploy any
   service that uses `@repo/ai-eval`.

3. Re-encrypt existing rows under the new key by calling `updateTarget(...,
   { api_token: <plaintext> })` for each row. The plaintext can be the same
   value — the update path always re-encrypts when `api_token` is provided.

4. Once every row's `api_token_key_id` matches the new key, the old key may
   be deleted from `pgsodium.key`. **Do this last.** Deleting the old key
   before all rows are migrated will break decryption for any unmigrated row.

## What the integration test exercises

`packages/ai-eval/src/__tests__/target-store.integration.test.ts` Case 5:

- Writes a row under the original key.
- Mints a second key via `pgsodium.create_key`.
- Writes a second row with `PGSODIUM_KEY_ID` pointed at the new key.
- Asserts both rows decrypt — each under its own per-row key id.
- Re-encrypts the original row via `updateTarget` and asserts it now
  decrypts under the new key.

The test deliberately does **not** delete the old key — the failure mode of
"old key deleted before rows were migrated" is documented here rather than
exercised, because deleting a key is a destructive operation we don't want
to leave half-applied in CI databases.
