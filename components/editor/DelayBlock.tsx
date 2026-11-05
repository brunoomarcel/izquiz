import type { CanvasBlock } from "./types";

function formatDelay(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function DelayBlock({ block }: { block: CanvasBlock }) {
  const seconds = block.delaySeconds ?? 60;
  return <div className="canvas-delay"><strong>Delay</strong><span>Pausa de {formatDelay(seconds)} antes dos próximos componentes</span></div>;
}

export function DelayProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  return <div className="delay-properties"><div className="property-section"><label>Tempo de Delay</label><input type="number" min="0" step="1" value={block.delaySeconds ?? 60} onChange={(event) => onBlockChange({ delaySeconds: Math.max(0, Number(event.target.value) || 0) })} /></div><div className="delay-notice"><strong>Aviso</strong><p>Este componente não aparece no quiz, apenas no dashboard. Todos os componentes abaixo do delay vão respeitar o tempo e só aparecer depois desse tempo.</p></div></div>;
}
