import type { CSSProperties } from "react";
import type { CanvasBlock } from "./types";

type ButtonBlockProps = {
  block: CanvasBlock;
  onNotify: (message: string) => void;
};

export function ButtonBlock({ block, onNotify }: ButtonBlockProps) {
  const buttonStyle: CSSProperties = {
    width: `${block.width ?? 100}%`,
    marginLeft: block.align === "right" || block.align === "center" ? "auto" : "0",
    marginRight: block.align === "left" || block.align === "center" ? "auto" : "0",
    position: block.sticky ? "sticky" : "relative",
    bottom: block.sticky ? 12 : "auto",
    background: block.buttonStyle === "outline" ? "transparent" : block.buttonColor ?? "#2f6df6",
    color: block.buttonTextColor ?? "#fff",
    border: block.buttonStyle === "outline" ? `2px solid ${block.buttonColor ?? "#2f6df6"}` : block.buttonStyle === "relief" ? `1px solid ${block.buttonColor ?? "#2f6df6"}` : "0",
    borderRadius: block.buttonStyle === "rounded" ? 28 : 12,
    boxShadow: block.buttonStyle === "relief" ? `0 6px 0 ${block.buttonColor ?? "#2058d4"}, 0 8px 12px #172b4b33` : block.buttonShadow === "none" ? "none" : block.buttonShadow === "medium" ? "0 6px 14px #172b4b33" : "0 3px 7px #172b4b22",
  };

  return <button className="canvas-button" style={buttonStyle} onClick={() => onNotify(block.navigation === "url" ? "Navegação por link configurada" : "Próxima etapa configurada")}>{block.content}</button>;
}
