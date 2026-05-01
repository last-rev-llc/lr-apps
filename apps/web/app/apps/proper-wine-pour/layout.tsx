import React from "react";
import type { ReactNode } from "react";
import { getTranslations, getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function generateMetadata() {
  const t = await getTranslations("proper-wine-pour.layout");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export const viewport = {
  themeColor: "#722F37",
};

export default async function ProperWinePourLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("proper-wine-pour");
  const [t, locale, messages] = await Promise.all([
    getTranslations("proper-wine-pour.layout"),
    getLocale(),
    getMessages(),
  ]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen">
        <header className="border-b border-surface-border">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="font-heading text-xl" style={{ color: "var(--color-pill-6)" }}>
                {t("title")}
              </h1>
              <nav className="flex items-center gap-4 text-sm">
                <a
                  href="/apps/proper-wine-pour"
                  className="text-foreground hover:text-accent"
                >
                  {t("navApp")}
                </a>
                <a
                  href="/apps/proper-wine-pour/about"
                  className="text-muted-foreground hover:text-accent"
                >
                  {t("navAbout")}
                </a>
                <a
                  href="/"
                  className="text-muted-foreground hover:text-accent"
                >
                  {t("navDashboard")}
                </a>
                <LocaleSwitcher />
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
