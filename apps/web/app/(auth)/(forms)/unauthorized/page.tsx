import { headers } from "next/headers";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { isSelfEnrollAllowedForSlug } from "@repo/auth/self-enroll";
import { Button } from "@repo/ui";
import { getAppBySlug } from "@/lib/app-registry";
import { requestAppAccess } from "./actions";

export const dynamic = "force-dynamic";

function externalLinkProps(href: string) {
  if (href.startsWith("http")) {
    return { target: "_blank" as const, rel: "noopener noreferrer" as const };
  }
  return {};
}

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string; error?: string }>;
}) {
  const { app: appSlug, error } = await searchParams;
  const app = appSlug ? getAppBySlug(appSlug) : undefined;
  const gate = app?.accessRequest;

  const h = await headers();
  const auth0 = getAuth0ClientForHost(getHostFromRequestHeaders(h));
  const session = await auth0.getSession();
  const signedIn = Boolean(session?.user);

  const signupHref = appSlug
    ? `/signup?redirect=${encodeURIComponent(appSlug)}`
    : "/signup";
  const loginHref = appSlug
    ? `/login?redirect=${encodeURIComponent(appSlug)}`
    : "/login";

  const canRequestAccess =
    Boolean(appSlug) && isSelfEnrollAllowedForSlug(appSlug!);

  const showDevEnrollHint =
    process.env.NODE_ENV === "development" &&
    error === "closed" &&
    !gate;

  // Friendly self-enroll prompt: signed-in user landing on a free-tier (or
  // explicitly allowed) app for the first time. Reads as an invitation, not
  // a denial.
  if (signedIn && canRequestAccess && !error && !gate) {
    const appName = app?.name ?? "this app";
    return (
      <div className="text-center max-w-md mx-auto">
        <h1 className="font-heading text-2xl text-accent mb-2">
          Open {appName}?
        </h1>
        <p className="text-muted-foreground mb-6">
          {appName} is free. Click below and we’ll set you up.
        </p>

        <div className="flex flex-col gap-3">
          <form action={requestAppAccess}>
            <input type="hidden" name="app" value={appSlug} />
            <Button type="submit" className="w-full">
              Open {appName}
            </Button>
          </form>
          <Button asChild variant="outline" className="w-full">
            <a href="/my-apps">Back to My Apps</a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Wrong account?{" "}
          <a href="/auth/logout" className="underline hover:text-foreground">
            Sign out
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto">
      <h1 className="font-heading text-2xl text-accent mb-2">
        {signedIn
          ? app
            ? `Access required — ${app.name}`
            : "Access required"
          : "Sign in or sign up"}
      </h1>

      {error === "closed" && (
        <div className="mb-4 space-y-3 text-left">
          <p className="text-muted-foreground text-sm">
            {gate?.description ??
              "We couldn’t turn on access automatically. If this product has checkout or a waitlist, use the button below; otherwise ask a Last Rev admin to add you."}
          </p>
          {gate ? (
            <Button asChild className="w-full">
              <a href={gate.href} {...externalLinkProps(gate.href)}>
                {gate.label}
              </a>
            </Button>
          ) : null}
          {showDevEnrollHint ? (
            <p className="text-xs text-muted-foreground">
              Dev: add{" "}
              <code className="bg-muted px-1 rounded">{appSlug}</code> to{" "}
              <code className="bg-muted px-1 rounded">
                APP_SELF_ENROLL_SLUGS
              </code>{" "}
              or grant in{" "}
              <code className="bg-muted px-1 rounded">app_permissions</code>.
            </p>
          ) : null}
        </div>
      )}

      <p className="text-muted-foreground text-sm mb-2">
        You use one Auth0 account for every app. Each product still needs access
        turned on once (self-service where allowed, checkout, or an admin).
      </p>
      <p className="text-muted-foreground mb-6">
        {app
          ? `You need access to ${app.name}.`
          : "You need permission to open this app."}
        {signedIn
          ? " You’re already signed in — use the options below, or sign out to use a different account."
          : " Sign in with your existing account, or sign up if you’re new."}
      </p>

      <div className="flex flex-col gap-3">
        {signedIn && canRequestAccess && (
          <form action={requestAppAccess}>
            <input type="hidden" name="app" value={appSlug} />
            <Button type="submit" className="w-full">
              Request access
            </Button>
          </form>
        )}

        {signedIn && gate && error !== "closed" ? (
          <Button
            asChild
            variant={canRequestAccess ? "outline" : "default"}
            className="w-full"
          >
            <a href={gate.href} {...externalLinkProps(gate.href)}>
              {gate.label}
            </a>
          </Button>
        ) : null}

        {!signedIn && (
          <>
            <Button asChild className="w-full">
              <a href={loginHref}>Sign in</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={signupHref}>Sign up</a>
            </Button>
          </>
        )}

        <Button asChild variant="outline" className="w-full">
          <a href="/auth/logout">Sign out and try another account</a>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <a href="/my-apps">Back to My Apps</a>
        </Button>
      </div>

      {signedIn && appSlug && !canRequestAccess && !gate && error !== "closed" ? (
        <p className="text-xs text-muted-foreground mt-6">
          Self-service access is not available for{" "}
          {app ? app.name : "this app"}. Please contact a Last Rev admin to
          request access.
        </p>
      ) : null}
    </div>
  );
}
