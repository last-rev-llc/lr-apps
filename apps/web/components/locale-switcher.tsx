"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";

const LOCALES = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
] as const;

export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function setLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className={className ?? "text-sm flex items-center gap-1"}>
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        disabled={isPending}
        className="bg-transparent border border-white/15 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {LOCALES.map((l) => (
          <option key={l.value} value={l.value} className="bg-background text-foreground">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
