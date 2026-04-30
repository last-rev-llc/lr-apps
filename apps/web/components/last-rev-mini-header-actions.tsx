"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";

export type MiniHeaderUser = {
  name?: string;
  email?: string;
  picture?: string;
};

function initials(name: string | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0];
    const b = parts[1]?.[0];
    return ((a ?? "") + (b ?? "")).toUpperCase() || "?";
  }
  if (email?.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "?";
}

export function LastRevMiniHeaderActions({
  platformBaseUrl,
  catalogUrl,
  user,
}: {
  platformBaseUrl: string;
  catalogUrl: string;
  user: MiniHeaderUser | null;
}) {
  const myAppsHref = `${platformBaseUrl}/my-apps`;
  const logoutHref = `${platformBaseUrl}/auth/logout`;

  if (!user?.email && !user?.name) {
    return (
      <Link
        href={`${platformBaseUrl}/login`}
        className="inline-flex items-center px-6 py-2.5 rounded-[10px] bg-[image:var(--gradient-accent)] text-black font-bold text-[13px] shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all hover:-translate-y-px hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <Link
        href={myAppsHref}
        className="hidden sm:inline text-sm text-white/50 hover:text-white font-medium transition-colors"
      >
        My apps
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Account menu"
          >
            <Avatar className="h-9 w-9">
              {user.picture ? (
                <AvatarImage src={user.picture} alt="" />
              ) : null}
              <AvatarFallback className="text-xs bg-surface-raised">
                {initials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              {user.name ? (
                <span className="text-sm font-medium truncate">{user.name}</span>
              ) : null}
              {user.email ? (
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={catalogUrl}>All apps</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={myAppsHref}>My apps</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={logoutHref}>Sign out</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
