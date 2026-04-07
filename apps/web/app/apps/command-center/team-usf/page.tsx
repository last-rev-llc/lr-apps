import { getTeamUsfMembers } from "./lib/queries";
import { TeamUsfApp } from "./components/team-usf-app";

export const dynamic = "force-dynamic";

export default async function TeamUsfPage() {
  const members = await getTeamUsfMembers();
  return <TeamUsfApp initialMembers={members} />;
}
