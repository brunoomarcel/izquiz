import type { CanvasBlock } from "@/components/editor/types";

type PersistedBlock = {
  id: string;
  step_id: string;
  position: number;
  block_type: string;
  content: unknown;
};

type ClonableBlock = {
  position: number;
  block_type: string;
  content: unknown;
};

export function buildClonedBlockRows(stepId: string, blocks: ClonableBlock[]) {
  return [...blocks]
    .sort((left, right) => left.position - right.position)
    .map((block, position) => ({
      step_id: stepId,
      position,
      block_type: block.block_type,
      content: block.content,
    }));
}

export function groupBlocksByStep(stepIds: string[], rows: PersistedBlock[]): Record<string, CanvasBlock[]> {
  const document = Object.fromEntries(stepIds.map((stepId) => [stepId, [] as CanvasBlock[]])) as Record<string, CanvasBlock[]>;

  rows.forEach((row) => {
    const payload = (row.content ?? {}) as Record<string, unknown>;
    const block: CanvasBlock = {
      id: row.position + 1,
      blockId: row.id,
      item: row.block_type,
      content: typeof payload.content === "string" ? payload.content : row.block_type,
      ...payload,
    } as CanvasBlock;
    (document[row.step_id] ??= []).push(block);
  });

  Object.values(document).forEach((blocks) => blocks.sort((left, right) => left.id - right.id));

  return document;
}

export function serializeCanvasBlocks(stepId: string, blocks: CanvasBlock[]) {
  return blocks.map((block, position) => {
    const properties = { ...block } as Record<string, unknown>;
    const blockId = block.blockId;
    const item = block.item;
    const content = block.content;
    delete properties.id;
    delete properties.blockId;
    delete properties.item;
    delete properties.content;
    return {
      id: blockId,
      step_id: stepId,
      position,
      block_type: item,
      content: { content, ...properties },
    };
  });
}

export function legacyTextBlocksToRows(stepId: string, legacy: unknown, firstPosition: number) {
  if (!Array.isArray(legacy)) return [];
  return legacy.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const value = entry as Record<string, unknown>;
    if (value.type !== "text" || typeof value.content !== "string") return [];
    const properties = Object.fromEntries(Object.entries(value).filter(([key]) => !["type", "content"].includes(key)));
    return [{ step_id: stepId, position: firstPosition + index, block_type: "Texto", content: { ...properties, content: value.content } }];
  });
}
