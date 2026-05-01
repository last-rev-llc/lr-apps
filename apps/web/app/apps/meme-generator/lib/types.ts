// Single source of truth for meme-generator UI consumers. Mirrors the DB
// row types so client components don't import from @repo/db directly.
export type {
  MemeTemplateRow as MemeTemplate,
  MemeCreationRow as MemeCreation,
  MemeTextZone as TextZone,
} from "@repo/db/types";
