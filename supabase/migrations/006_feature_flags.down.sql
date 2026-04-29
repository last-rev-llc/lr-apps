drop policy if exists "Users read own flags" on public.feature_flags;
drop policy if exists "Auth admins manage all flags" on public.feature_flags;
drop index if exists public.idx_feature_flags_key;
drop index if exists public.idx_feature_flags_global_unique;
drop table if exists public.feature_flags;
