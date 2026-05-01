"use client";

import { Badge, Card } from "@repo/ui";
import { publicMemeTemplateUrl } from "../lib/template-thumbnail";
import type { MemeTemplate } from "../lib/types";

export interface TemplateGalleryProps {
  templates: MemeTemplate[];
  selectedId?: string;
  onSelect: (templateId: string) => void;
}

function groupByCategory(
  templates: MemeTemplate[],
): Array<{ category: string; items: MemeTemplate[] }> {
  const map = new Map<string, MemeTemplate[]>();
  for (const t of templates) {
    const key = t.category || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export function TemplateGallery({
  templates,
  selectedId,
  onSelect,
}: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No templates available yet
        </p>
      </Card>
    );
  }

  const groups = groupByCategory(templates);

  return (
    <div className="space-y-6" data-testid="template-gallery">
      {groups.map(({ category, items }) => (
        <section key={category} aria-labelledby={`tg-${category}`}>
          <div className="mb-2 flex items-center justify-between">
            <h3
              id={`tg-${category}`}
              className="text-sm font-semibold capitalize text-foreground"
            >
              {category}
            </h3>
            <span className="text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((template) => {
              const isSelected = template.id === selectedId;
              return (
                <button
                  key={template.id}
                  type="button"
                  data-testid={`template-card-${template.id}`}
                  data-selected={isSelected ? "true" : "false"}
                  onClick={() => onSelect(template.id)}
                  className={[
                    "group flex flex-col items-stretch gap-2 rounded-lg border p-2 text-left transition-colors",
                    isSelected
                      ? "border-primary ring-2 ring-primary"
                      : "border-surface-border hover:border-primary/40 hover:bg-surface-hover",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {template.imagePath ? (
                    <img
                      src={publicMemeTemplateUrl(template.imagePath)}
                      alt={template.name}
                      width={template.imageWidth}
                      height={template.imageHeight}
                      className="aspect-[4/3] w-full rounded-md object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      data-testid={`template-swatch-${template.id}`}
                      className="aspect-[4/3] w-full rounded-md flex items-center justify-center text-sm font-bold"
                      style={{
                        background: template.backgroundColor ?? "transparent",
                        color: template.defaultTextColor,
                      }}
                    >
                      {template.name}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-foreground">
                      {template.name}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
