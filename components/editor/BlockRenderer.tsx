import type { ReactNode } from "react";
import type { CanvasBlock } from "./types";
import { ButtonBlock } from "./ButtonBlock";
import { ImageBlock } from "./ImageBlock";
import { TextBlock } from "./TextBlock";

type BlockRendererProps = {
  block: CanvasBlock;
  isEditing: boolean;
  onChange: (content: string) => void;
  onStopEditing: () => void;
  onNotify: (message: string) => void;
};

export function BlockRenderer({ block, isEditing, onChange, onStopEditing, onNotify }: BlockRendererProps): ReactNode {
  if (block.item === "Texto") return <TextBlock block={block} isEditing={isEditing} onChange={onChange} onStopEditing={onStopEditing} />;
  if (block.item === "Imagem") return <ImageBlock block={block} />;
  if (block.item === "Botão") return <ButtonBlock block={block} onNotify={onNotify} />;
  return null;
}
