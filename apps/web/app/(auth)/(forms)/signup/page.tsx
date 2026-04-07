import { headers } from "next/headers";
import { SignupForm } from "./signup-form";
import { buildAuthLoginHref } from "@/lib/auth-login-redirect";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const signupHref = buildAuthLoginHref({
    host,
    redirectSlug: params.redirect,
    screenHint: "signup",
  });

  return <SignupForm signupHref={signupHref} redirectSlug={params.redirect} />;
}
