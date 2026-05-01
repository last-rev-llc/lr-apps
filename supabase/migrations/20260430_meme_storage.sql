-- Storage buckets for the meme generator app.
-- `memes` — private bucket for user-saved memes; signed URLs only.
-- `meme-templates` — public bucket for template background images
--                    uploaded by `scripts/seed-meme-templates.ts`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memes', 'memes', false, 1048576, array['image/png'])
on conflict (id) do nothing;

create policy "memes_select_own"
  on storage.objects for select
  using (
    bucket_id = 'memes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "memes_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'memes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "memes_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'memes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meme-templates',
  'meme-templates',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "meme_templates_storage_select_public"
  on storage.objects for select
  using (bucket_id = 'meme-templates');
