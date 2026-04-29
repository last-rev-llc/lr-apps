import { log } from "@repo/logger";
import type { AnalyticsBackend, AnalyticsProps } from "./backend";

const DEFAULT_HOST = "https://app.posthog.com";

function getHost(): string {
  return process.env.NEXT_PUBLIC_ANALYTICS_HOST?.trim() || DEFAULT_HOST;
}

function getKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_ANALYTICS_KEY?.trim();
  return key || undefined;
}

async function postCapture(payload: Record<string, unknown>): Promise<void> {
  const key = getKey();
  if (!key) return;
  const host = getHost();
  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: key, ...payload }),
    });
  } catch (err) {
    log.error("analytics capture failed", { err });
  }
}

export const posthogBackend: AnalyticsBackend = {
  trackClient(event: string, props?: AnalyticsProps): void {
    const key = getKey();
    if (!key) return;
    const distinctId =
      typeof window !== "undefined"
        ? (window.localStorage?.getItem("ph_distinct_id") ?? "anonymous")
        : "anonymous";
    void postCapture({
      event,
      distinct_id: distinctId,
      properties: props ?? {},
    });
  },
  async captureServer(
    userId: string,
    event: string,
    props?: AnalyticsProps,
  ): Promise<void> {
    await postCapture({
      event,
      distinct_id: userId,
      properties: props ?? {},
    });
  },
};
