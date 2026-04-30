import { getTranslations } from "next-intl/server";
import { getAllSlang } from "./lib/queries";
import { SlangApp } from "./components/slang-app";

export const dynamic = "force-dynamic";

export default async function SlangTranslatorPage() {
  const allSlang = await getAllSlang();
  const t = await getTranslations("slang-translator.page");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-accent">{t("heading")}</h1>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>
      <SlangApp allSlang={allSlang} />
    </div>
  );
}
