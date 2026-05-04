// Public URL helper for the `meme-templates` storage bucket. The bucket is
// public per supabase/migrations/20260430_meme_02_storage.sql, so a static URL
// works — no signing required and no async server roundtrip.
export function publicMemeTemplateUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/meme-templates/${imagePath}`;
}
