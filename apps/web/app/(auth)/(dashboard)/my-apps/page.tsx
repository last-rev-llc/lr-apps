import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@repo/db/server";
import type { AppPermission, Permission } from "@repo/db/types";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getAllApps } from "@/lib/app-registry";
import { getAppLaunchUrl } from "@/lib/platform-urls";
import { appCardMedia } from "@/lib/app-card-media";
import { AppCard } from "@/components/app-card";

export default async function MyAppsPage() {
  const h = await headers();
  const auth0 = getAuth0ClientForHost(getHostFromRequestHeaders(h));
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.sub;
  const email =
    typeof session.user.email === "string" ? session.user.email : "";
  const host = h.get("host") ?? "localhost:3000";

  const supabase = await createClient();

  const { data: rawPermissions } = await supabase
    .from("app_permissions")
    .select("app_slug, permission")
    .eq("user_id", userId);

  const permissions = (rawPermissions ?? []) as Pick<
    AppPermission,
    "app_slug" | "permission"
  >[];

  const permMap = new Map<string, Permission>(
    permissions.map((p) => [p.app_slug, p.permission]),
  );

  const allApps = getAllApps().filter((app) => app.slug !== "auth");
  const myApps = allApps.filter(
    (app) => !app.auth || app.publicRoutes?.length || permMap.has(app.slug),
  );
  const otherApps = allApps.filter(
    (app) => app.auth && !app.publicRoutes?.length && !permMap.has(app.slug),
  );

  return (
    <div>
      <div className="mb-12 text-center">
        <span className="lp-eyebrow">Your Workspace</span>
        <h1 className="lp-h1">My Apps</h1>
        <p className="lp-body-lg mx-auto">Signed in as {email}</p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-accent">Your Apps</span>
          <span className="text-xs text-muted-foreground">
            ({myApps.length} {myApps.length === 1 ? "app" : "apps"})
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {myApps.map((app) => {
            const isPublic = !app.auth;
            const isOpenEntry = app.auth && Boolean(app.publicRoutes?.length);
            const permission = permMap.get(app.slug);
            const badge = isPublic
              ? { label: "public", tone: "accent" as const }
              : isOpenEntry
                ? { label: "open entry", tone: "accent" as const }
                : permission
                  ? { label: permission, tone: "muted" as const }
                  : undefined;

            return (
              <AppCard
                key={app.slug}
                href={getAppLaunchUrl(app.subdomain, host)}
                name={app.name}
                subdomain={app.subdomain}
                badge={badge}
                {...appCardMedia(app.slug)}
              />
            );
          })}
        </div>
      </section>

      {otherApps.length > 0 ? (
        <section>
          <h2 className="text-lg font-medium mb-1 flex items-center gap-2">
            <span className="text-muted-foreground">Other apps</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({otherApps.length} — internal, ask an admin for access)
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These tools require permission. Opening one without access may show
            an unauthorized page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {otherApps.map((app) => (
              <AppCard
                key={app.slug}
                href={getAppLaunchUrl(app.subdomain, host)}
                name={app.name}
                subdomain={app.subdomain}
                badge={{ label: "access required", tone: "muted" }}
                locked
                {...appCardMedia(app.slug)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
