import type { CanvasBlock, EditorStep } from "@/components/editor/types";

type EditorDocumentCache = {
  steps: EditorStep[];
  blocksByStep: Record<string, CanvasBlock[]>;
};

function cacheKey(funnelId: string) {
  return `izquiz:editor-document:${funnelId}`;
}

export function readEditorDocumentCache(funnelId: string): EditorDocumentCache | null {
  if (typeof window === "undefined") return null;
  try {
    const data = JSON.parse(window.localStorage.getItem(cacheKey(funnelId)) ?? "null") as EditorDocumentCache | null;
    return data?.steps && data.blocksByStep ? data : null;
  } catch {
    return null;
  }
}

export function writeEditorDocumentCache(funnelId: string, document: EditorDocumentCache) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cacheKey(funnelId), JSON.stringify(document));
}
