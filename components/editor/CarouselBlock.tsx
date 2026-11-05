"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ImagePickerModal } from "./ImagePickerModal";
import type { CarouselItem, CanvasBlock } from "./types";

const defaultItems: CarouselItem[] = [
  { id: 1, text: "Texto do slide 1" },
  { id: 2, text: "Texto do slide 2" },
  { id: 3, text: "Texto do slide 3" },
];

function getItems(block: CanvasBlock) {
  return block.carouselItems?.length ? block.carouselItems : defaultItems;
}

function CarouselIcon({ type }: { type: "duplicate" | "delete" | "chevron" }) {
  if (type === "duplicate") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
  if (type === "delete") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>;
}

export function CarouselBlock({ block }: { block: CanvasBlock }) {
  const items = getItems(block);
  const [activeIndex, setActiveIndex] = useState(0);
  const style = {
    "--carousel-background": block.carouselBackground ?? "#ffffff",
    "--carousel-border": block.carouselBorder ?? "#cad9ff",
    "--carousel-arrow": block.carouselArrowColor ?? "#2c2c3c",
    "--carousel-arrow-background": block.carouselArrowBackground ?? "#ffffff",
    "--carousel-blur": block.carouselBlurColor ?? "#e5e7eb",
  } as React.CSSProperties;

  useEffect(() => {
    if (!block.carouselAutoplay || items.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % items.length), Math.max(1, block.carouselInterval ?? 5) * 1000);
    return () => window.clearInterval(timer);
  }, [block.carouselAutoplay, block.carouselInterval, items.length]);

  const currentIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const item = items[currentIndex] ?? items[0];
  if (!item) return null;
  const previous = () => setActiveIndex((current) => (Math.min(current, items.length - 1) - 1 + items.length) % items.length);
  const next = () => setActiveIndex((current) => (Math.min(current, items.length - 1) + 1) % items.length);

  return <div className={`canvas-carousel carousel-${block.carouselStyle ?? "modern"}`} style={style}>
    <p className="carousel-description">{block.carouselDescription ?? "Descrição do Carrossel"}</p>
    <div className="carousel-viewport">
      <div className="carousel-slide" key={item.id}>
        <div className={`carousel-image ${block.carouselImageBlur ? "has-blur" : ""}`}>
          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{currentIndex + 1}</span>}
        </div>
        <div className="carousel-caption">{item.text}</div>
      </div>
    </div>
    {block.carouselShowArrows !== false && <div className={`carousel-arrows arrows-${block.carouselArrowPosition ?? "left"}`}><button type="button" aria-label="Slide anterior" onClick={previous}>‹</button><button type="button" aria-label="Próximo slide" onClick={next}>›</button></div>}
  </div>;
}

type CarouselPropertiesProps = { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void };

