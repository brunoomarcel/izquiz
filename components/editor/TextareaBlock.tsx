"use client";

import type { CanvasBlock } from "./types";

export function TextareaBlock({ block, onNotify }: { block: CanvasBlock; onNotify: (message: string) => void }) {
  const align = block.textareaAlign ?? "center";
  const width = block.textareaWidth ?? 100;
  const buttonWidth = block.textareaButtonWidth ?? 50;
  const marginLeft = align === "right" || align === "center" ? "auto" : "0";
  const marginRight = align === "left" || align === "center" ? "auto" : "0";

  return <form className="canvas-textarea-block" style={{ width: `${width}%`, marginLeft, marginRight }} onSubmit={(event) => { event.preventDefault(); onNotify(block.textareaNavigation === "url" ? "Navegação por link configurada" : "Resposta enviada"); }} onClick={(event) => event.stopPropagation()}>
    <label>{block.textareaLabel ?? "Observações"}<textarea required={block.textareaRequired} placeholder={block.textareaPlaceholder ?? "Digite sua mensagem"} /></label>
    <span className="textarea-help">{block.textareaHelpText ?? "Opcional"}</span>
    <button type="submit" style={{ width: `${buttonWidth}%`, marginLeft, marginRight }}>{block.textareaButtonText ?? "Enviar"}</button>
  </form>;
}

export function TextareaProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  return <div className="textarea-properties"><div className="properties-tabs"><button className="active" type="button">Configurações</button><button type="button">Design</button></div><div className="property-section"><label>Label</label><input value={block.textareaLabel ?? "Observações"} onChange={(event) => onBlockChange({ textareaLabel: event.target.value })} /></div><div className="property-section"><label>Placeholder</label><input value={block.textareaPlaceholder ?? "Digite sua mensagem"} onChange={(event) => onBlockChange({ textareaPlaceholder: event.target.value })} /></div><div className="toggle-row"><div><label>Obrigatório</label></div><button type="button" className={block.textareaRequired ? "toggle on" : "toggle"} onClick={() => onBlockChange({ textareaRequired: !block.textareaRequired })} /></div><div className="property-section"><label>Ajuda (helpText)</label><input value={block.textareaHelpText ?? "Opcional"} onChange={(event) => onBlockChange({ textareaHelpText: event.target.value })} /></div><div className="property-section"><label>Largura <output>{block.textareaWidth ?? 100}%</output></label><input type="range" min="20" max="100" value={block.textareaWidth ?? 100} onChange={(event) => onBlockChange({ textareaWidth: Number(event.target.value) })} /></div><div className="property-section"><label>Alinhamento</label><div className="alignment-buttons"><button type="button" className={block.textareaAlign === "left" ? "active" : ""} onClick={() => onBlockChange({ textareaAlign: "left" })}>≡</button><button type="button" className={!block.textareaAlign || block.textareaAlign === "center" ? "active" : ""} onClick={() => onBlockChange({ textareaAlign: "center" })}>≡</button><button type="button" className={block.textareaAlign === "right" ? "active" : ""} onClick={() => onBlockChange({ textareaAlign: "right" })}>≡</button></div></div><div className="property-section"><label>Texto do botão</label><input value={block.textareaButtonText ?? "Enviar"} onChange={(event) => onBlockChange({ textareaButtonText: event.target.value })} /></div><div className="property-section"><label>Largura do botão <output>{block.textareaButtonWidth ?? 50}%</output></label><input type="range" min="20" max="100" value={block.textareaButtonWidth ?? 50} onChange={(event) => onBlockChange({ textareaButtonWidth: Number(event.target.value) })} /></div><div className="property-section"><label>Tipo de navegação</label><select value={block.textareaNavigation ?? "next"} onChange={(event) => onBlockChange({ textareaNavigation: event.target.value as CanvasBlock["textareaNavigation"] })}><option value="next">Próximo passo</option><option value="url">Abrir um link</option><option value="anchor">Ir para um componente</option></select></div></div>;
}
