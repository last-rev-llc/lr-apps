export interface GenerateLangfuseLinkOptions {
  baseUrl?: string;
  tag?: string;
  uid: string;
}

export function generateLangfuseLink(
  opts: GenerateLangfuseLinkOptions,
): string | null {
  const { baseUrl, tag, uid } = opts;

  if (!baseUrl) return null;
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) return null;

  const normalized = trimmed.replace(/\/+$/, "");
  const tagValue = tag ? `${tag}_${uid}` : uid;

  return `${normalized}/traces?tag=${encodeURIComponent(tagValue)}`;
}
