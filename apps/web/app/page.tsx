import { headers } from "next/headers";
import { getAllApps } from "@/lib/app-registry";
import { getAppLaunchUrl } from "@/lib/platform-urls";
import { appCardMedia } from "@/lib/app-card-media";
import { AppCard } from "@/components/app-card";

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";

  const apps = getAllApps().filter((app) => app.slug !== "auth");
  const authApps = apps.filter((a) => a.auth);
  const publicApps = apps.filter((a) => !a.auth);

  return (
    <main className="min-h-screen p-8 max-w-lp-xl mx-auto">
      <div className="mb-12 text-center">
        <span className="lp-eyebrow">Last Rev Platform</span>
        <h1 className="lp-h1">Apps</h1>
        <p className="lp-body-lg mx-auto">
          {apps.length} tools across the Last Rev platform.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-accent">Internal Apps</span>
          <span className="text-xs text-muted-foreground">({authApps.length} apps, login required)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {authApps.map((app) => (
            <AppCard
              key={app.slug}
              href={getAppLaunchUrl(app.subdomain, host)}
              name={app.name}
              subdomain={app.subdomain}
              {...appCardMedia(app.slug)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-cyan-400">Public Apps</span>
          <span className="text-xs text-muted-foreground">({publicApps.length} apps, no login needed)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {publicApps.map((app) => (
            <AppCard
              key={app.slug}
              href={getAppLaunchUrl(app.subdomain, host)}
              name={app.name}
              subdomain={app.subdomain}
              {...appCardMedia(app.slug)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
