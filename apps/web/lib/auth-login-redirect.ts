import { getAppBySlug } from "./app-registry";
import { productionAppOrigin } from "./app-host";

function usePathBasedReturn(host: string): boolean {
  return (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes(".localhost") ||
    host.includes("vercel.app")
  );
}

/**
 * Build `/auth/login` href with `returnTo` for Auth0. Uses `/apps/...` on localhost
 * and preview hosts; uses `https://{subdomain}.apps.lastrev.com/` in production.
 */
export function buildAuthLoginHref(opts: {
  host: string;
  redirectSlug?: string;
  defaultReturnTo?: string;
  screenHint?: "signup";
}): string {
  const {
    host,
    redirectSlug,
    defaultReturnTo = "/my-apps",
    screenHint,
  } = opts;

  const qs = new URLSearchParams();
  if (screenHint) {
    qs.set("screen_hint", screenHint);
  }

  let returnTo = defaultReturnTo;
  if (redirectSlug) {
    const app = getAppBySlug(redirectSlug);
    if (app) {
      returnTo = usePathBasedReturn(host)
        ? `/${app.routeGroup}`
        : `${productionAppOrigin(app.subdomain)}/`;
    } else {
      console.warn(
        `[auth] buildAuthLoginHref: unknown app slug "${redirectSlug}", falling back to ${defaultReturnTo}`,
      );
    }
  }
  qs.set("returnTo", returnTo);

  return `/auth/login?${qs.toString()}`;
}
