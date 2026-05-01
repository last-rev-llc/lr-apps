import { getContacts } from "./lib/queries";
import { CrmApp } from "./components/crm-app";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const contacts = await getContacts();
  return <CrmApp initialContacts={contacts} />;
}
