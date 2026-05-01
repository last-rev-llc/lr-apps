drop policy if exists "Public can read meme templates" on storage.objects;
drop policy if exists "Users can delete own memes" on storage.objects;
drop policy if exists "Users can insert own memes" on storage.objects;
drop policy if exists "Users can read own memes" on storage.objects;

delete from storage.objects where bucket_id in ('memes', 'meme-templates');
delete from storage.buckets where id in ('memes', 'meme-templates');
