"use client";

import { useState } from "react";
import { ImagePickerModal } from "./ImagePickerModal";
import type { CanvasBlock, OptionItem } from "./types";

const defaultOptions: OptionItem[] = [
  { id: 1, label: "Opção 1" },
  { id: 2, label: "Opção 2" },
];

function getOptions(block: CanvasBlock) {
  return block.options?.length ? block.options : defaultOptions;
}

function getTransparentImageUrl(url?: string) {
  if (!url?.startsWith("data:image/svg+xml")) return url;
  try {
    const separator = url.indexOf(",");
    if (separator < 0) return url;
    const svg = decodeURIComponent(url.slice(separator + 1)).replace(/fill=(['"])white\1/gi, "fill='transparent'");
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch {
    return url;
  }
}

function OptionIcon({ type }: { type: "duplicate" | "delete" | "chevron" }) {
  if (type === "duplicate") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
  if (type === "delete") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>;
}

export function OptionsBlock({ block, onNotify }: { block: CanvasBlock; onNotify: (message: string) => void }) {
  const options = getOptions(block);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const direction = block.optionsDirection ?? "vertical";
  const displayMode = block.optionsDisplayMode ?? "text-image";
  const className = [
    "canvas-options",
    direction === "horizontal" ? "is-horizontal" : "",
    block.optionsHoverAnimation && block.optionsHoverAnimation !== "none" ? `hover-${block.optionsHoverAnimation}` : "",
    `shadow-${block.optionsShadow ?? "medium"}`,
    `spacing-${block.optionsSpacing ?? "medium"}`,
    `style-${block.optionsStyle ?? "simple"}`,
    `detail-${block.optionsDetail ?? "none"}`,
  ].filter(Boolean).join(" ");
  const optionStyle = {
    "--option-text": block.optionsDefaultTextColor ?? "#2c2c3c",
    "--option-background": block.optionsDefaultBackground ?? "#ffffff",
    "--option-border": block.optionsDefaultBorder ?? "#cad9ff",
    "--option-hover-text": block.optionsHoverTextColor ?? "#2c2c3c",
    "--option-hover-background": block.optionsHoverBackground ?? "#eff2f8",
    "--option-hover-border": block.optionsHoverBorder ?? "#266dff",
    "--option-selected-background": block.optionsSelectedBackground ?? "#cad9ff",
    "--option-selected-border": block.optionsSelectedBorder ?? "#266dff",
  } as React.CSSProperties;

  return <div className={className} style={{ flexDirection: direction === "horizontal" ? "row" : "column" }}>
    {options.map((option) => <button key={option.id} style={optionStyle} className={`canvas-option ${selectedIds.includes(option.id) ? "is-selected" : ""}`} onClick={(event) => { event.stopPropagation(); setSelectedIds((current) => block.allowMultiple ? current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id] : [option.id]); onNotify(option.navigation === "url" ? "Navegação por link configurada" : "Opção selecionada"); }}>
      {displayMode === "image-text" && option.imageUrl && <img src={getTransparentImageUrl(option.imageUrl)} alt="" />}
      <span>{option.label}</span>
      {displayMode === "text-image" && option.imageUrl && <img src={getTransparentImageUrl(option.imageUrl)} alt="" />}
    </button>)}
  </div>;
}

type OptionsPropertiesProps = {
  block: CanvasBlock;
  onBlockChange: (patch: Partial<CanvasBlock>) => void;
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const color = value.startsWith("#") ? value : "#2c2c3c";
  return <label className="options-color-field"><span>{label}</span><div><input type="color" value={color} onChange={(event) => onChange(event.target.value)} /><input value={value} onChange={(event) => onChange(event.target.value)} /></div></label>;
}

function OptionsDesignProperties({ block, onBlockChange }: OptionsPropertiesProps) {
  const update = (patch: Partial<CanvasBlock>) => onBlockChange(patch);
  return <div className="options-design-properties">
    <div className="design-section"><div className="design-section-title">Geral <span>⌃</span></div><label>Sombra<select value={block.optionsShadow ?? "medium"} onChange={(event) => update({ optionsShadow: event.target.value as CanvasBlock["optionsShadow"] })}><option value="none">Nenhuma</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></label><label>Espaçamento<select value={block.optionsSpacing ?? "medium"} onChange={(event) => update({ optionsSpacing: event.target.value as CanvasBlock["optionsSpacing"] })}><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select></label><label>Estética<select value={block.optionsStyle ?? "simple"} onChange={(event) => update({ optionsStyle: event.target.value as CanvasBlock["optionsStyle"] })}><option value="simple">Simples</option><option value="rounded">Arredondada</option><option value="outline">Contorno</option></select></label><label>Detalhe<select value={block.optionsDetail ?? "none"} onChange={(event) => update({ optionsDetail: event.target.value as CanvasBlock["optionsDetail"] })}><option value="none">Sem detalhe</option><option value="icon">Ícone</option><option value="image">Imagem</option></select></label></div>
    <div className="design-section"><div className="design-section-title">Sem estar selecionado <span>⌃</span></div><ColorField label="Texto (padrão)" value={block.optionsDefaultTextColor ?? "#2c2c3c"} onChange={(value) => update({ optionsDefaultTextColor: value })} /><ColorField label="Fundo (padrão)" value={block.optionsDefaultBackground ?? "#ffffff"} onChange={(value) => update({ optionsDefaultBackground: value })} /><ColorField label="Borda (padrão)" value={block.optionsDefaultBorder ?? "#cad9ff"} onChange={(value) => update({ optionsDefaultBorder: value })} /></div>
    <div className="design-section"><div className="design-section-title">Ao passar o mouse <span>⌃</span></div><ColorField label="Texto no hover" value={block.optionsHoverTextColor ?? "#2c2c3c"} onChange={(value) => update({ optionsHoverTextColor: value })} /><ColorField label="Fundo no hover" value={block.optionsHoverBackground ?? "#eff2f8"} onChange={(value) => update({ optionsHoverBackground: value })} /><ColorField label="Borda no hover" value={block.optionsHoverBorder ?? "#266dff"} onChange={(value) => update({ optionsHoverBorder: value })} /></div>
    <div className="design-section"><div className="design-section-title">Selecionadas <span>⌃</span></div><ColorField label="Fundo quando selecionado" value={block.optionsSelectedBackground ?? "#cad9ff"} onChange={(value) => update({ optionsSelectedBackground: value })} /><ColorField label="Borda quando selecionado" value={block.optionsSelectedBorder ?? "#266dff"} onChange={(value) => update({ optionsSelectedBorder: value })} /></div>
  </div>;
}

export function OptionsProperties({ block, onBlockChange }: OptionsPropertiesProps) {
  const options = getOptions(block);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "design">("settings");

  function updateOptions(nextOptions: OptionItem[]) {
    onBlockChange({ options: nextOptions });
  }

  function updateOption(index: number, patch: Partial<OptionItem>) {
    updateOptions(options.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option));
  }

  function addOption() {
    const id = Math.max(0, ...options.map((option) => option.id)) + 1;
    updateOptions([...options, { id, label: `Opção ${id}` }]);
    setExpandedIndex(options.length);
  }

  function duplicateOption(index: number) {
    const source = options[index];
    if (!source) return;
    const id = Math.max(0, ...options.map((option) => option.id)) + 1;
    updateOptions([...options.slice(0, index + 1), { ...source, id, label: `${source.label} (cópia)` }, ...options.slice(index + 1)]);
  }

  function removeOption(index: number) {
    if (options.length <= 1) return;
    updateOptions(options.filter((_, optionIndex) => optionIndex !== index));
    setExpandedIndex(null);
  }

  return <div className="options-properties">
    <div className="properties-tabs"><button className={activeTab === "settings" ? "active" : ""} type="button" onClick={() => setActiveTab("settings")}>Configurações</button><button className={activeTab === "design" ? "active" : ""} type="button" onClick={() => setActiveTab("design")}>Design</button></div>
    {activeTab === "design" ? <OptionsDesignProperties block={block} onBlockChange={onBlockChange} /> : <>
    <div className="property-section options-manager"><label>Opções</label><small>Gerenciar as opções de seleção</small><div className="options-list">
      {options.map((option, index) => <div className="option-editor" key={option.id}>
        <div className="option-editor-header"><strong>{option.label}</strong><button type="button" className="option-icon-button" title="Duplicar opção" aria-label="Duplicar opção" onClick={() => duplicateOption(index)}><OptionIcon type="duplicate" /></button><button type="button" className="option-icon-button option-delete-button" title="Excluir opção" aria-label="Excluir opção" onClick={() => removeOption(index)}><OptionIcon type="delete" /></button><button type="button" className="option-icon-button" title="Expandir opção" aria-label={expandedIndex === index ? "Recolher opção" : "Expandir opção"} onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}><OptionIcon type="chevron" /></button></div>
        {expandedIndex === index && <div className="option-editor-body"><label>Texto<small>Conteúdo da opção</small><textarea value={option.label} onChange={(event) => updateOption(index, { label: event.target.value })} /></label><label>Imagem<small>Imagem da opção</small>{option.imageUrl ? <button type="button" className="option-image-selected" onClick={() => setImageIndex(index)}><img src={getTransparentImageUrl(option.imageUrl)} alt="" /><span>Imagem selecionada<br /><small>Clique para trocar</small></span></button> : <button type="button" className="image-upload-control" onClick={() => setImageIndex(index)}>↥<span>Clique para fazer upload<br />ou arraste uma imagem aqui</span></button>}{option.imageUrl && <button type="button" className="remove-image-btn" onClick={() => updateOption(index, { imageUrl: undefined })}>♧ Remover imagem</button>}</label><label>Navegação<small>Tipo de navegação da opção</small><select value={option.navigation ?? "next"} onChange={(event) => updateOption(index, { navigation: event.target.value })}><option value="next">Navegar para próxima etapa</option><option value="url">Abrir um link</option><option value="anchor">Ir para um componente</option></select></label></div>}
      </div>)}
      <button type="button" className="add-option-btn" onClick={addOption}>＋ Adicionar Nova Opção</button>
    </div></div>
    <div className="property-section"><label>Layout</label><select value={block.optionsLayout ?? "vertical"} onChange={(event) => onBlockChange({ optionsLayout: event.target.value as CanvasBlock["optionsLayout"] })}><option value="vertical">Lista vertical</option><option value="grid">Grade</option></select></div>
    <div className="property-section"><label>Modo de exibição</label><select value={block.optionsDisplayMode ?? "text-image"} onChange={(event) => onBlockChange({ optionsDisplayMode: event.target.value as CanvasBlock["optionsDisplayMode"] })}><option value="text">Somente texto</option><option value="text-image">Texto → Imagem</option><option value="image-text">Imagem → Texto</option></select></div>
    <div className="property-section"><label>Direção</label><select value={block.optionsDirection ?? "vertical"} onChange={(event) => onBlockChange({ optionsDirection: event.target.value as CanvasBlock["optionsDirection"] })}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></div>
    <div className="property-section"><label>Animação ao passar o mouse</label><select value={block.optionsHoverAnimation ?? "none"} onChange={(event) => onBlockChange({ optionsHoverAnimation: event.target.value as CanvasBlock["optionsHoverAnimation"] })}><option value="none">Nenhuma</option><option value="lift">Elevar</option><option value="scale">Aumentar</option></select></div>
    <div className="toggle-row"><div><label>Permitir múltipla escolha</label></div><button type="button" className={block.allowMultiple ? "toggle on" : "toggle"} onClick={() => onBlockChange({ allowMultiple: !block.allowMultiple })} /></div></>}
    {imageIndex !== null && <ImagePickerModal onCancel={() => setImageIndex(null)} onSelect={(url) => { updateOption(imageIndex, { imageUrl: url }); setImageIndex(null); }} />}
  </div>;
}
