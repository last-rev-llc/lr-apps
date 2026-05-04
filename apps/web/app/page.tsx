import { headers } from "next/headers";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getAllApps } from "@/lib/app-registry";
import { authHubOrigin } from "@/lib/app-host";
import { getAppLaunchUrl } from "@/lib/platform-urls";
import { appCardMedia } from "@/lib/app-card-media";
import { AppCard } from "@/components/app-card";
import { AppShowcaseGroupedGrids } from "@/components/app-showcase-grouped-grids";

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const auth0 = getAuth0ClientForHost(getHostFromRequestHeaders(headersList));
  const session = await auth0.getSession();
  const isSignedIn = Boolean(session?.user);
  const signInBase = authHubOrigin(host);

  const apps = getAllApps().filter((app) => app.slug !== "auth");

  return (
    <main className="min-h-screen p-8 max-w-lp-xl mx-auto">
      <div className="mb-12 text-center">
        <span className="lp-eyebrow">Last Rev Platform</span>
        <h1 className="lp-h1">Apps</h1>
        <p className="lp-body-lg mx-auto">
          {apps.length} tools across the Last Rev platform. Same categories as{" "}
          <a
            className="text-accent underline-offset-4 hover:underline"
            href="https://lastrev.com/apps"
            rel="noreferrer"
            target="_blank"
          >
            lastrev.com/apps
          </a>
          . Internal tools may ask you to sign in when you open them.
        </p>
      </div>

      <AppShowcaseGroupedGrids
        apps={apps}
        renderCard={(app) => (
          <AppCard
            href={
              app.auth && !isSignedIn
                ? `${signInBase}/login?redirect=${encodeURIComponent(app.slug)}`
                : getAppLaunchUrl(app.subdomain, host)
            }
            name={app.name}
            description={app.tagline}
            tier={app.tier}
            {...appCardMedia(app.slug)}
          />
        )}
      />
    </main>
  );
}
