"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label, Textarea } from "@repo/ui";
import { ContactInputSchema, type ContactInput } from "../lib/schemas";
import type { ContactType } from "../lib/types";

const CONTACT_TYPES: Array<{ value: ContactType | ""; label: string }> = [
  { value: "", label: "—" },
  { value: "team", label: "Team" },
  { value: "client", label: "Client" },
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "vendor", label: "Vendor" },
  { value: "contractor", label: "Contractor" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  type: ContactType | "";
  avatar: string;
  location: string;
  timezone: string;
  slack_id: string;
  slack_handle: string;
  github_handle: string;
  linkedin_url: string;
  twitter_handle: string;
  website: string;
  tags: string;
  notes: string;
}

function initialFromValues(values?: Partial<ContactInput>): FormState {
  return {
    name: values?.name ?? "",
    email: values?.email ?? "",
    phone: values?.phone ?? "",
    title: values?.title ?? "",
    company: values?.company ?? "",
    type: (values?.type as ContactType | undefined) ?? "",
    avatar: values?.avatar ?? "",
    location: values?.location ?? "",
    timezone: values?.timezone ?? "",
    slack_id: values?.slack_id ?? "",
    slack_handle: values?.slack_handle ?? "",
    github_handle: values?.github_handle ?? "",
    linkedin_url: values?.linkedin_url ?? "",
    twitter_handle: values?.twitter_handle ?? "",
    website: values?.website ?? "",
    tags: (values?.tags ?? []).join(", "),
    notes: values?.notes ?? "",
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function buildInput(form: FormState): Record<string, unknown> {
  return {
    name: form.name.trim(),
    email: emptyToNull(form.email),
    phone: emptyToNull(form.phone),
    title: emptyToNull(form.title),
    company: emptyToNull(form.company),
    type: form.type === "" ? null : form.type,
    avatar: emptyToNull(form.avatar),
    location: emptyToNull(form.location),
    timezone: emptyToNull(form.timezone),
    slack_id: emptyToNull(form.slack_id),
    slack_handle: emptyToNull(form.slack_handle),
    github_handle: emptyToNull(form.github_handle),
    linkedin_url: emptyToNull(form.linkedin_url),
    twitter_handle: emptyToNull(form.twitter_handle),
    website: emptyToNull(form.website),
    tags: parseTags(form.tags),
    notes: emptyToNull(form.notes),
  };
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export interface ContactFormProps {
  initialValues?: Partial<ContactInput>;
  onSubmit: (input: ContactInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ContactForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
}: ContactFormProps) {
  const [form, setForm] = useState<FormState>(() => initialFromValues(initialValues));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setFormError(null);
    setFieldErrors({});

    const candidate = buildInput(form);
    const result = ContactInputSchema.safeParse(candidate);

    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save contact";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(name: keyof FormState): string | undefined {
    return fieldErrors[name as string]?.[0];
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name" required error={fieldError("name")}>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            maxLength={200}
          />
        </Field>

        <Field label="Type" error={fieldError("type")}>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value as ContactType | "")}
            className={SELECT_CLASS}
          >
            {CONTACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Email" error={fieldError("email")}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>

        <Field label="Phone" error={fieldError("phone")}>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>

        <Field label="Title" error={fieldError("title")}>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </Field>

        <Field label="Company" error={fieldError("company")}>
          <Input
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </Field>

        <Field label="Location" error={fieldError("location")}>
          <Input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </Field>

        <Field label="Timezone" error={fieldError("timezone")}>
          <Input
            value={form.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            placeholder="e.g. America/New_York"
          />
        </Field>
      </div>

      <Field label="Avatar URL" error={fieldError("avatar")}>
        <Input
          type="url"
          value={form.avatar}
          onChange={(e) => update("avatar", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="LinkedIn URL" error={fieldError("linkedin_url")}>
          <Input
            type="url"
            value={form.linkedin_url}
            onChange={(e) => update("linkedin_url", e.target.value)}
          />
        </Field>

        <Field label="Website" error={fieldError("website")}>
          <Input
            type="url"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </Field>

        <Field label="GitHub handle" error={fieldError("github_handle")}>
          <Input
            value={form.github_handle}
            onChange={(e) => update("github_handle", e.target.value)}
            placeholder="octocat"
          />
        </Field>

        <Field label="Twitter handle" error={fieldError("twitter_handle")}>
          <Input
            value={form.twitter_handle}
            onChange={(e) => update("twitter_handle", e.target.value)}
            placeholder="jack"
          />
        </Field>

        <Field label="Slack handle" error={fieldError("slack_handle")}>
          <Input
            value={form.slack_handle}
            onChange={(e) => update("slack_handle", e.target.value)}
          />
        </Field>

        <Field label="Slack ID" error={fieldError("slack_id")}>
          <Input
            value={form.slack_id}
            onChange={(e) => update("slack_id", e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Tags"
        hint="Comma-separated"
        error={fieldError("tags")}
      >
        <Input
          value={form.tags}
          onChange={(e) => update("tags", e.target.value)}
          placeholder="founder, ai, fintech"
        />
      </Field>

      <Field label="Notes" error={fieldError("notes")}>
        <Textarea
          rows={4}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : (submitLabel ?? "Save")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
        {hint && <span className="ml-2 font-normal text-muted-foreground">({hint})</span>}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
