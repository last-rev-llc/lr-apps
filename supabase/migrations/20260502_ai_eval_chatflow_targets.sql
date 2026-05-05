-- Encrypted-at-rest store for AI Eval / Flowise chatflow targets.
--
-- The api token is stored as ciphertext via pgsodium with a *per-row*
-- api_token_key_id, so key rotation can roll forward without rewriting prior
-- rows in lock-step. See docs/ops/chatflow-eval-rotation.md for the rotation
-- runbook.
--
-- Privacy boundaries:
--   * The base table lives in a non-public `ai_eval` schema that anon and
--     authenticated have no USAGE on, so they cannot reference it directly.
--     Only service_role sees the full row including ciphertext.
--   * `public.chatflow_targets` is a SECURITY INVOKER view over the base
--     table that projects only the non-secret columns. PostgREST exposes the
--     view, so a `select=*` from the SDK can never return the encrypted
--     column or its key id — they are not in the view's column list.
--   * RLS on the base table gates row visibility to the owning user
--     (auth.uid()). The view is a simple projection (no joins, no aggregates,
--     same single base table) so Postgres treats it as automatically
--     updatable; service_role can issue `from("chatflow_targets").delete()`
--     and Postgres rewrites it to a delete on the base table.
--   * Encrypt and decrypt go through SECURITY INVOKER RPCs with EXECUTE
--     restricted to service_role. service_role is the only Supabase role
--     with execute on `pgsodium.crypto_aead_det_encrypt(..., key_uuid uuid,
--     nonce bytea)`, so the function would not run under any other role.
--     The user_id is bound into the AAD so a ciphertext lifted from one row
--     cannot be decrypted under a different user.

create extension if not exists pgsodium;

create schema if not exists ai_eval;
revoke all on schema ai_eval from public;
revoke all on schema ai_eval from anon, authenticated;
grant usage on schema ai_eval to service_role;

