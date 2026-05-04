drop policy if exists "meme_templates_storage_select_public" on storage.objects;
drop policy if exists "memes_delete_own" on storage.objects;
drop policy if exists "memes_insert_own" on storage.objects;
drop policy if exists "memes_select_own" on storage.objects;
delete from storage.buckets where id = 'meme-templates';
delete from storage.buckets where id = 'memes';
