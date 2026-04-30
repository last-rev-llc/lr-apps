"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
  /** Disable the built-in mobile hamburger menu (renders nav inline at all sizes). */
  disableMobileMenu?: boolean;
  className?: string;
}

export function Topbar({ title, children, disableMobileMenu = false, className }: TopbarProps) {
  const [open, setOpen] = React.useState(false);
  const hasNav = Boolean(children);

  return (
    <header
      className={cn(
        "glass relative flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2",
        className,
      )}
    >
      <span className="font-semibold text-white truncate">{title}</span>

      {hasNav && !disableMobileMenu && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 hover:text-white"
        >
          <span aria-hidden className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
      )}

      {hasNav && (
        <nav
          className={cn(
            "items-center gap-2",
            disableMobileMenu
              ? "flex flex-wrap"
              : cn(
                  "hidden md:flex md:flex-row",
                  open && "flex w-full flex-col items-stretch order-3 md:w-auto md:flex-row md:items-center md:order-none",
                ),
          )}
        >
          {children}
        </nav>
      )}
    </header>
  );
}
