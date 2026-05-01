import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAppLaunchUrl } from "@/lib/platform-urls";

export default async function UsersRedirect() {
  const h = await headers();
  redirect(getAppLaunchUrl("crm", h.get("host") ?? ""));
}
