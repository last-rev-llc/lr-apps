import { getTranslations } from "next-intl/server";

export default async function ProperWinePourAboutPage() {
  const t = await getTranslations("proper-wine-pour.about");

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
        <h1 className="font-heading text-3xl mb-2" style={{ color: "var(--color-pill-6)" }}>
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* The Golden Rule callout */}
      <div
        className="rounded-xl p-5 text-center border"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--color-red) 25%, transparent), color-mix(in srgb, var(--color-red) 18%, transparent))",
          borderColor: "var(--color-red)",
        }}
      >
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-pill-6)" }}>750ml</div>
            <div className="text-xs text-muted-foreground">{t("calloutBottleLabel")}</div>
          </div>
          <div className="text-muted-foreground text-2xl">=</div>
          <div>
            <div className="text-3xl font-bold text-green">5</div>
            <div className="text-xs text-muted-foreground">{t("calloutGlassesLabel")}</div>
          </div>
        </div>
        <p className="text-muted-foreground text-xs mt-3">{t("calloutBody")}</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass-sm p-4">
            <h3 className="text-sm font-medium mb-1" style={{ color: "var(--color-pill-6)" }}>{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl" style={{ color: "var(--color-pill-6)" }}>{t("stepsHeading")}</h2>
        <ol className="space-y-3">
          {steps.map((item, i) => (
            <li key={item.step} className="glass-sm p-4 flex gap-4">
              <span className="font-bold text-lg shrink-0" style={{ color: "var(--color-pill-6)" }}>
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
          href="/apps/proper-wine-pour"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "var(--color-red)", color: "white" }}
        >
          {t("ctaButton")}
        </a>
      </div>
    </div>
  );
}
