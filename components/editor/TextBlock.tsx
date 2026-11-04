import type { CSSProperties } from "react";
import type { CanvasBlock } from "./types";

type TextBlockProps = {
  block: CanvasBlock;
  isEditing: boolean;
  onChange: (content: string) => void;
  onStopEditing: () => void;
};

export function TextBlock({ block, isEditing, onChange, onStopEditing }: TextBlockProps) {
  const textStyle: CSSProperties = {
    fontWeight: block.bold ? 700 : 400,
    fontStyle: block.italic ? "italic" : "normal",
    textDecoration: block.underline ? "underline" : "none",
    fontSize: `${block.fontSize ?? 16}px`,
  };

  if (isEditing) {
    return <textarea className="canvas-text-editor" style={textStyle} autoFocus value={block.content} onClick={(event) => event.stopPropagation()} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") onStopEditing(); }} />;
  }

  return <p className="canvas-text-content" style={textStyle}>{block.content}</p>;
}
