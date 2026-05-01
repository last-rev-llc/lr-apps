import { PageHeader } from "@repo/ui";
import { listTemplates } from "./actions";
import { MemeEditor } from "./components/meme-editor";

export default async function MemeGeneratorPage() {
  const templates = await listTemplates();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Meme Generator"
        subtitle="Pick a template, write your caption, ship the meme."
      />
      <MemeEditor templates={templates} />
    </div>
  );
}
