import { getTranslations } from "next-intl/server";
import { getWinePours, getWallPosts } from "./lib/queries";
import { WineApp } from "./components/wine-app";
import restaurantsData from "./data/restaurants.json";
import type { Restaurant } from "./lib/types";

export const dynamic = "force-dynamic";

export default async function ProperWinePourPage() {
  const [pourLogs, wallPosts] = await Promise.all([
    getWinePours(),
    getWallPosts(),
  ]);
  const t = await getTranslations("proper-wine-pour.page");

  const restaurants = restaurantsData as Restaurant[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl" style={{ color: "var(--color-pill-6)" }}>
          {t("heading")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>
      <WineApp
        restaurants={restaurants}
        initialPourLogs={pourLogs}
        initialWallPosts={wallPosts}
      />
    </div>
  );
}
