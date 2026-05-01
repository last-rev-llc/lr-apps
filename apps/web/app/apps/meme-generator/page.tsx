import { PageHeader } from "@repo/ui";
import { requireAccess } from "@repo/auth/server";
import { hasFeatureAccess, getSubscription, type Tier } from "@repo/billing";
import { listTemplates, listMyMemes } from "./actions";
import { MemeEditor, type InitialMeme } from "./components/meme-editor";
import { SAVE_QUOTAS } from "./lib/quotas";

export default async function MemeGeneratorPage({
  searchParams,
}: {
  searchParams?: Promise<{ meme?: string | string[] }>;
}) {
  const [{ user }, templates, memes] = await Promise.all([
    requireAccess("meme-generator"),
    listTemplates(),
    listMyMemes(),
  ]);
  const [canUseAiCaption, subscription] = await Promise.all([
    hasFeatureAccess(user.id, "memes:ai-caption"),
    getSubscription(user.id),
  ]);
  const tier: Tier = subscription?.tier ?? "free";
  const quota = SAVE_QUOTAS[tier];

  const params = (await searchParams) ?? {};
  const memeIdParam = Array.isArray(params.meme) ? params.meme[0] : params.meme;
  const preload = memeIdParam
    ? memes.find((m) => m.id === memeIdParam)
    : undefined;
  const initialMeme: InitialMeme | undefined = preload
    ? {
        templateId: preload.templateId,
        title: preload.title,
        textZones: preload.textZones,
        fontSize: preload.fontSize,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Meme Generator"
        subtitle="Pick a template, write your caption, ship the meme."
      />
      <MemeEditor
        templates={templates}
        canUseAiCaption={canUseAiCaption}
        tier={tier}
        quota={quota}
        initialMemeCount={memes.length}
        initialMeme={initialMeme}
      />
    </div>
  );
}
