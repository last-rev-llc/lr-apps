"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { selfEnrollUserIfAllowed } from "@repo/auth/self-enroll";
import { getAppBySlug } from "@/lib/app-registry";

export async function requestAppAccess(formData: FormData) {
  const slug = String(formData.get("app") ?? "").trim();
  if (!slug) redirect("/my-apps");

  const h = await headers();
  const auth0 = getAuth0ClientForHost(getHostFromRequestHeaders(h));
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    redirect(`/login?redirect=${encodeURIComponent(slug)}`);
  }

  const ok = await selfEnrollUserIfAllowed(session.user.sub, slug);
  if (!ok) {
    redirect(`/unauthorized?app=${encodeURIComponent(slug)}&error=closed`);
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
