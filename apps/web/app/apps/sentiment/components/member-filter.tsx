"use client";

interface MemberFilterProps {
  members: string[];
  value: string;
  onChange: (value: string) => void;
}

export function MemberFilter({ members, value, onChange }: MemberFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="glass-sm px-3 py-1.5 text-sm rounded-md bg-surface border border-surface-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="all">All Members</option>
      {members.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}
