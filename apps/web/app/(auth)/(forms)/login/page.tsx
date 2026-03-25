import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  return <LoginForm searchParams={searchParams} />;
}
