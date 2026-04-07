"use client";

import { Button } from "@repo/ui";

export function SignupForm({
  signupHref,
  redirectSlug,
}: {
  signupHref: string;
  redirectSlug?: string;
}) {
  return (
    <div>
      <h1 className="font-heading text-2xl text-accent mb-1 text-center">
        Create Account
      </h1>
      <p className="text-muted-foreground text-sm text-center mb-6">
        Sign up with Auth0 to use Last Rev apps
      </p>

      <Button asChild className="w-full">
        <a href={signupHref}>Sign up with Auth0</a>
      </Button>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Already have an account?{" "}
        <a
          href={
            redirectSlug
              ? `/login?redirect=${encodeURIComponent(redirectSlug)}`
              : "/login"
          }
          className="text-accent hover:underline"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
