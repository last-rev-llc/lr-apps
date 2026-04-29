"use client";

import Image from "next/image";
import { useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@repo/ui";

interface AppCardProps {
  href: string;
  name: string;
  subdomain: string;
  imageSrc?: string;
  videoSrc?: string;
  alt?: string;
}

export function AppCard({ href, name, subdomain, imageSrc, videoSrc, alt }: AppCardProps) {
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

  return (
    <a href={href} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Card className="glass-sm hover:bg-surface-hover transition-colors h-full overflow-hidden">
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
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={imageSrc}
                alt={alt ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            )}
          </div>
        )}
        <CardHeader className="p-4">
          <CardTitle className="text-sm">{name}</CardTitle>
          <CardDescription className="text-xs">{subdomain}</CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}
