import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.DEPLOYMENT_ENV ?? process.env.NODE_ENV ?? "local";
const isProd = environment === "production";

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment,
  tracesSampleRate: isProd ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: isProd ? 1.0 : 0,
  debug: false,
});
