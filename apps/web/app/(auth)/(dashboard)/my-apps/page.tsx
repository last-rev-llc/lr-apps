import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@repo/db/server";
import type { AppPermission, Permission } from "@repo/db/types";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getAllApps } from "@/lib/app-registry";
import { getAppLaunchUrl, getAppLaunchUrlLabel } from "@/lib/platform-urls";
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@repo/ui";
import type { AppConfig } from "@/lib/app-registry";

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
    (app) =>
      !app.auth || app.publicRoutes?.length || permMap.has(app.slug),
  );
  const otherApps = allApps.filter(
    (app) =>
      app.auth && !app.publicRoutes?.length && !permMap.has(app.slug),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-accent mb-1">My Apps</h1>
        <p className="text-muted-foreground">
          Signed in as {email}
        </p>
      </div>

      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myApps.map((app) => (
            <AppTile key={app.slug} app={app} host={host} permMap={permMap} />
          ))}
        </div>
      </section>

      {otherApps.length > 0 ? (
        <section>
          <h2 className="text-lg font-medium mb-1 flex items-center gap-2">
            <span className="text-muted-foreground">Other apps</span>
            <span className="text-xs font-normal text-muted-foreground">
              (internal — ask an admin for access)
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These tools require permission. Opening one without access may show
            an unauthorized page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherApps.map((app) => (
              <AppTile
                key={app.slug}
                app={app}
                host={host}
                permMap={permMap}
                locked
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function AppTile({
  app,
  host,
  permMap,
  locked = false,
}: {
  app: AppConfig;
  host: string;
  permMap: Map<string, Permission>;
  locked?: boolean;
}) {
  return (
    <a
      href={getAppLaunchUrl(app.subdomain, host)}
      className="block"
    >
      <Card
        className={cn(
          "glass-sm hover:bg-surface-hover transition-colors h-full",
          locked && "border-dashed opacity-90",
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{app.name}</CardTitle>
            {locked ? (
              <Badge variant="outline" className="text-xs shrink-0">
                access required
              </Badge>
            ) : null}
            {!locked && permMap.has(app.slug) ? (
              <Badge variant="outline" className="text-xs shrink-0">
                {permMap.get(app.slug)}
              </Badge>
            ) : null}
            {!locked && (!app.auth || app.publicRoutes?.length) ? (
              <Badge variant="outline" className="text-xs text-accent shrink-0">
                {app.publicRoutes?.length && app.auth ? "open entry" : "public"}
              </Badge>
            ) : null}
          </div>
          <CardDescription className="text-xs">
            {getAppLaunchUrlLabel(app.subdomain, host)}
          </CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}
