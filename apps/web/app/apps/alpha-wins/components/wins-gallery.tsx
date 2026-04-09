"use client";

import { useState, useMemo } from "react";
import {
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";

interface Win {
  id: string;
  name: string;
  icon: string;
  type?: string;
  description: string;
  integrations?: string[];
  skills?: string[];
  tags?: string[];
  howItWorks?: string[];
  prompt?: string;
  postedAt?: string;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface WinsGalleryProps {
  wins: Win[];
}

export function WinsGallery({ wins }: WinsGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIntegration, setActiveIntegration] = useState("All");
  const [selectedWin, setSelectedWin] = useState<Win | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const allIntegrations = useMemo(() => {
    const set = new Set<string>();
    wins.forEach((w) => (w.integrations ?? []).forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [wins]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return wins.filter((w) => {
      if (activeIntegration !== "All" && !(w.integrations ?? []).includes(activeIntegration)) {
        return false;
      }
      if (q) {
        return (
          w.name.toLowerCase().includes(q) ||
          (w.description ?? "").toLowerCase().includes(q) ||
          (w.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (w.integrations ?? []).some((i) => i.toLowerCase().includes(q)) ||
          (w.skills ?? []).some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [wins, searchQuery, activeIntegration]);

  function handleCopyPrompt(prompt: string | undefined) {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    });
  }

  function handleOpenWin(win: Win) {
    setSelectedWin(win);
    setCopyState("idle");
  }

  return (
    <>
      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search wins…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm bg-white/5 border-white/10 placeholder:text-muted-foreground"
          />
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} win{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Integration filter pills */}
        {allIntegrations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveIntegration("All")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeIntegration === "All"
                  ? "bg-accent text-black"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              All
            </button>
            {allIntegrations.map((int) => (
              <button
                key={int}
                onClick={() => setActiveIntegration(int)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  activeIntegration === int
                    ? "bg-accent text-black"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <p>No wins match that filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((win) => (
              <button
                key={win.id}
                onClick={() => handleOpenWin(win)}
                className="glass text-left p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-[var(--radius-glass)]"
              >
                {/* Card top */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-2xl leading-none">{win.icon}</span>
                  <span className="font-bold text-foreground text-sm flex-1 font-[family-name:var(--font-heading)]">
                    {win.name}
                  </span>
                  {win.postedAt && (
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-auto shrink-0">
                      {formatDate(win.postedAt)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-3">
                  {win.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(win.integrations ?? []).map((x) => (
                    <span
                      key={x}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent/15 text-accent"
                    >
                      {x}
                    </span>
                  ))}
                  {(win.skills ?? []).map((x) => (
                    <span
                      key={x}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue/15 text-blue"
                    >
                      {x}
                    </span>
                  ))}
                  {(win.tags ?? []).map((x) => (
                    <span
                      key={x}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-muted-foreground"
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedWin} onOpenChange={(open) => !open && setSelectedWin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-white/10">
          {selectedWin && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  {selectedWin.icon} {selectedWin.name}
                </DialogTitle>
              </DialogHeader>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {(selectedWin.integrations ?? []).map((x) => (
                  <span
                    key={x}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent/15 text-accent"
                  >
                    {x}
                  </span>
                ))}
                {(selectedWin.skills ?? []).map((x) => (
                  <span
                    key={x}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue/15 text-blue"
                  >
                    {x}
                  </span>
                ))}
                {(selectedWin.tags ?? []).map((x) => (
                  <span
                    key={x}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-muted-foreground"
                  >
                    {x}
                  </span>
                ))}
                {selectedWin.postedAt && (
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {formatDate(selectedWin.postedAt)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-foreground leading-relaxed text-sm">
                {selectedWin.description}
              </p>

              {/* How it works */}
              {(selectedWin.howItWorks ?? []).length > 0 && (
                <div>
                  <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">
                    How it works
                  </p>
                  <div className="space-y-2">
                    {selectedWin.howItWorks!.map((step, i) => (
                      <div key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-black text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required integrations section */}
              {(selectedWin.integrations ?? []).length > 0 && (
                <div>
                  <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">
                    Required Integrations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWin.integrations!.map((x) => (
                      <Badge key={x} variant="outline" className="border-accent/30 text-accent">
                        {x}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills section */}
              {(selectedWin.skills ?? []).length > 0 && (
                <div>
                  <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWin.skills!.map((x) => (
                      <Badge key={x} variant="outline" className="border-blue/30 text-blue">
                        {x}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Setup Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-accent text-xs uppercase tracking-widest font-semibold">
                    Setup Prompt
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-white/10 hover:bg-white/5"
                    onClick={() => handleCopyPrompt(selectedWin.prompt)}
                  >
                    {copyState === "copied" ? "✅ Copied!" : "📋 Copy Prompt"}
                  </Button>
                </div>
                <pre className="bg-black/30 border border-white/10 rounded-lg p-4 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
                  {selectedWin.prompt ?? "No prompt available."}
                </pre>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
