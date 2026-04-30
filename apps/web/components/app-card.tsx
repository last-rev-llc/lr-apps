"use client";

import Image from "next/image";
import { useRef } from "react";
import { Badge, Card, CardHeader, CardTitle, CardDescription, cn } from "@repo/ui";

interface AppCardProps {
  href: string;
  name: string;
  subdomain: string;
  imageSrc?: string;
  videoSrc?: string;
  alt?: string;
  /** Top-right pill rendered over the media (or in the header if no media). */
  badge?: { label: string; variant?: "default" | "outline"; tone?: "accent" | "muted" };
  /** Render with dashed border + reduced opacity to indicate access required. */
  locked?: boolean;
}

export function AppCard({
  href,
  name,
  subdomain,
  imageSrc,
  videoSrc,
  alt,
  badge,
  locked = false,
}: AppCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Browsers won't reliably render a frame at exact duration — back off slightly.
  const seekToEnd = (v: HTMLVideoElement) => {
    if (!Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, v.duration - 0.05);
  };

  const handleLoaded = () => {
    const v = videoRef.current;
    if (v) seekToEnd(v);
  };

  const handleEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {});
  };

  const handleLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    seekToEnd(v);
  };

  const badgeNode = badge ? (
    <Badge
      variant={badge.variant ?? "outline"}
      className={cn(
        "text-xs shrink-0 backdrop-blur-md",
        badge.tone === "accent" && "text-accent",
        badge.tone === "muted" && "text-muted-foreground",
      )}
    >
      {badge.label}
    </Badge>
  ) : null;

  return (
    <a href={href} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="block">
      <Card
        className={cn(
          "glass-sm hover:bg-surface-hover transition-colors h-full overflow-hidden",
          locked && "border-dashed opacity-90",
        )}
      >
        {imageSrc && (
          <div className="relative aspect-3/2 w-full">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                poster={imageSrc}
                aria-label={alt}
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={handleLoaded}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover",
                  locked && "grayscale",
                )}
              />
            ) : (
              <Image
                src={imageSrc}
                alt={alt ?? ""}
                fill
                className={cn("object-cover", locked && "grayscale")}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            )}
            {badgeNode && (
              <div className="absolute top-2 right-2 z-10">{badgeNode}</div>
            )}
          </div>
        )}
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">{name}</CardTitle>
            {!imageSrc && badgeNode}
          </div>
          <CardDescription className="text-xs">{subdomain}</CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}
