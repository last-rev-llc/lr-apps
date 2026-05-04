import type { ReactNode } from "react";
import { getShowcaseSections, type AppConfig } from "@/lib/app-registry";

type AppShowcaseGroupedGridsProps = {
  apps: AppConfig[];
  renderCard: (app: AppConfig) => ReactNode;
  /**
   * Use `2` on the main apps index (category titles are page section headings).
   * Use `3` under “Your apps” / “Other apps” so document outline stays nested.
   */
  headingLevel?: 2 | 3;
};

export function AppShowcaseGroupedGrids({
  apps,
  renderCard,
  headingLevel = 2,
}: AppShowcaseGroupedGridsProps) {
  const sections = getShowcaseSections(apps);
  const HeadingTag = headingLevel === 3 ? "h3" : "h2";
  const headingClass =
    headingLevel === 3
      ? "text-base font-medium mb-3 text-foreground/90"
      : "text-lg font-medium mb-4 text-foreground/90";
  const blockClass = headingLevel === 3 ? "mb-8 last:mb-0" : "mb-10 last:mb-0";

  return (
    <>
      {sections.map(({ group, label, apps: groupApps }) => (
        <div key={group} className={blockClass}>
          <HeadingTag className={headingClass}>{label}</HeadingTag>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {groupApps.map((app) => (
              <div key={app.slug}>{renderCard(app)}</div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
