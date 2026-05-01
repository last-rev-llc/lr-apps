"use client";

import type { Contact, ContactType } from "../lib/types";

export interface ContactDetailProps {
  contact: Contact | null;
  onClose: () => void;
}

export function ContactDetail(_props: ContactDetailProps) {
  return null;
}

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return <span className="text-xs text-white/60">{type}</span>;
}
