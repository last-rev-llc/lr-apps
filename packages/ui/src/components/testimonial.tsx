import * as React from "react";
import { cn } from "../lib/utils";

interface TestimonialProps {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  className?: string;
}

export function Testimonial({ quote, author, role, avatar, className }: TestimonialProps) {
  return (
    <figure
      className={cn(
        "glass-sm rounded-xl border border-white/10 p-6",
        className,
      )}
    >
      <div className="mb-1 text-5xl leading-none text-amber-400/50">&ldquo;</div>
      <blockquote className="mb-5 text-base italic leading-relaxed text-white/90">
        {quote}
      </blockquote>
      <figcaption className="flex items-center gap-3">
        {avatar && (
          <img
            src={avatar}
            alt={author}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            loading="lazy"
          />
        )}
        <div>
          <div className="text-sm font-semibold text-white">{author}</div>
          {role && <div className="text-xs text-white/50">{role}</div>}
        </div>
      </figcaption>
    </figure>
  );
}
