import { getAiScripts } from "./lib/queries";
import { AiScriptsApp } from "./components/ai-scripts-app";

export const dynamic = "force-dynamic";

export default async function AiScriptsPage() {
  const scripts = await getAiScripts();
  return <AiScriptsApp initialScripts={scripts} />;
}
