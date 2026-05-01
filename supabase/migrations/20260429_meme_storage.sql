-- Storage buckets for the meme-generator app and the RLS policies
-- gating object access. Each user's blobs in `memes` are namespaced by
-- their auth.uid() — RLS uses storage.foldername(name)[1] to verify
-- the owner before any read/insert/delete. `meme-templates` is
-- public-read; writes are intentionally not policy-gated so only the
-- service role can populate template assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memes', 'memes', false, 1048576, array['image/png'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meme-templates', 'meme-templates', true, 5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "Users can read own memes"
  on storage.objects for select
  using (
    bucket_id = 'memes'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can insert own memes"
  on storage.objects for insert
  with check (
    bucket_id = 'memes'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own memes"
  on storage.objects for delete
  using (
    bucket_id = 'memes'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public can read meme templates"
  on storage.objects for select
  using (bucket_id = 'meme-templates');
