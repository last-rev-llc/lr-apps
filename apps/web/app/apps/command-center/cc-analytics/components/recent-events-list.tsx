import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import type { RecentEvent } from "../lib/types";

interface Props {
  events: RecentEvent[];
}

export function RecentEventsList({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No recent events.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>User (sha256)</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Slug</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((e, i) => (
          <TableRow key={`${e.timestamp}-${i}`}>
            <TableCell className="text-xs whitespace-nowrap">
              {new Date(e.timestamp).toLocaleString()}
            </TableCell>
            <TableCell className="text-xs font-mono truncate max-w-[160px]">
              {e.userIdHash.slice(0, 12) || "—"}
            </TableCell>
            <TableCell className="text-xs">{e.event}</TableCell>
            <TableCell className="text-xs">{e.slug ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
