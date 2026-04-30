"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  /** Controlled open state for the mobile drawer (<md). */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  /** Render the built-in mobile trigger button (only visible <md). */
  showMobileTrigger?: boolean;
  className?: string;
}

export function Sidebar({
  items,
  collapsed = false,
  onToggle,
  mobileOpen,
  onMobileOpenChange,
  showMobileTrigger = false,
  className,
}: SidebarProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = mobileOpen !== undefined;
  const open = isControlled ? mobileOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onMobileOpenChange?.(next);
  };

  return (
    <>
      {showMobileTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          aria-expanded={open}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 hover:text-white"
        >
          <span aria-hidden className="text-lg">☰</span>
        </button>
      )}

      {/* Mobile drawer overlay (<md) */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role={showMobileTrigger || isControlled ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Primary navigation"
        className={cn(
          // Mobile drawer (<md): fixed off-canvas, slide in/out
          "glass fixed left-0 top-0 z-50 flex h-full max-w-[85vw] flex-col border-r border-white/10 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop (md+): static, normal flow
          "md:static md:z-auto md:translate-x-0 md:max-w-none",
          collapsed ? "md:w-14" : "md:w-56",
          // Mobile width when open
          collapsed ? "w-14" : "w-56",
          className,
        )}
      >
        <div className="flex items-center justify-between md:justify-end px-3 h-10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden text-white/70 hover:text-white text-lg"
          >
            ✕
          </button>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="hidden md:inline-flex text-white/50 hover:text-white text-sm"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span>{collapsed ? "→" : "←"}</span>
            </button>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2 overflow-y-auto">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                item.active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.icon && (
                <span className="flex-shrink-0 text-base">{item.icon}</span>
              )}
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
