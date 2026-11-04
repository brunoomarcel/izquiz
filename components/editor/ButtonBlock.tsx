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
  };

  return <button className="canvas-button" style={buttonStyle} onClick={(event) => { event.stopPropagation(); onNotify(block.navigation === "url" ? "Navegação por link configurada" : "Próxima etapa configurada"); }}>{block.content}</button>;
}
