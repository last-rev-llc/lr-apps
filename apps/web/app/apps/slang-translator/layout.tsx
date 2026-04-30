import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import { LocaleSwitcher } from "@/components/locale-switcher";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Topbar } from "@repo/ui";

export default async function SlangTranslatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("slang-translator");
  const t = await getTranslations("slang-translator.layout");

  return (
    <div className="min-h-screen">
      <Topbar title={t("title")}>
        <Link href="/apps/slang-translator" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          {t("navApp")}
        </Link>
        <Link href="/apps/slang-translator/about" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          {t("navAbout")}
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          {t("navDashboard")}
        </Link>
        <LocaleSwitcher />
      </Topbar>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
