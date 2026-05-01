import { z } from "zod";

export const ContactTypeEnum = z.enum([
  "team",
  "client",
  "prospect",
  "partner",
  "vendor",
  "contractor",
  "personal",
  "other",
]);

export const ContactInputSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  type: ContactTypeEnum.nullable().optional(),
  avatar: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  slack_id: z.string().nullable().optional(),
  slack_handle: z.string().nullable().optional(),
  github_handle: z.string().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  twitter_handle: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

export const InsightsSchema = z.object({
  confidence: z.enum(["high", "medium", "low"]),
  summary: z.string().min(1).max(280),
  bestApproach: z.string().min(1).max(280),
  communicationStyle: z.object({
    formality: z.string().nullable(),
    tone: z.string().nullable(),
    responseSpeed: z.string().nullable(),
    preferredChannel: z.string().nullable(),
  }),
  personality: z.object({
    decisionStyle: z.string().nullable(),
    detailOrientation: z.string().nullable(),
    conflictStyle: z.string().nullable(),
    motivators: z.array(z.string()).max(6),
    stressors: z.array(z.string()).max(6),
  }),
  interests: z.object({
    professional: z.array(z.string()).max(8),
    personal: z.array(z.string()).max(8),
    sharedWithAdam: z.array(z.string()).max(6),
  }),
  conversationStarters: z.array(z.string()).max(6),
  topicsToAvoid: z.array(z.string()).max(6),
});
