"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const payload = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label,
      navigationType: (metric as unknown as { navigationType?: string })
        .navigationType,
      rating: (metric as unknown as { rating?: string }).rating,
      path:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      appSlug:
        typeof document !== "undefined"
          ? document.documentElement.dataset.appSlug
          : undefined,
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
