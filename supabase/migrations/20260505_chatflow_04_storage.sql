-- Storage buckets for the chatflow apps. Path layout for both buckets is
-- `<user_id>/<run_id>/<filename>.csv`, matching the meme-generator pattern
-- so storage.foldername(name)[1] gates per-user access.
--
-- Security invariant: chatflow-results has SELECT/DELETE policies for users
-- but NO INSERT policy. Only the service role (which bypasses RLS) writes
-- generated result CSVs from server actions like `exportRunCSV`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chatflow-uploads',
  'chatflow-uploads',
  false,
  26214400,
  array['text/csv', 'application/csv']
)
on conflict (id) do nothing;

drop policy if exists "chatflow_uploads_select_own" on storage.objects;
create policy "chatflow_uploads_select_own"
  on storage.objects for select
  using (
    bucket_id = 'chatflow-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "chatflow_uploads_insert_own" on storage.objects;
create policy "chatflow_uploads_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'chatflow-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "chatflow_uploads_delete_own" on storage.objects;
create policy "chatflow_uploads_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'chatflow-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chatflow-results',
  'chatflow-results',
  false,
  52428800,
  array['text/csv']
)
on conflict (id) do nothing;

drop policy if exists "chatflow_results_select_own" on storage.objects;
create policy "chatflow_results_select_own"
  on storage.objects for select
  using (
    bucket_id = 'chatflow-results'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "chatflow_results_delete_own" on storage.objects;
create policy "chatflow_results_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'chatflow-results'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
