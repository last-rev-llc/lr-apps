import { getAllApps } from "@/lib/app-registry";
import { getAppLaunchUrl } from "@/lib/platform-urls";
import { headers } from "next/headers";
import { AppCard } from "@/components/app-card";

// Alt text per slug. Only slugs listed here render an image; the corresponding
// file is expected at /images/app-cards/<slug>.png. Source: prompts.csv alt_text column.
const APP_CARD_ALT: Record<string, string> = {
  "age-of-apes": "Game-art battlefield with ape silhouettes, volcanic lava, HUD calculator icon, and cyan tech frame",
  "ai-calculator": "Holographic ROI dashboard with 340% line graph and violet-emerald bar charts above dark desk",
  "alpha-wins": "Gold and amber particle burst around a glass trophy shape on dark background",
  "area-52": "Classified folder with amber light and hazard tape on dark steel desk with redacted documents",
  "brommie-quake": "Kid on field with arms raised leading a stadium wave at golden hour with teal Earthquakes crowd",
  "command-center": "Dark operations room with semicircle of holographic data screens in blue and amber",
  "cringe-rizzler": "Chaotic explosion of colorful Gen Alpha slang in graffiti fonts with comic-book energy",
  "dad-joke-of-the-day": "Leather recliner under comedy spotlight with speech bubbles and World's Okayest Dad mug",
  "daily-updates": "Horizontal light streams in amber emerald and blue flowing across dark background",
  "generations": "Neon timeline of generational icons from rotary phone to holographic glasses with speech bubbles",
  "hspt-practice": "Scantron answer sheet with pencil and bold HSPT Practice title on golden yellow background",
  "hspt-tutor": "Open textbook with holographic adaptive learning path nodes glowing above it",
  "lighthouse": "Lighthouse on rocky coast casting amber beam through fog with floating performance metrics",
  "meeting-summaries": "Conference table with holographic summary display glowing amber among coffee cups and notebooks",
  "proper-wine-pour": "Red wine mid-pour into crystal glass with warm restaurant bokeh and elegant serif title",
  "roblox-dances": "Pixel-art characters dancing on neon disco floor with colorful spotlight beams",
  "sales": "Glowing sales pipeline visualization with amber and emerald stages on dark surface",
  "sentiment": "Colorful mood waveform landscape with emoji faces at peaks and valleys on dark background",
  "slang-translator": "Split screen with pink Gen Alpha slang and amber Gen X translations divided by decoder motif",
  "soccer-training": "Soccer ball on training field at dusk with agility cones and amber floodlight God-rays",
  "sprint-planning": "Top-down kanban board with glowing task cards in amber violet and emerald on dark surface",
  "standup": "Three stacked message bubbles in violet emerald and amber with standup text on dark background",
  "summaries": "Layered translucent documents with amber extract lines converging into a clean summary card",
  "superstars": "Profile card on pedestal under amber and blue spotlights with gold Superstars title on dark stage",
  "travel-collection": "Luxury travel flat-lay with compass, passport, aviator sunglasses, boarding pass, and hotel key on dark surface",
  "uptime": "Emerald uptime dashboard with 99.97% gauge, green waveform, red incident dots, and service labels",
};

// Slugs that have a hover-to-play loop video at /images/app-cards/<slug>.mp4.
// The PNG of the same slug is used as the poster (still frame) when not playing.
const APP_CARD_VIDEO_SLUGS = new Set([
  "area-52",
  "cringe-rizzler",
  "dad-joke-of-the-day",
  "daily-updates",
  "generations",
  "hspt-practice",
  "lighthouse",
  "proper-wine-pour",
  "roblox-dances",
  "sentiment",
  "superstars",
]);

function appCardMedia(slug: string): { imageSrc?: string; videoSrc?: string; alt?: string } {
  const alt = APP_CARD_ALT[slug];
  if (!alt) return {};
  const imageSrc = `/images/app-cards/${slug}.png`;
  const videoSrc = APP_CARD_VIDEO_SLUGS.has(slug) ? `/images/app-cards/${slug}.mp4` : undefined;
  return { imageSrc, videoSrc, alt };
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
