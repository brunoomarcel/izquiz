export type OptionItem = {
  id: number;
  label: string;
  imageUrl?: string;
  navigation?: string;
};

export type FormField = {
  id: number;
  label: string;
  type: "text" | "email" | "tel" | "number";
  placeholder: string;
  required?: boolean;
};

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
  options?: OptionItem[];
  optionsLayout?: "vertical" | "grid";
  optionsDisplayMode?: "text" | "text-image" | "image-text";
  optionsDirection?: "horizontal" | "vertical";
  optionsHoverAnimation?: "none" | "lift" | "scale";
  allowMultiple?: boolean;
  optionsShadow?: "none" | "low" | "medium" | "high";
  optionsSpacing?: "small" | "medium" | "large";
  optionsStyle?: "simple" | "rounded" | "outline";
  optionsDetail?: "none" | "icon" | "image";
  optionsDefaultTextColor?: string;
  optionsDefaultBackground?: string;
  optionsDefaultBorder?: string;
  optionsHoverTextColor?: string;
  optionsHoverBackground?: string;
  optionsHoverBorder?: string;
  optionsSelectedBackground?: string;
  optionsSelectedBorder?: string;
  formTitle?: string;
  formFields?: FormField[];
  formAlign?: "left" | "center" | "right";
  formWidth?: number;
  formButtonText?: string;
  formButtonWidth?: number;
  formSubmitAction?: "next" | "url" | "message";
  textareaLabel?: string;
  textareaPlaceholder?: string;
  textareaRequired?: boolean;
  textareaHelpText?: string;
  textareaWidth?: number;
  textareaAlign?: "left" | "center" | "right";
  textareaButtonText?: string;
  textareaButtonWidth?: number;
  textareaNavigation?: "next" | "url" | "anchor";
};

export type EditorStep = {
  id?: string;
  title: string;
  kind: string;
  active?: boolean;
  break?: boolean;
};
