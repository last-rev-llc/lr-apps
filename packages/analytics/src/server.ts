import { backend } from "./active-backend";
import type { AnalyticsProps } from "./backend";

export { hashUserId } from "./hash";

function isDisabled(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.ANALYTICS_DISABLED === "true") return true;
  return false;
}

export async function capture(
  userId: string,
  event: string,
  props?: AnalyticsProps,
): Promise<void> {
  if (isDisabled()) return;
  await backend.captureServer(userId, event, props);
}
