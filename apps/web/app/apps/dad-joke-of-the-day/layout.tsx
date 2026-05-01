import React from "react";
import type { ReactNode } from "react";
import { getTranslations, getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function generateMetadata() {
  const t = await getTranslations("dad-joke-of-the-day.layout");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport = {
  themeColor: "#f59e0b",
};

export default async function DadJokeLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("dad-joke-of-the-day");
  const [t, locale, messages] = await Promise.all([
    getTranslations("dad-joke-of-the-day.layout"),
    getLocale(),
    getMessages(),
  ]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-background">
        <header className="glass-header sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤣</span>
              <h1 className="font-heading text-lg text-foreground font-semibold">
                {t("title")}
              </h1>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a
                href="/apps/dad-joke-of-the-day"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("navApp")}
              </a>
              <a
                href="/apps/dad-joke-of-the-day/about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("navAbout")}
              </a>
              <LocaleSwitcher />
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
