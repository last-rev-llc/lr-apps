"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { authHubUrl } from "@repo/auth/cluster-host";
import { selfEnrollUserIfAllowed } from "@repo/auth/self-enroll";
import { getAppBySlug } from "@/lib/app-registry";

export async function requestAppAccess(formData: FormData) {
  const slug = String(formData.get("app") ?? "").trim();
  const h = await headers();
  const host = getHostFromRequestHeaders(h);
  if (!slug) redirect(authHubUrl(host, "/my-apps"));

  const auth0 = getAuth0ClientForHost(host);
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    redirect(authHubUrl(host, `/login?redirect=${encodeURIComponent(slug)}`));
  }

  const ok = await selfEnrollUserIfAllowed(session.user.sub, slug);
  if (!ok) {
    redirect(
      authHubUrl(
        host,
        `/unauthorized?app=${encodeURIComponent(slug)}&error=closed`,
      ),
    );
  }

  const app = getAppBySlug(slug);
  if (app) {
    const sub = app.postEnrollPath?.replace(/^\/+/, "").trim();
    if (sub) {
      redirect(`/${app.routeGroup}/${sub}`);
    }
    redirect(`/${app.routeGroup}`);
  }
  redirect("/my-apps");
}
