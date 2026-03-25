import { redirect } from "next/navigation";
import { createClient } from "@repo/db/server";
import type { AppPermission, Permission } from "@repo/db/types";
import { getAllApps } from "@/lib/app-registry";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "@repo/ui";

export default async function MyAppsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawPermissions } = await supabase
    .from("app_permissions")
    .select("app_slug, permission")
    .eq("user_id", user.id);

  const permissions = (rawPermissions ?? []) as Pick<
    AppPermission,
    "app_slug" | "permission"
  >[];

  const permMap = new Map<string, Permission>(
    permissions.map((p) => [p.app_slug, p.permission]),
  );

  const allApps = getAllApps().filter((app) => app.slug !== "auth");
  const myApps = allApps.filter(
    (app) => !app.auth || permMap.has(app.slug),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-accent mb-1">My Apps</h1>
        <p className="text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myApps.map((app) => (
          <a
            key={app.slug}
            href={`https://${app.subdomain}.lastrev.com`}
            className="block"
          >
            <Card className="glass-sm hover:bg-surface-hover transition-colors h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{app.name}</CardTitle>
                  {permMap.has(app.slug) && (
                    <Badge variant="outline" className="text-xs">
                      {permMap.get(app.slug)}
                    </Badge>
                  )}
                  {!app.auth && (
                    <Badge variant="outline" className="text-xs text-accent">
                      public
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {app.subdomain}.lastrev.com
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
