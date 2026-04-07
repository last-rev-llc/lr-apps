export type ScriptCategory =
  | "all"
  | "content"
  | "data"
  | "automation"
  | "analysis"
  | "utility";

export interface AiScript {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  code?: string | null;
  language?: string | null;
  tags?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}
