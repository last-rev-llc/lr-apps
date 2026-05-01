import { PageHeader } from "@repo/ui";
import { requireAccess } from "@repo/auth/server";
import { hasFeatureAccess } from "@repo/billing";
import { listTemplates } from "./actions";
import { MemeEditor } from "./components/meme-editor";

export default async function MemeGeneratorPage() {
  const [{ user }, templates] = await Promise.all([
    requireAccess("meme-generator"),
    listTemplates(),
  ]);
  const canUseAiCaption = await hasFeatureAccess(user.id, "memes:ai-caption");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Meme Generator"
        subtitle="Pick a template, write your caption, ship the meme."
      />
      <MemeEditor templates={templates} canUseAiCaption={canUseAiCaption} />
    </div>
  );
}
