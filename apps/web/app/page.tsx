import { getAllApps } from "@/lib/app-registry";
import { Card, CardHeader, CardTitle, CardDescription } from "@repo/ui";

const CATEGORY_COLORS: Record<string, string> = {
  full: "text-accent",
  minimal: "text-cyan-400",
};

export default function Home() {
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
            <a key={app.slug} href={`https://${app.subdomain}.lastrev.com`}>
              <Card className="glass-sm hover:bg-surface-hover transition-colors h-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{app.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {app.subdomain}.lastrev.com
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
            <a key={app.slug} href={`https://${app.subdomain}.lastrev.com`}>
              <Card className="glass-sm hover:bg-surface-hover transition-colors h-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{app.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {app.subdomain}.lastrev.com
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
