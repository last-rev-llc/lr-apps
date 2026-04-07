import * as React from "react";
import { cn } from "../lib/utils";

export interface TimelineEvent {
  date?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn("relative pl-8", className)}>
      {/* Vertical line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-white/10" aria-hidden />

      {events.map((event, i) => (
        <div key={i} className="relative pb-7 last:pb-0">
          {/* Marker */}
          <div className="absolute -left-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400 bg-slate-900 text-xs font-bold text-amber-400">
            {event.icon ?? <span>{i + 1}</span>}
          </div>

          <div className="pl-2">
            {event.date && (
              <div className="mb-0.5 text-xs text-white/40 uppercase tracking-wider">
                {event.date}
              </div>
            )}
            <div className="font-semibold text-white">{event.title}</div>
            {event.description && (
              <div className="mt-1 text-sm text-white/50 leading-relaxed">
                {event.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
