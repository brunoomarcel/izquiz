"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ImagePickerModal } from "./ImagePickerModal";
import type { CanvasBlock, TestimonialItem } from "./types";

const defaultItems: TestimonialItem[] = [
  { id: 1, name: "Nome do Cliente 1", username: "usuario1", comment: "Este é um depoimento de exemplo. Substitua com um depoimento real do seu cliente.", rating: 5 },
  { id: 2, name: "Nome do Cliente 2", username: "usuario2", comment: "Compartilhe aqui uma experiência positiva de quem já conhece o seu trabalho.", rating: 5 },
];

function getItems(block: CanvasBlock) { return block.testimonialItems?.length ? block.testimonialItems : defaultItems; }

function TestimonialIcon({ type }: { type: "duplicate" | "delete" | "chevron" }) {
  if (type === "duplicate") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
  if (type === "delete") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>;
}

export function TestimonialsBlock({ block }: { block: CanvasBlock }) {
  const items = getItems(block);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const item = items[currentIndex] ?? items[0];
  useEffect(() => {
    if (!block.testimonialAutoplay || items.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % items.length), Math.max(1, block.testimonialDelay ?? 5) * 1000);
    return () => window.clearInterval(timer);
  }, [block.testimonialAutoplay, block.testimonialDelay, items.length]);
  if (!item) return null;
  const style = { "--testimonial-name": block.testimonialNameColor ?? "#000000", "--testimonial-username": block.testimonialUsernameColor ?? "#333333", "--testimonial-comment": block.testimonialCommentColor ?? "#666666", "--testimonial-stars": block.testimonialStarsColor ?? "#ffd500", "--testimonial-background": block.testimonialBackground ?? "#ffffff", "--testimonial-arrow": block.testimonialArrowColor ?? "#2c2c3c", "--testimonial-arrow-background": block.testimonialArrowBackground ?? "#ffffff" } as React.CSSProperties;
  const previous = () => setActiveIndex((current) => (Math.min(current, items.length - 1) - 1 + items.length) % items.length);
  const next = () => setActiveIndex((current) => (Math.min(current, items.length - 1) + 1) % items.length);
  return <div className={`canvas-testimonials testimonial-${block.testimonialStyle ?? "modern"}`} style={style}>
    <div className="testimonial-card" key={item.id}><div className="testimonial-top"><span className="testimonial-quote">“</span><span className="testimonial-stars">{"★".repeat(Math.max(0, Math.min(5, item.rating)))}</span></div><p>{item.comment}</p><div className="testimonial-author">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="testimonial-avatar">{item.name.slice(0, 2)}</span>}<div><strong>{item.name}</strong><small>{item.username}</small></div></div></div>
    {block.testimonialShowArrows !== false && <div className={`testimonial-arrows arrows-${block.testimonialArrowPosition ?? "left"}`}><button type="button" aria-label="Depoimento anterior" onClick={previous}>‹</button><button type="button" aria-label="Próximo depoimento" onClick={next}>›</button></div>}
    {block.testimonialShowPagination !== false && <div className="testimonial-pagination">{items.map((entry, index) => <button type="button" key={entry.id} aria-label={`Ir para depoimento ${index + 1}`} className={index === currentIndex ? "active" : ""} onClick={() => setActiveIndex(index)} />)}</div>}
  </div>;
}

type TestimonialsPropertiesProps = { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void };

