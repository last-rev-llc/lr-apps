"use client";

import { useReportWebVitals } from "next/web-vitals";

// Internal app routes live under /apps/<slug>/... — derive the slug from the
// pathname so vitals can be filtered per-app without each app having to set
// a data attribute on <html>.
function appSlugFromPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const m = path.match(/^\/apps\/([^/]+)/);
  return m?.[1];
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const path =
      typeof window !== "undefined" ? window.location.pathname : undefined;
    const payload = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label,
      navigationType: (metric as unknown as { navigationType?: string })
        .navigationType,
      rating: (metric as unknown as { rating?: string }).rating,
      path,
      appSlug: appSlugFromPath(path),
    };

    const body = JSON.stringify(payload);
    const url = "/api/vitals";

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* don't surface vitals errors to the user */
    });
  });

  return null;
}
