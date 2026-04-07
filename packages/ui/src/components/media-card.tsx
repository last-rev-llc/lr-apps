import * as React from "react";
import { cn } from "../lib/utils";

export interface MediaCardProps {
  src: string;
  alt?: string;
  title: string;
  description?: string;
  type?: "image" | "video";
  tags?: string[];
  date?: string;
  onClick?: () => void;
  className?: string;
}

const TYPE_ICONS: Record<string, string> = {
  image: "🖼️",
  video: "🎬",
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MediaCard({
  src,
  alt,
  title,
  description,
  type = "image",
  tags,
  date,
  onClick,
  className,
}: MediaCardProps) {
  const formattedDate = formatDate(date);
  const typeIcon = TYPE_ICONS[type] ?? "📁";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group overflow-hidden rounded-xl border border-white/10 bg-white/5",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)]",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        {src ? (
          <img
            src={src}
            alt={alt ?? title}
            loading="lazy"
            className="block aspect-[16/10] w-full bg-white/5 object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-5xl text-white/20">
            {typeIcon}
          </div>
        )}
        {type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <svg className="ml-1 h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-3.5 pt-3">
        <div className="mb-1 truncate text-sm font-semibold text-white" title={title}>
          {title}
        </div>

        {description && (
          <p className="mb-2 line-clamp-2 text-xs text-white/50">{description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>{typeIcon} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
          {formattedDate && <span>{formattedDate}</span>}
        </div>

        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded px-1.5 py-0.5 text-[10px] text-white/40 bg-white/6"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
