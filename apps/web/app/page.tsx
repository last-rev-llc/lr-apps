import { getAllApps } from "@/lib/app-registry";
import { getAppLaunchUrl } from "@/lib/platform-urls";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription } from "@repo/ui";
import Image from "next/image";

const APP_CARD_IMAGES: Record<string, { src: string; alt: string }> = {
  "command-center": {
    src: "/images/app-cards/command-center.png",
    alt: "Dark operations room with semicircle of holographic data screens in blue and amber",
  },
  "cringe-rizzler": {
    src: "/images/app-cards/cringe-rizzler.png",
    alt: "Explosion of colorful Gen Alpha slang words in graffiti fonts on dark background",
  },
  "proper-wine-pour": {
    src: "/images/app-cards/proper-wine-pour.png",
    alt: "Red wine mid-pour through backlit crystal glass with measurement etchings and restaurant bokeh",
  },
};

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
          {authApps.map((app) => {
            const img = APP_CARD_IMAGES[app.slug];
            return (
              <a key={app.slug} href={getAppLaunchUrl(app.subdomain, host)}>
                <Card className="glass-sm hover:bg-surface-hover transition-colors h-full overflow-hidden">
                  {img && (
                    <div className="relative aspect-3/2 w-full">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{app.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {app.subdomain}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-cyan-400">Public Apps</span>
          <span className="text-xs text-muted-foreground">({publicApps.length} apps, no login needed)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {publicApps.map((app) => {
            const img = APP_CARD_IMAGES[app.slug];
            return (
              <a key={app.slug} href={getAppLaunchUrl(app.subdomain, host)}>
                <Card className="glass-sm hover:bg-surface-hover transition-colors h-full overflow-hidden">
                  {img && (
                    <div className="relative aspect-3/2 w-full">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{app.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {app.subdomain}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
