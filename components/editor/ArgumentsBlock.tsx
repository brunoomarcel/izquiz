"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ImagePickerModal } from "./ImagePickerModal";
import type { ArgumentItem, CanvasBlock } from "./types";

const defaultArguments: ArgumentItem[] = [
  { id: 1, title: "Argumento 1", description: "Descrição do argumento 1" },
  { id: 2, title: "Argumento 2", description: "Descrição do argumento 2" },
];

function getArguments(block: CanvasBlock) {
  return block.arguments?.length ? block.arguments : defaultArguments;
}

function getImageUrl(url?: string) {
  if (!url) return undefined;
  if (!url.startsWith("data:image/svg+xml")) return url;
  try { const separator = url.indexOf(","); const svg = decodeURIComponent(url.slice(separator + 1)).replace(/fill=(['"])white\1/gi, "fill='transparent'"); return `data:image/svg+xml,${encodeURIComponent(svg)}`; } catch { return url; }
}

function ArgumentIcon({ type }: { type: "duplicate" | "delete" | "chevron" }) {
  if (type === "duplicate") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
  if (type === "delete") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>;
}

export function ArgumentsBlock({ block, onNotify }: { block: CanvasBlock; onNotify: (message: string) => void }) {
  const items = getArguments(block);
  const mode = block.argumentsDisplayMode ?? "text-image";
  const columns = block.argumentsLayout ?? "2";
  const style = { "--argument-title": block.argumentsTitleColor ?? "#2c2c3c", "--argument-description": block.argumentsDescriptionColor ?? "#266dff", "--argument-background": block.argumentsBackground ?? "#ffffff", "--argument-border": block.argumentsBorder ?? "#cad9ff", "--argument-hover-background": block.argumentsHoverBackground ?? "#eff2f8", "--argument-hover-border": block.argumentsHoverBorder ?? "#2c2c3c" } as React.CSSProperties;
  return <div className={`canvas-arguments argument-columns-${columns} argument-mode-${mode}`} style={style}>
    {items.map((argument) => <button type="button" className="argument-card" key={argument.id} onClick={(event) => { event.stopPropagation(); onNotify(argument.navigation === "url" ? "Navegação do argumento configurada" : "Argumento selecionado"); }}>
      <div className="argument-copy"><strong>{argument.title}</strong><span>{argument.description}</span></div>
      {mode !== "list" && (argument.imageUrl ? <img src={getImageUrl(argument.imageUrl)} alt="" /> : <div className="argument-image-placeholder"><span>▧</span><small>Adicione uma imagem para<br />ilustrar este argumento</small></div>)}
    </button>)}
  </div>;
}

export function ArgumentsProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const items = getArguments(block);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "design">("config");
  const updateItems = (next: ArgumentItem[]) => onBlockChange({ arguments: next });
  const updateItem = (index: number, patch: Partial<ArgumentItem>) => updateItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addItem = () => { const id = Math.max(0, ...items.map((item) => item.id)) + 1; updateItems([...items, { id, title: `Argumento ${id}`, description: `Descrição do argumento ${id}` }]); setExpandedIndex(items.length); };
  const duplicateItem = (index: number) => { const item = items[index]; if (!item) return; const id = Math.max(0, ...items.map((current) => current.id)) + 1; updateItems([...items.slice(0, index + 1), { ...item, id, title: `${item.title} (cópia)` }, ...items.slice(index + 1)]); };
  const removeItem = (index: number) => { if (items.length <= 1) return; updateItems(items.filter((_, itemIndex) => itemIndex !== index)); setExpandedIndex(null); };
  const color = (label: string, value: string, key: keyof CanvasBlock) => <label className="arguments-color-field"><span>{label}</span><div><input type="color" value={value.startsWith("#") ? value : "#2c2c3c"} onChange={(event) => onBlockChange({ [key]: event.target.value })} /><input value={value} onChange={(event) => onBlockChange({ [key]: event.target.value })} /></div></label>;

  return <div className="arguments-properties"><div className="properties-tabs"><button className={activeTab === "config" ? "active" : ""} type="button" onClick={() => setActiveTab("config")}>Configuração</button><button className={activeTab === "design" ? "active" : ""} type="button" onClick={() => setActiveTab("design")}>Design</button></div>{activeTab === "config" ? <><div className="property-section arguments-manager"><label>Lista de Argumentos</label><div className="arguments-list">{items.map((item, index) => <div className="argument-editor" key={item.id}><div className="argument-editor-header"><strong>{item.title}</strong><button type="button" className="argument-icon-button" onClick={() => duplicateItem(index)}><ArgumentIcon type="duplicate" /></button><button type="button" className="argument-icon-button argument-delete-button" onClick={() => removeItem(index)}><ArgumentIcon type="delete" /></button><button type="button" className="argument-icon-button" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}><ArgumentIcon type="chevron" /></button></div>{expandedIndex === index && <div className="argument-editor-body"><label>Imagem<button type="button" className="image-upload-control" onClick={() => setImageIndex(index)}>↥<span>Clique para fazer upload<br />ou arraste uma imagem aqui</span></button>{item.imageUrl && <button type="button" className="remove-image-btn" onClick={() => updateItem(index, { imageUrl: undefined })}>Remover imagem</button>}</label><label>Título<textarea value={item.title} onChange={(event) => updateItem(index, { title: event.target.value })} /></label><label>Descrição<textarea value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} /></label><label>Tipo de Navegação<select value={item.navigation ?? "next"} onChange={(event) => updateItem(index, { navigation: event.target.value })}><option value="next">Navegação para a próxima etapa</option><option value="url">Abrir um link</option><option value="anchor">Ir para um componente</option></select></label></div>}</div>)}<button type="button" className="add-option-btn" onClick={addItem}>＋ Adicionar Novo Argumento</button></div></div><div className="property-section"><label>Modo de Exibição</label><small>Como os argumentos serão exibidos</small><select value={block.argumentsDisplayMode ?? "text-image"} onChange={(event) => onBlockChange({ argumentsDisplayMode: event.target.value as CanvasBlock["argumentsDisplayMode"] })}><option value="text-image">Texto - Imagem</option><option value="image-text">Imagem - Texto</option><option value="list">Lista</option></select></div><div className="property-section"><label>Layout</label><small>Organização dos argumentos na tela</small><select value={block.argumentsLayout ?? "2"} onChange={(event) => onBlockChange({ argumentsLayout: event.target.value as CanvasBlock["argumentsLayout"] })}><option value="1">1 Coluna</option><option value="2">2 Colunas</option><option value="3">3 Colunas</option><option value="4">4 Colunas</option></select></div></> : <div className="arguments-design-preview"><strong>Design</strong>{color("Cor do Título", block.argumentsTitleColor ?? "#2c2c3c", "argumentsTitleColor")}{color("Cor da Descrição", block.argumentsDescriptionColor ?? "#266dff", "argumentsDescriptionColor")}{color("Cor de Fundo", block.argumentsBackground ?? "#ffffff", "argumentsBackground")}{color("Cor da Borda", block.argumentsBorder ?? "#cad9ff", "argumentsBorder")}{color("Cor de Fundo no Hover", block.argumentsHoverBackground ?? "#eff2f8", "argumentsHoverBackground")}{color("Cor da Borda no Hover", block.argumentsHoverBorder ?? "#2c2c3c", "argumentsHoverBorder")}</div>}{imageIndex !== null && <ImagePickerModal onCancel={() => setImageIndex(null)} onSelect={(url) => { updateItem(imageIndex, { imageUrl: url }); setImageIndex(null); }} />}</div>;
}
