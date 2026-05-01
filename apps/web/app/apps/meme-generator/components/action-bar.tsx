"use client";

import { Button } from "@repo/ui";

export interface ActionBarProps {
  onSave: () => void;
  onDownload: () => void;
  onCopy: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
}

export function ActionBar({
  onSave,
  onDownload,
  onCopy,
  saveDisabled = false,
  saving = false,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        onClick={onSave}
        disabled={saveDisabled || saving}
        data-testid="action-save"
      >
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onDownload}
        data-testid="action-download"
      >
        Download
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onCopy}
        data-testid="action-copy"
      >
        Copy
      </Button>
    </div>
  );
}
