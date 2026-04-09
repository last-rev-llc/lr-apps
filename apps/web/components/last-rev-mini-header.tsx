import { headers } from "next/headers";
import Link from "next/link";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getAppsCatalogUrl, getPlatformBaseUrl } from "@/lib/platform-urls";
import { LastRevMiniHeaderActions } from "./last-rev-mini-header-actions";

export async function LastRevMiniHeader() {
  const h = await headers();
  const host = getHostFromRequestHeaders(h);
  const platformBaseUrl = getPlatformBaseUrl(host);
  const catalogUrl = getAppsCatalogUrl(host);

  const auth0 = getAuth0ClientForHost(host);
  const session = await auth0.getSession();
  const u = session?.user;

  const user =
    u &&
    (typeof u.email === "string" || typeof u.name === "string")
      ? {
          name: typeof u.name === "string" ? u.name : undefined,
          email: typeof u.email === "string" ? u.email : undefined,
          picture: typeof u.picture === "string" ? u.picture : undefined,
        }
      : null;

  return (
    <header className="glass-header sticky top-0 z-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={catalogUrl}
            className="font-heading text-sm text-accent hover:opacity-90 transition-opacity shrink-0"
          >
            Last Rev
          </Link>
          <span className="text-border hidden sm:inline">|</span>
          <nav className="flex items-center gap-2 text-xs min-w-0">
            <Link
              href={`${platformBaseUrl}/my-apps`}
              className="text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <LastRevMiniHeaderActions
          platformBaseUrl={platformBaseUrl}
          catalogUrl={catalogUrl}
          user={user}
        />
      </div>
    </header>
  );
}
