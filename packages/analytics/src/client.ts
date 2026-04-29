import { backend } from "./active-backend";
import type { AnalyticsProps } from "./backend";

function isDisabled(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.ANALYTICS_DISABLED === "true") return true;
  if (
    typeof navigator !== "undefined" &&
    navigator.doNotTrack === "1"
  ) {
    return true;
  }
  return false;
}

export function track(event: string, props?: AnalyticsProps): void {
  if (isDisabled()) return;
  backend.trackClient(event, props);
}
