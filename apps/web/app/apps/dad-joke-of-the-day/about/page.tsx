import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@repo/ui";
import { Badge } from "@repo/ui";
import Link from "next/link";

export default async function DadJokeAboutPage() {
  const t = await getTranslations("dad-joke-of-the-day.about");

  const features = [
    {
      icon: "🗓️",
      title: t("featureJotdTitle"),
      description: t("featureJotdDescription"),
      color: "text-accent",
    },
    {
      icon: "🎲",
      title: t("featureRandomTitle"),
      description: t("featureRandomDescription"),
      color: "text-pill-8",
    },
    {
      icon: "👁️",
      title: t("featureRevealTitle"),
      description: t("featureRevealDescription"),
      color: "text-blue",
    },
    {
      icon: "⭐",
      title: t("featureRateTitle"),
      description: t("featureRateDescription"),
      color: "text-green",
    },
    {
      icon: "🗂️",
      title: t("featureCategoriesTitle"),
      description: t("featureCategoriesDescription"),
      color: "text-pill-6",
    },
    {
      icon: "📊",
      title: t("featureRatingsTitle"),
      description: t("featureRatingsDescription"),
      color: "text-pill-7",
    },
  ];

  const steps = [
    { title: t("step1Title"), description: t("step1Description") },
    { title: t("step2Title"), description: t("step2Description") },
    { title: t("step3Title"), description: t("step3Description") },
  ];

  const audiences = [
    {
      icon: "👨‍👧‍👦",
      title: t("audienceDadsTitle"),
      description: t("audienceDadsDescription"),
      color: "text-accent",
    },
    {
      icon: "☕",
      title: t("audienceOfficeTitle"),
      description: t("audienceOfficeDescription"),
      color: "text-pill-8",
    },
    {
      icon: "😊",
      title: t("audienceLaughTitle"),
      description: t("audienceLaughDescription"),
      color: "text-green",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <Badge
          variant="outline"
          className="border-accent/40 text-accent bg-accent/10"
        >
          {t("heroBadge")}
        </Badge>
        <h2 className="text-4xl font-bold text-foreground">
          {t("heroTitleLine1")}
          <br />
          {t("heroTitleLine2")}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t("heroSubtitle")}
        </p>
        <Link
          href="/apps/dad-joke-of-the-day"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-400 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {t("heroCta")}
        </Link>
      </div>

      {/* Features */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("featuresEyebrow")}
          </p>
          <h3 className="text-2xl font-bold text-foreground">{t("featuresHeading")}</h3>
          <p className="text-muted-foreground mt-2">
            {t("featuresSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="glass-sm">
              <CardContent className="p-5 space-y-2">
                <div className={`text-2xl ${f.color}`}>{f.icon}</div>
                <h4 className="font-semibold text-foreground">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("stepsEyebrow")}
          </p>
          <h3 className="text-2xl font-bold text-foreground">
            {t("stepsHeading")}
          </h3>
          <p className="text-muted-foreground mt-2">
            {t("stepsSubtitle")}
          </p>
        </div>
        <div className="space-y-4 max-w-lg mx-auto">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("audienceEyebrow")}
          </p>
          <h3 className="text-2xl font-bold text-foreground">
            {t("audienceHeading")}
          </h3>
          <p className="text-muted-foreground mt-2">
            {t("audienceSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {audiences.map((uc) => (
            <Card key={uc.title} className="glass-sm">
              <CardContent className="p-5 space-y-2">
                <div className={`text-2xl ${uc.color}`}>{uc.icon}</div>
                <h4 className="font-semibold text-foreground">{uc.title}</h4>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4">
        <h3 className="text-2xl font-bold text-foreground">{t("ctaHeading")}</h3>
        <p className="text-muted-foreground">{t("ctaSubtitle")}</p>
        <Link
          href="/apps/dad-joke-of-the-day"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-400 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {t("ctaButton")}
        </Link>
      </section>
    </div>
  );
}
