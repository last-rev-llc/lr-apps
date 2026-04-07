import { getContacts } from "./lib/queries";
import { UsersApp } from "./components/users-app";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const contacts = await getContacts();

  return <UsersApp initialContacts={contacts} />;
}
