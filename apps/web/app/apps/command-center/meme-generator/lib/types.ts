export type TextZoneAlign = "left" | "center" | "right";
export type TextZoneVAlign = "top" | "middle" | "bottom";

export interface TextZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  align: TextZoneAlign;
  vAlign?: TextZoneVAlign;
  fontSize?: number;
  color?: string;
  uppercase?: boolean;
  defaultText?: string;
}

export interface MemeTemplate {
  id: string;
  name: string;
  imagePath?: string;
  imageWidth: number;
  imageHeight: number;
  backgroundColor?: string;
  defaultTextColor: string;
  textZones: TextZone[];
  // Legacy color-scheme decoration drawn under the text zones when no
  // imagePath is set. Optional; image-driven templates ignore it.
  legacyEmoji?: string;
}
