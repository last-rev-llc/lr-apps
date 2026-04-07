import { getAppPermissions } from "./lib/queries";
import { AppAccessApp } from "./components/app-access-app";

export const dynamic = "force-dynamic";

export default async function AppAccessPage() {
  const permissions = await getAppPermissions();
  return <AppAccessApp initialPermissions={permissions} />;
}
