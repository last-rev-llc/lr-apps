import { getAllSlang } from "./lib/queries";
import { SlangApp } from "./components/slang-app";

export const dynamic = "force-dynamic";

export default async function SlangTranslatorPage() {
  const allSlang = await getAllSlang();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-accent">Slang Translator</h1>
        <p className="text-muted-foreground text-sm">
          Gen Alpha &amp; Gen X cross-generational slang decoder
        </p>
      </div>
      <SlangApp allSlang={allSlang} />
    </div>
  );
}
