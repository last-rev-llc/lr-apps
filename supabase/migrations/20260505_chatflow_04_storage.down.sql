drop policy if exists "chatflow_results_delete_own" on storage.objects;
drop policy if exists "chatflow_results_select_own" on storage.objects;
drop policy if exists "chatflow_uploads_delete_own" on storage.objects;
drop policy if exists "chatflow_uploads_insert_own" on storage.objects;
drop policy if exists "chatflow_uploads_select_own" on storage.objects;
delete from storage.buckets where id = 'chatflow-results';
delete from storage.buckets where id = 'chatflow-uploads';