export function TestimonialsProperties({ block, onBlockChange }: TestimonialsPropertiesProps) {
  const items = getItems(block);
  const [activeTab, setActiveTab] = useState<"settings" | "design">("settings");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const updateItems = (next: TestimonialItem[]) => onBlockChange({ testimonialItems: next });
  const updateItem = (index: number, patch: Partial<TestimonialItem>) => updateItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addItem = () => { const id = Math.max(0, ...items.map((item) => item.id)) + 1; updateItems([...items, { id, name: `Nome do Cliente ${id}`, username: `usuario${id}`, comment: "Novo depoimento", rating: 5 }]); setExpandedIndex(items.length); };
  const duplicateItem = (index: number) => { const source = items[index]; if (!source) return; const id = Math.max(0, ...items.map((item) => item.id)) + 1; updateItems([...items.slice(0, index + 1), { ...source, id, name: `${source.name} (cópia)` }, ...items.slice(index + 1)]); };
  const removeItem = (index: number) => { if (items.length <= 1) return; updateItems(items.filter((_, itemIndex) => itemIndex !== index)); setExpandedIndex(null); };
  const color = (label: string, value: string, key: keyof CanvasBlock) => <label className="testimonial-color-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onBlockChange({ [key]: event.target.value })} /><input value={value} onChange={(event) => onBlockChange({ [key]: event.target.value })} /></div></label>;
  return <div className="testimonials-properties"><div className="properties-tabs"><button type="button" className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Configurações</button><button type="button" className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button></div>{activeTab === "settings" ? <>
    <div className="property-section"><label>Estilo de Exibição</label><select value={block.testimonialStyle ?? "modern"} onChange={(event) => onBlockChange({ testimonialStyle: event.target.value as CanvasBlock["testimonialStyle"] })}><option value="modern">Moderno</option><option value="classic">Clássico</option><option value="minimal">Minimalista</option></select></div>
    <div className="property-section testimonials-manager"><label>Depoimentos</label><div className="testimonials-list">{items.map((item, index) => <div className="testimonial-editor" key={item.id}><div className="testimonial-editor-header"><strong>{item.name}</strong><button type="button" className="testimonial-icon-button" title="Duplicar depoimento" onClick={() => duplicateItem(index)}><TestimonialIcon type="duplicate" /></button><button type="button" className="testimonial-icon-button testimonial-delete-button" title="Excluir depoimento" onClick={() => removeItem(index)}><TestimonialIcon type="delete" /></button><button type="button" className="testimonial-icon-button" title="Expandir depoimento" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}><TestimonialIcon type="chevron" /></button></div>{expandedIndex === index && <div className="testimonial-editor-body"><label>Imagem<button type="button" className="image-upload-control" onClick={() => setImageIndex(index)}>↥<span>Clique para fazer upload<br />ou arraste uma imagem aqui</span></button>{item.imageUrl && <button type="button" className="remove-image-btn" onClick={() => updateItem(index, { imageUrl: undefined })}>Remover imagem</button>}</label><label>Nome<input value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} /></label><label>Username<input value={item.username} onChange={(event) => updateItem(index, { username: event.target.value })} /></label><label>Comentário<textarea value={item.comment} onChange={(event) => updateItem(index, { comment: event.target.value })} /></label><label>Estrelas<input type="number" min="0" max="5" value={item.rating} onChange={(event) => updateItem(index, { rating: Number(event.target.value) })} /></label></div>}</div>)}<button type="button" className="add-option-btn" onClick={addItem}>＋ Adicionar Novo Depoimento</button></div></div>
    <div className="toggle-row"><div><label>Reprodução Automática</label></div><button type="button" className={block.testimonialAutoplay ? "toggle on" : "toggle"} onClick={() => onBlockChange({ testimonialAutoplay: !block.testimonialAutoplay })} /></div><div className="property-section"><label>Delay de Transição <output>{block.testimonialDelay ?? 5}s</output></label><input type="range" min="1" max="30" value={block.testimonialDelay ?? 5} onChange={(event) => onBlockChange({ testimonialDelay: Number(event.target.value) })} /></div><div className="toggle-row"><div><label>Mostrar Paginação</label></div><button type="button" className={block.testimonialShowPagination !== false ? "toggle on" : "toggle"} onClick={() => onBlockChange({ testimonialShowPagination: block.testimonialShowPagination === false })} /></div><div className="toggle-row"><div><label>Mostrar Setas de Navegação</label></div><button type="button" className={block.testimonialShowArrows !== false ? "toggle on" : "toggle"} onClick={() => onBlockChange({ testimonialShowArrows: block.testimonialShowArrows === false })} /></div><div className="property-section"><label>Posição das Setas</label><div className="alignment-buttons"><button type="button" className={block.testimonialArrowPosition === "left" ? "active" : ""} onClick={() => onBlockChange({ testimonialArrowPosition: "left" })}>≡</button><button type="button" className={block.testimonialArrowPosition === "center" ? "active" : ""} onClick={() => onBlockChange({ testimonialArrowPosition: "center" })}>≡</button><button type="button" className={block.testimonialArrowPosition === "right" ? "active" : ""} onClick={() => onBlockChange({ testimonialArrowPosition: "right" })}>≡</button></div></div>
  </> : <div className="testimonials-design">{color("Cor do Nome", block.testimonialNameColor ?? "#000000", "testimonialNameColor")}{color("Cor do Username", block.testimonialUsernameColor ?? "#333333", "testimonialUsernameColor")}{color("Cor do Comentário", block.testimonialCommentColor ?? "#666666", "testimonialCommentColor")}{color("Cor das Estrelas", block.testimonialStarsColor ?? "#ffd500", "testimonialStarsColor")}{color("Cor do fundo", block.testimonialBackground ?? "#ffffff", "testimonialBackground")}{color("Cor das Setas", block.testimonialArrowColor ?? "#2c2c3c", "testimonialArrowColor")}{color("Cor de Fundo das Setas", block.testimonialArrowBackground ?? "#ffffff", "testimonialArrowBackground")}</div>}{imageIndex !== null && <ImagePickerModal onCancel={() => setImageIndex(null)} onSelect={(url) => { updateItem(imageIndex, { imageUrl: url }); setImageIndex(null); }} />}</div>;
}
