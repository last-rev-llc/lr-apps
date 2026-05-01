"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, Input, Label } from "@repo/ui";
import { TemplateGallery } from "./template-gallery";
import type { MemeTemplate } from "../lib/types";

export interface MemeEditorProps {
  templates: MemeTemplate[];
  initialTemplateId?: string;
}

function defaultZoneText(template: MemeTemplate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const zone of template.textZones) {
    out[zone.id] = zone.defaultText ?? "";
  }
  return out;
}

export function MemeEditor({ templates, initialTemplateId }: MemeEditorProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialTemplateId ?? templates[0]?.id,
  );

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId),
    [templates, selectedId],
  );

  const [zoneText, setZoneText] = useState<Record<string, string>>(() =>
    selected ? defaultZoneText(selected) : {},
  );

  function onSelect(templateId: string) {
    const next = templates.find((t) => t.id === templateId);
    if (!next) return;
    setSelectedId(templateId);
    // Resetting zones to the new template's defaults is the cleanest UX —
    // see issue #318 acceptance criterion: "Selecting a template updates
    // the editor's text-zone inputs to that template's zones".
    setZoneText(defaultZoneText(next));
  }

  function onZoneChange(zoneId: string, value: string) {
    setZoneText((prev) => ({ ...prev, [zoneId]: value }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Templates</h2>
        <TemplateGallery
          templates={templates}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
      {selected && (
        <Card className="self-start">
          <CardContent className="space-y-3 p-4">
            <h2 className="text-base font-semibold text-foreground">
              {selected.name}
            </h2>
            {selected.textZones.map((zone) => {
              const inputId = `zone-${zone.id}`;
              return (
                <div key={zone.id} className="space-y-1">
                  <Label htmlFor={inputId}>{zone.label}</Label>
                  <Input
                    id={inputId}
                    value={zoneText[zone.id] ?? ""}
                    onChange={(e) => onZoneChange(zone.id, e.target.value)}
                    placeholder={zone.defaultText ?? zone.label}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
