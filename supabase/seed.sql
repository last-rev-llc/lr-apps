-- Seed `view` permission rows for every app in apps/web/lib/app-registry.ts.
-- The CI script `scripts/check-registry-db-consistency.ts` fails if any
-- registry slug is missing a row here.
--
-- The bootstrap admin user UUID is a placeholder. Replace it locally (or via
-- env substitution in CI) with the real bootstrap user id created during
-- `supabase db reset --local`.

\set bootstrap_user '\'00000000-0000-0000-0000-000000000001\''

-- Ensure the placeholder bootstrap user exists in auth.users so the FK on
-- public.app_permissions(user_id) is satisfied. Idempotent.
insert into auth.users (id, instance_id, email, role, aud)
values (
  :bootstrap_user::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'bootstrap@local.test',
  'authenticated',
  'authenticated'
)
on conflict (id) do nothing;

insert into public.app_permissions (user_id, app_slug, permission) values
  (:bootstrap_user::uuid, 'auth', 'view'),
  (:bootstrap_user::uuid, 'command-center', 'view'),
  (:bootstrap_user::uuid, 'generations', 'view'),
  (:bootstrap_user::uuid, 'accounts', 'view'),
  (:bootstrap_user::uuid, 'sentiment', 'view'),
  (:bootstrap_user::uuid, 'meeting-summaries', 'view'),
  (:bootstrap_user::uuid, 'uptime', 'view'),
  (:bootstrap_user::uuid, 'standup', 'view'),
  (:bootstrap_user::uuid, 'sprint-planning', 'view'),
  (:bootstrap_user::uuid, 'sales', 'view'),
  (:bootstrap_user::uuid, 'daily-updates', 'view'),
  (:bootstrap_user::uuid, 'summaries', 'view'),
  (:bootstrap_user::uuid, 'lighthouse', 'view'),
  (:bootstrap_user::uuid, 'slang-translator', 'view'),
  (:bootstrap_user::uuid, 'ai-calculator', 'view'),
  (:bootstrap_user::uuid, 'dad-joke-of-the-day', 'view'),
  (:bootstrap_user::uuid, 'superstars', 'view'),
  (:bootstrap_user::uuid, 'travel-collection', 'view'),
  (:bootstrap_user::uuid, 'cringe-rizzler', 'view'),
  (:bootstrap_user::uuid, 'proper-wine-pour', 'view'),
  (:bootstrap_user::uuid, 'roblox-dances', 'view'),
  (:bootstrap_user::uuid, 'alpha-wins', 'view'),
  (:bootstrap_user::uuid, 'soccer-training', 'view'),
  (:bootstrap_user::uuid, 'hspt-practice', 'view'),
  (:bootstrap_user::uuid, 'hspt-tutor', 'view'),
  (:bootstrap_user::uuid, 'area-52', 'view'),
  (:bootstrap_user::uuid, 'brommie-quake', 'view'),
  (:bootstrap_user::uuid, 'age-of-apes', 'view')
on conflict (user_id, app_slug) do nothing;