export function CarouselProperties({ block, onBlockChange }: CarouselPropertiesProps) {
  const items = getItems(block);
  const [activeTab, setActiveTab] = useState<"settings" | "design">("settings");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<number | null>(null);

  function updateItems(next: CarouselItem[]) { onBlockChange({ carouselItems: next }); }
  function updateItem(index: number, patch: Partial<CarouselItem>) { updateItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function addItem() { const id = Math.max(0, ...items.map((item) => item.id)) + 1; updateItems([...items, { id, text: `Texto do slide ${id}` }]); setExpandedIndex(items.length); }
  function duplicateItem(index: number) { const source = items[index]; if (!source) return; const id = Math.max(0, ...items.map((item) => item.id)) + 1; updateItems([...items.slice(0, index + 1), { ...source, id, text: `${source.text} (cópia)` }, ...items.slice(index + 1)]); }
  function removeItem(index: number) { if (items.length <= 1) return; updateItems(items.filter((_, itemIndex) => itemIndex !== index)); setExpandedIndex(null); }
  function color(label: string, value: string, key: keyof CanvasBlock) { return <label className="carousel-color-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onBlockChange({ [key]: event.target.value })} /><input value={value} onChange={(event) => onBlockChange({ [key]: event.target.value })} /></div></label>; }

  return <div className="carousel-properties"><div className="properties-tabs"><button type="button" className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Configurações</button><button type="button" className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button></div>{activeTab === "settings" ? <>
    <div className="property-section"><label>Estilo de Exibição</label><select value={block.carouselStyle ?? "modern"} onChange={(event) => onBlockChange({ carouselStyle: event.target.value as CanvasBlock["carouselStyle"] })}><option value="modern">Moderno</option><option value="classic">Clássico</option><option value="minimal">Minimalista</option></select></div>
    <div className="property-section"><label>Descrição</label><input value={block.carouselDescription ?? "Descrição do Carrossel"} onChange={(event) => onBlockChange({ carouselDescription: event.target.value })} /></div>
    <div className="property-section carousel-items-manager"><label>Itens do Carrossel</label><div className="carousel-items-list">{items.map((item, index) => <div className="carousel-editor" key={item.id}><div className="carousel-editor-header"><strong>{`Item ${index + 1}`}</strong><button type="button" className="carousel-icon-button" title="Duplicar item" onClick={() => duplicateItem(index)}><CarouselIcon type="duplicate" /></button><button type="button" className="carousel-icon-button carousel-delete-button" title="Excluir item" onClick={() => removeItem(index)}><CarouselIcon type="delete" /></button><button type="button" className="carousel-icon-button" title="Expandir item" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}><CarouselIcon type="chevron" /></button></div>{expandedIndex === index && <div className="carousel-editor-body"><label>Imagem<button type="button" className="image-upload-control" onClick={() => setImageIndex(index)}>↥<span>Clique para fazer upload<br />ou arraste uma imagem aqui</span></button>{item.imageUrl && <button type="button" className="remove-image-btn" onClick={() => updateItem(index, { imageUrl: undefined })}>Remover imagem</button>}</label><label>Texto<input value={item.text} onChange={(event) => updateItem(index, { text: event.target.value })} /></label></div>}</div>)}<button type="button" className="add-option-btn" onClick={addItem}>＋ Adicionar Novo Item</button></div></div>
    <div className="toggle-row"><div><label>Reprodução Automática</label></div><button type="button" className={block.carouselAutoplay ? "toggle on" : "toggle"} onClick={() => onBlockChange({ carouselAutoplay: !block.carouselAutoplay })} /></div>
    <div className="property-section"><label>Intervalo (segundos) <output>{block.carouselInterval ?? 5}s</output></label><input type="range" min="1" max="30" value={block.carouselInterval ?? 5} onChange={(event) => onBlockChange({ carouselInterval: Number(event.target.value) })} /></div>
    <div className="toggle-row"><div><label>Mostrar Setas de Navegação</label></div><button type="button" className={block.carouselShowArrows !== false ? "toggle on" : "toggle"} onClick={() => onBlockChange({ carouselShowArrows: block.carouselShowArrows === false })} /></div>
    <div className="property-section"><label>Posição das Setas</label><div className="alignment-buttons"><button type="button" className={block.carouselArrowPosition === "left" ? "active" : ""} onClick={() => onBlockChange({ carouselArrowPosition: "left" })}>≡</button><button type="button" className={block.carouselArrowPosition === "center" ? "active" : ""} onClick={() => onBlockChange({ carouselArrowPosition: "center" })}>≡</button><button type="button" className={block.carouselArrowPosition === "right" ? "active" : ""} onClick={() => onBlockChange({ carouselArrowPosition: "right" })}>≡</button></div></div>
  </> : <div className="carousel-design">{color("Cor de Fundo", block.carouselBackground ?? "#ffffff", "carouselBackground")}{color("Cor da Borda", block.carouselBorder ?? "#cad9ff", "carouselBorder")}{color("Cor das Setas", block.carouselArrowColor ?? "#2c2c3c", "carouselArrowColor")}{color("Cor de Fundo das Setas", block.carouselArrowBackground ?? "#ffffff", "carouselArrowBackground")}<div className="toggle-row"><div><label>Efeito de Blur na Imagem</label></div><button type="button" className={block.carouselImageBlur ? "toggle on" : "toggle"} onClick={() => onBlockChange({ carouselImageBlur: !block.carouselImageBlur })} /></div>{color("Cor do Blur da Imagem", block.carouselBlurColor ?? "#e5e7eb", "carouselBlurColor")}</div>}{imageIndex !== null && <ImagePickerModal onCancel={() => setImageIndex(null)} onSelect={(url) => { updateItem(imageIndex, { imageUrl: url }); setImageIndex(null); }} />}</div>;
}
