import { headers } from "next/headers";
import Link from "next/link";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getAppsCatalogUrl, getPlatformBaseUrl } from "@/lib/platform-urls";
import { LastRevLogo } from "./last-rev-logo";
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
    <header className="sticky top-0 z-100 bg-[rgba(8,8,15,0.35)] backdrop-blur-[20px] border-b border-white/5">
      <div className="px-5 sm:px-10 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link
            href={catalogUrl}
            className="text-white shrink-0 inline-flex items-center"
            aria-label="Last Rev"
          >
            <LastRevLogo className="h-8 w-auto" />
          </Link>
          <nav className="hidden sm:flex items-center gap-8 text-sm min-w-0">
            <Link
              href={`${platformBaseUrl}/my-apps`}
              className="text-white/50 hover:text-white font-medium transition-colors truncate"
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
