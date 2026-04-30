import { getTranslations } from "next-intl/server";

export default async function SlangTranslatorAboutPage() {
  const t = await getTranslations("slang-translator.about");

  const features = [
    { title: t("feature1Title"), desc: t("feature1Desc") },
    { title: t("feature2Title"), desc: t("feature2Desc") },
    { title: t("feature3Title"), desc: t("feature3Desc") },
    { title: t("feature4Title"), desc: t("feature4Desc") },
    { title: t("feature5Title"), desc: t("feature5Desc") },
    { title: t("feature6Title"), desc: t("feature6Desc") },
  ];

  const steps = [
    { step: t("step1Title"), desc: t("step1Desc") },
    { step: t("step2Title"), desc: t("step2Desc") },
    { step: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-accent mb-2">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass-sm p-4">
            <h3 className="text-sm font-medium text-accent mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-xl text-accent">{t("howItWorksTitle")}</h2>
        <ol className="space-y-3">
          {steps.map((item, i) => (
            <li key={item.step} className="glass-sm p-4 flex gap-4">
              <span className="text-accent font-bold text-lg shrink-0">
                {i + 1}.
              </span>
              <div>
                <h3 className="text-sm font-medium mb-0.5">{item.step}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-center">
        <a
          href="/apps/slang-translator"
          className="inline-block px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("ctaButton")}
        </a>
      </div>
    </div>
  );
}
