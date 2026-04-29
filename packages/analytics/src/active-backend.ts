import type { AnalyticsBackend } from "./backend";
import { posthogBackend } from "./posthog-backend";

/**
 * The active analytics backend. To swap providers (e.g. to Plausible), change
 * this single export to point at a different backend implementation.
 */
export const backend: AnalyticsBackend = posthogBackend;
