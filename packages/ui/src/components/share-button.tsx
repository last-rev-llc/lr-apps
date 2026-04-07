"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ShareButtonProps {
  url?: string;
  text?: string;
  className?: string;
}

type SharePlatform = "copy" | "twitter" | "facebook" | "reddit" | "native";

export function ShareButton({ url, text = "", className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(shareUrl);

  const platformUrls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`,
    reddit: `https://www.reddit.com/submit?title=${encoded}&url=${encodedUrl}`,
  };

  async function handleShare(platform: SharePlatform) {
    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback: nothing to do
      }
      return;
    }

    if (platform === "native" && typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: text, text, url: shareUrl }).catch(() => {});
      return;
    }

    const dest = platformUrls[platform];
    if (dest) {
      window.open(dest, "_blank", "width=600,height=400");
    }
  }

  const btnClass = cn(
    "flex items-center justify-center rounded-lg border border-white/15 bg-white/8 p-2",
    "text-white/60 transition-all duration-150 hover:border-white/30 hover:bg-white/12 hover:text-white",
  );

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Copy */}
      <button
        onClick={() => handleShare("copy")}
        title="Copy to clipboard"
        aria-label="Copy to clipboard"
        className={cn(btnClass, copied && "border-emerald-500/50 text-emerald-400")}
      >
        {copied ? (
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>

      {/* Twitter / X */}
      <button
        onClick={() => handleShare("twitter")}
        title="Share on X / Twitter"
        aria-label="Share on X / Twitter"
        className={btnClass}
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      </button>

      {/* Facebook */}
      <button
        onClick={() => handleShare("facebook")}
        title="Share on Facebook"
        aria-label="Share on Facebook"
        className={btnClass}
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </button>

      {/* Reddit */}
      <button
        onClick={() => handleShare("reddit")}
        title="Share on Reddit"
        aria-label="Share on Reddit"
        className={btnClass}
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Native share */}
      <button
        onClick={() => handleShare("native")}
        title="Share via..."
        aria-label="Share via..."
        className={btnClass}
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
    </div>
  );
}
