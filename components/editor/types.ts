export type CanvasBlock = {
  id: number;
  item: string;
  content: string;
  width?: number;
  align?: "left" | "center" | "right";
  navigation?: string;
  sticky?: boolean;
  anchor?: boolean;
  delay?: string;
  script?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  imageUrl?: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: number;
  imageHeight?: number;
  videoPlatform?: "muve" | "youtube" | "vturb";
  videoEmbed?: string;
};

export type EditorStep = {
  id?: string;
  title: string;
  kind: string;
  active?: boolean;
  break?: boolean;
};
