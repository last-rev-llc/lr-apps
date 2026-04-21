-- Rollback for 007_hot_path_indexes.sql
drop index if exists public.idx_app_permissions_app_slug;
