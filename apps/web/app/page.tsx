import { getAllApps } from "@/lib/app-registry";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription } from "@repo/ui";

function getAppUrl(subdomain: string, host: string): string {
  // localhost / dev — use ?app= query param
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    const port = host.split(":")[1] ?? "3000";
    return `http://localhost:${port}?app=${subdomain}`;
  }

  // Vercel preview / branch deploys — use ?app= since no wildcard subdomain
  if (host.includes("vercel.app")) {
    return `https://${host}?app=${subdomain}`;
  }

  // Production — use subdomain
  const baseDomain = host.replace(/^[^.]+\./, "");
  return `https://${subdomain}.${baseDomain}`;
}

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";

  const apps = getAllApps().filter((app) => app.slug !== "auth");
  const authApps = apps.filter((a) => a.auth);
  const publicApps = apps.filter((a) => !a.auth);

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-4xl text-accent mb-2">Last Rev Apps</h1>
        <p className="text-muted-foreground">
          {apps.length} apps across the Last Rev platform
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-accent">Internal Apps</span>
          <span className="text-xs text-muted-foreground">({authApps.length} apps, login required)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {authApps.map((app) => (
            <a key={app.slug} href={getAppUrl(app.subdomain, host)}>
              <Card className="glass-sm hover:bg-surface-hover transition-colors h-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{app.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {app.subdomain}
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-cyan-400">Public Apps</span>
          <span className="text-xs text-muted-foreground">({publicApps.length} apps, no login needed)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {publicApps.map((app) => (
            <a key={app.slug} href={getAppUrl(app.subdomain, host)}>
              <Card className="glass-sm hover:bg-surface-hover transition-colors h-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{app.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {app.subdomain}
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
