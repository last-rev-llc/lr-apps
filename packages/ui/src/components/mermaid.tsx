"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface MermaidProps {
  chart: string;
  className?: string;
}

let renderCounter = 0;

export function Mermaid({ chart, className }: MermaidProps) {
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!chart) {
      setSvg(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSvg(null);

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        const isDark =
          window.matchMedia("(prefers-color-scheme: dark)").matches ||
          document.documentElement.classList.contains("dark");

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
        });

        const id = `mermaid-${++renderCounter}`;
        const { svg: rendered } = await mermaid.render(id, chart);

        if (!cancelled) {
          setSvg(rendered);
          setLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (!chart) return null;

  return (
    <div className={cn("block", className)}>
      {loading && (
        <p className="py-4 text-sm text-white/50">Loading diagram…</p>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/20 p-3 text-sm text-red-400">
          Diagram error: {error}
        </div>
      )}
      {svg && (
        <div
          className="overflow-x-auto py-2 [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}
