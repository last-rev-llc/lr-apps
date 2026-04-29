import * as Sentry from "@sentry/nextjs";
import { setSentry } from "@repo/logger";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.DEPLOYMENT_ENV ?? process.env.NODE_ENV ?? "local";
const isProd = environment === "production";

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment,
  tracesSampleRate: isProd ? 0.1 : 1.0,
  debug: false,
});

if (dsn) {
  setSentry({
    captureException: (err, hint) => Sentry.captureException(err, hint),
  });
}
