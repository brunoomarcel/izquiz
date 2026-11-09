"use client";

import { useState } from "react";
import type { CanvasBlock } from "./types";

function AlertIcon({ type }: { type: NonNullable<CanvasBlock["alertIcon"]> }) {
  const paths = {
    attention: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></>,
    success: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    error: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.2.9-1.7 1.3-1.7 2.7M12 17h.01" /></>,
    close: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
    none: null,
  };
  return <svg className="alert-block-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export function AlertBlock({ block }: { block: CanvasBlock }) {
  const icon = block.alertIcon ?? "info";
  const align = block.alertAlign ?? "center";
  const width = block.alertWidth ?? 100;
  return <div className={`canvas-alert alert-align-${align} alert-icon-${block.alertIconPosition ?? "left"}`} style={{ width: `${width}%`, marginLeft: align === "right" || align === "center" ? "auto" : "0", marginRight: align === "left" || align === "center" ? "auto" : "0", background: block.alertThemeColor ?? "#cad9ff", border: block.alertBorderEnabled === false ? "none" : `1px solid ${block.alertBorderColor ?? "#266dff"}`, color: block.alertIconColor ?? "#266dff", "--alert-icon-size": `${block.alertIconSize ?? 24}px` } as React.CSSProperties}><span className="alert-block-content">{icon !== "none" && <AlertIcon type={icon} />}<strong style={{ color: "#111827" }}>{block.content}</strong></span></div>;
}

export function AlertProperties({ block, onTextChange, onBlockChange }: { block: CanvasBlock; onTextChange: (value: string) => void; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const [activeTab, setActiveTab] = useState<"config" | "design">("config");
  const icons: Array<[NonNullable<CanvasBlock["alertIcon"]>, string]> = [["attention", "Atenção"], ["info", "Informação"], ["success", "Sucesso"], ["error", "Erro"], ["help", "Ajuda"], ["close", "Fechar"]];
  return <div className="alert-properties"><div className="properties-tabs"><button type="button" className={activeTab === "config" ? "active" : ""} onClick={() => setActiveTab("config")}>Configurações</button><button type="button" className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button></div>{activeTab === "config" ? <><div className="property-section"><label>Título</label><input value={block.content} onChange={(event) => onTextChange(event.target.value)} /></div><div className="property-section"><label>Alinhamento Horizontal</label><div className="alignment-buttons"><button type="button" className={block.alertAlign === "left" ? "active" : ""} onClick={() => onBlockChange({ alertAlign: "left" })}>≡</button><button type="button" className={!block.alertAlign || block.alertAlign === "center" ? "active" : ""} onClick={() => onBlockChange({ alertAlign: "center" })}>≡</button><button type="button" className={block.alertAlign === "right" ? "active" : ""} onClick={() => onBlockChange({ alertAlign: "right" })}>≡</button></div></div><div className="property-section"><label>Largura Personalizada <output>{block.alertWidth ?? 100}%</output></label><input type="range" min="20" max="100" value={block.alertWidth ?? 100} onChange={(event) => onBlockChange({ alertWidth: Number(event.target.value) })} /></div><div className="property-section"><label>Ícones</label><div className="alert-icon-grid">{icons.map(([type, label]) => <button type="button" key={type} className={(block.alertIcon ?? "info") === type ? "active" : ""} onClick={() => onBlockChange({ alertIcon: type })}><AlertIcon type={type} /><span>{label}</span></button>)}</div><button type="button" className="outline-btn" onClick={() => onBlockChange({ alertIcon: "none" })}>Remover ícone</button></div></> : <div className="alert-design"><ColorField label="Cor do Tema" value={block.alertThemeColor ?? "#cad9ff"} onChange={(value) => onBlockChange({ alertThemeColor: value })} /><ColorField label="Cor da Borda" value={block.alertBorderColor ?? "#266dff"} onChange={(value) => onBlockChange({ alertBorderColor: value })} /><div className="toggle-row"><div><label>Borda</label><small>Exibir a borda do alerta</small></div><button type="button" className={block.alertBorderEnabled === false ? "toggle" : "toggle on"} onClick={() => onBlockChange({ alertBorderEnabled: block.alertBorderEnabled === false })}>{block.alertBorderEnabled === false ? "" : ""}</button></div><ColorField label="Cor do Ícone" value={block.alertIconColor ?? "#266dff"} onChange={(value) => onBlockChange({ alertIconColor: value })} /><div className="property-section"><label>Tamanho do Ícone <output>{block.alertIconSize ?? 24}px</output></label><input type="range" min="16" max="40" value={block.alertIconSize ?? 24} onChange={(event) => onBlockChange({ alertIconSize: Number(event.target.value) })} /></div><div className="property-section"><label>Posição do Ícone</label><select value={block.alertIconPosition ?? "left"} onChange={(event) => onBlockChange({ alertIconPosition: event.target.value as CanvasBlock["alertIconPosition"] })}><option value="left">Esquerda</option><option value="right">Direita</option></select></div></div>}</div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="alert-color-field"><span>{label}</span><div><input type="color" value={value.startsWith("#") ? value : "#266dff"} onChange={(event) => onChange(event.target.value)} /><input value={value} onChange={(event) => onChange(event.target.value)} /></div></label>;
}
