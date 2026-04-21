import { headers } from "next/headers";
import { LoginForm } from "./login-form";
import { buildAuthLoginHref } from "@/lib/auth-login-redirect";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const loginHref = buildAuthLoginHref({
    host,
    redirectSlug: params.redirect,
  });

  return (
    <LoginForm
      loginHref={loginHref}
      error={params.error}
      redirectSlug={params.redirect}
    />
  );
}
