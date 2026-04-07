import { getMeetings } from "./lib/queries";
import { MeetingsApp } from "./components/meetings-app";

export const dynamic = "force-dynamic";

export default async function MeetingSummariesPage() {
  const meetings = await getMeetings();

  return <MeetingsApp initialMeetings={meetings} />;
}
