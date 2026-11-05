/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import type { CanvasBlock } from "./types";
import { BlockIcon } from "./BlockIcon";

type ImageBlockProps = {
  block: CanvasBlock;
};

export function ImageBlock({ block }: ImageBlockProps) {
  const align = block.imageAlign ?? "center";
  const imageStyle: CSSProperties = {
    width: `${block.imageWidth ?? 100}%`,
    height: `${block.imageHeight ?? 220}px`,
    objectFit: "cover",
    objectPosition: align,
    marginLeft: align === "right" || align === "center" ? "auto" : "0",
    marginRight: align === "left" || align === "center" ? "auto" : "0",
  };

  if (!block.imageUrl) {
    return <div className="canvas-media-placeholder"><BlockIcon item="Imagem" /><strong>Sem imagem</strong><small>Selecione uma imagem no painel direito</small></div>;
  }

  return <img className="canvas-image" src={block.imageUrl} alt="Imagem do quiz" style={imageStyle} />;
}
