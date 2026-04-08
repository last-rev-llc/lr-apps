"use client";

import { Button } from "@repo/ui";

export function LoginForm({
  loginHref,
  error,
  redirectSlug,
}: {
  loginHref: string;
  error?: string;
  redirectSlug?: string;
}) {
  return (
    <div>
      <h1 className="font-heading text-2xl text-accent mb-1 text-center">
        Sign In
      </h1>
      <p className="text-muted-foreground text-sm text-center mb-6">
        Access your Last Rev apps with Auth0
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error === "forbidden"
            ? "You do not have access to that app."
            : error === "session_expired"
              ? "Your session expired — please sign in again."
              : error}
        </div>
      )}

      <Button asChild className="w-full">
        <a href={loginHref}>Continue with Auth0</a>
      </Button>

      <p className="text-sm text-muted-foreground text-center mt-6">
        New here?{" "}
        <a
          href={redirectSlug ? `/signup?redirect=${encodeURIComponent(redirectSlug)}` : "/signup"}
          className="text-accent hover:underline"
        >
          Create an account
        </a>
      </p>
    </div>
  );
}
