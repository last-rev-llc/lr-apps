"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link href={`${platformBaseUrl}/login`}>Sign in</Link>
        </Button>
      </div>
    );
  }

  const label = user.name?.trim() || user.email || "Account";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href={myAppsHref}
        className="hidden sm:inline text-xs text-muted-foreground hover:text-accent transition-colors"
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
            <Avatar className="h-8 w-8">
              {user.picture ? (
                <AvatarImage src={user.picture} alt="" />
              ) : null}
              <AvatarFallback className="text-[10px] bg-surface-raised">
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
