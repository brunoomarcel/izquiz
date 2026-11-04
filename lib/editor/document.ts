import type { CanvasBlock } from "@/components/editor/types";

type PersistedBlock = {
  step_id: string;
  position: number;
  block_type: string;
  content: unknown;
};

export function groupBlocksByStep(stepIds: string[], rows: PersistedBlock[]): Record<string, CanvasBlock[]> {
  const document = Object.fromEntries(stepIds.map((stepId) => [stepId, [] as CanvasBlock[]])) as Record<string, CanvasBlock[]>;

  rows.forEach((row) => {
    const payload = (row.content ?? {}) as Record<string, unknown>;
    const block: CanvasBlock = {
      id: row.position + 1,
      item: row.block_type,
      content: typeof payload.content === "string" ? payload.content : row.block_type,
      ...payload,
    } as CanvasBlock;
    (document[row.step_id] ??= []).push(block);
  });

  return document;
}