create table if not exists ai_eval.chatflow_targets (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  api_host              text not null,
  chatflow_id           text not null,
  api_token_encrypted   bytea not null,
  api_token_key_id      uuid not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table ai_eval.chatflow_targets enable row level security;

drop policy if exists "users read own chatflow targets" on ai_eval.chatflow_targets;
create policy "users read own chatflow targets"
  on ai_eval.chatflow_targets
  for select
  to authenticated
  using (user_id = auth.uid());

-- Authenticated needs SELECT on the base table for the security_invoker view
-- to expand select-through to the underlying rows. RLS still gates which
-- rows they actually see; the view's column list gates which columns. Anon
-- gets nothing — they have no schema USAGE on ai_eval anyway.
grant select on ai_eval.chatflow_targets to authenticated;
grant all on ai_eval.chatflow_targets to service_role;

create or replace function ai_eval.set_chatflow_targets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_chatflow_targets_updated_at on ai_eval.chatflow_targets;
create trigger trg_chatflow_targets_updated_at
  before update on ai_eval.chatflow_targets
  for each row
  execute function ai_eval.set_chatflow_targets_updated_at();

create index if not exists idx_chatflow_targets_user_id
  on ai_eval.chatflow_targets (user_id);

-- Public-facing projection. PostgREST exposes `public` by default, so this is
-- the surface SDK callers see. Encrypted columns are intentionally absent.
create or replace view public.chatflow_targets
  with (security_invoker = true) as
  select
    id,
    user_id,
    name,
    api_host,
    chatflow_id,
    created_at,
    updated_at
  from ai_eval.chatflow_targets;

-- Lock down view privileges. Default privs in public grant ALL to anon and
-- authenticated; we only want SELECT for authenticated and nothing for anon.
revoke all on public.chatflow_targets from public, anon, authenticated;
grant select on public.chatflow_targets to authenticated;
-- service_role inherits default ALL via public-schema default privileges.

-- ---------------------------------------------------------------------------
-- Encryption RPCs.
--
-- Functions are SECURITY INVOKER and only granted EXECUTE to service_role.
-- Calling them as any other role would either fail the GRANT EXECUTE check
-- below or fail the underlying pgsodium 4-arg AEAD grant check.
-- ---------------------------------------------------------------------------

create or replace function public.chatflow_targets_create(
  p_user_id     uuid,
  p_name        text,
  p_api_host    text,
  p_chatflow_id text,
  p_api_token   text,
  p_key_id      uuid
)
returns table (
  id          uuid,
  user_id     uuid,
  name        text,
  api_host    text,
  chatflow_id text,
  created_at  timestamptz,
  updated_at  timestamptz
)
language plpgsql
volatile
security invoker
set search_path = ai_eval, public, pgsodium, pg_temp
as $$
declare
  v_cipher bytea;
begin
  v_cipher := pgsodium.crypto_aead_det_encrypt(
    convert_to(p_api_token, 'utf8'),
    convert_to(p_user_id::text, 'utf8'),
    p_key_id,
    null::bytea
  );

  return query
  insert into ai_eval.chatflow_targets (
    user_id, name, api_host, chatflow_id, api_token_encrypted, api_token_key_id
  )
  values (
    p_user_id, p_name, p_api_host, p_chatflow_id, v_cipher, p_key_id
  )
  returning
    chatflow_targets.id,
    chatflow_targets.user_id,
    chatflow_targets.name,
    chatflow_targets.api_host,
    chatflow_targets.chatflow_id,
    chatflow_targets.created_at,
    chatflow_targets.updated_at;
end;
$$;

create or replace function public.chatflow_targets_update(
  p_user_id     uuid,
  p_id          uuid,
  p_name        text,
  p_api_host    text,
  p_chatflow_id text,
  p_api_token   text,
  p_key_id      uuid
)
returns table (
  id          uuid,
  user_id     uuid,
  name        text,
  api_host    text,
  chatflow_id text,
  created_at  timestamptz,
  updated_at  timestamptz
)
language plpgsql
volatile
security invoker
set search_path = ai_eval, public, pgsodium, pg_temp
as $$
declare
  v_cipher bytea;
  v_key_id uuid;
begin
  if p_api_token is not null then
    if p_key_id is null then
      raise exception 'chatflow_targets_update requires p_key_id when rotating api_token'
        using errcode = 'invalid_parameter_value';
    end if;
    v_cipher := pgsodium.crypto_aead_det_encrypt(
      convert_to(p_api_token, 'utf8'),
      convert_to(p_user_id::text, 'utf8'),
      p_key_id,
      null::bytea
    );
    v_key_id := p_key_id;
  end if;

  return query
  update ai_eval.chatflow_targets t
  set
    name                = coalesce(p_name, t.name),
    api_host            = coalesce(p_api_host, t.api_host),
    chatflow_id         = coalesce(p_chatflow_id, t.chatflow_id),
    api_token_encrypted = coalesce(v_cipher, t.api_token_encrypted),
    api_token_key_id    = coalesce(v_key_id, t.api_token_key_id)
  where t.id = p_id and t.user_id = p_user_id
  returning
    t.id,
    t.user_id,
    t.name,
    t.api_host,
    t.chatflow_id,
    t.created_at,
    t.updated_at;
end;
$$;

create or replace function public.chatflow_targets_decrypt_token(
  p_user_id uuid,
  p_id      uuid
)
returns text
language plpgsql
volatile
security invoker
set search_path = ai_eval, public, pgsodium, pg_temp
as $$
declare
  v_cipher bytea;
  v_key_id uuid;
  v_owner  uuid;
  v_plain  bytea;
begin
  select api_token_encrypted, api_token_key_id, user_id
    into v_cipher, v_key_id, v_owner
    from ai_eval.chatflow_targets
    where id = p_id;

  if v_cipher is null then
    raise exception 'chatflow target % not found', p_id
      using errcode = 'no_data_found';
  end if;

  if v_owner is distinct from p_user_id then
    raise exception 'chatflow target user mismatch'
      using errcode = 'insufficient_privilege';
  end if;

  v_plain := pgsodium.crypto_aead_det_decrypt(
    v_cipher,
    convert_to(v_owner::text, 'utf8'),
    v_key_id,
    null::bytea
  );
  return convert_from(v_plain, 'utf8');
end;
$$;

revoke all on function public.chatflow_targets_create(uuid, text, text, text, text, uuid) from public;
revoke all on function public.chatflow_targets_update(uuid, uuid, text, text, text, text, uuid) from public;
revoke all on function public.chatflow_targets_decrypt_token(uuid, uuid) from public;

grant execute on function public.chatflow_targets_create(uuid, text, text, text, text, uuid) to service_role;
grant execute on function public.chatflow_targets_update(uuid, uuid, text, text, text, text, uuid) to service_role;
grant execute on function public.chatflow_targets_decrypt_token(uuid, uuid) to service_role;
