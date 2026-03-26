export type MediaType =
  | "Image"
  | "Video"
  | "GIF"
  | "Audio"
  | "PDF"
  | "Presentation";

export type ViewMode = "grid" | "list";

export type TypeFilter = "All" | MediaType;

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  file: string;
  thumbnail?: string | null;
  tags?: string[] | null;
  created?: string | null;
}
