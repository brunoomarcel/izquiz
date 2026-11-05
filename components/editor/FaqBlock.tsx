"use client";

import { useState } from "react";
import type { CanvasBlock, FaqItem } from "./types";

const defaultItems: FaqItem[] = [
  { id: 1, question: "O que é o FAQ?", answer: "Uma lista de perguntas frequentes e respostas sobre um determinado tópico." },
  { id: 2, question: "Como edito as perguntas?", answer: "Abra o painel de propriedades e edite o texto da pergunta ou da resposta." },
  { id: 3, question: "Posso adicionar mais itens?", answer: "Sim. Use o botão Adicionar item no painel de propriedades." },
];

function getItems(block: CanvasBlock) { return block.faqItems?.length ? block.faqItems : defaultItems; }

function FaqIcon({ type }: { type: "duplicate" | "delete" | "chevron" }) {
  if (type === "duplicate") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
  if (type === "delete") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>;
}

export function FaqBlock({ block }: { block: CanvasBlock }) {
  const items = getItems(block);
  const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null);
  return <div className="canvas-faq" style={{ width: `${block.faqWidth ?? 100}%`, marginLeft: "auto", marginRight: "auto", "--faq-title": block.faqTitleColor ?? "#11213b", "--faq-open": block.faqOpenTextColor ?? "#11213b", "--faq-closed": block.faqClosedTextColor ?? "#11213b", "--faq-answer": block.faqAnswerColor ?? "#6b7280" } as React.CSSProperties}><h2>{block.faqTitle ?? "Perguntas frequentes"}</h2>{items.map((item) => { const open = openId === item.id; return <div className={`faq-item ${open ? "is-open" : ""}`} key={item.id}><button type="button" onClick={(event) => { event.stopPropagation(); setOpenId(open ? null : item.id); }}><span>{item.question}</span><span className="faq-chevron">⌄</span></button>{open && <p>{item.answer}</p>}</div>; })}</div>;
}

export function FaqProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const items = getItems(block);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "design">("config");
  const updateItems = (next: FaqItem[]) => onBlockChange({ faqItems: next });
  const updateItem = (index: number, patch: Partial<FaqItem>) => updateItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addItem = () => { const id = Math.max(0, ...items.map((item) => item.id)) + 1; updateItems([...items, { id, question: `Pergunta ${id}`, answer: "Resposta da pergunta" }]); setExpandedIndex(items.length); };
  const duplicateItem = (index: number) => { const item = items[index]; if (!item) return; const id = Math.max(0, ...items.map((current) => current.id)) + 1; updateItems([...items.slice(0, index + 1), { ...item, id, question: `${item.question} (cópia)` }, ...items.slice(index + 1)]); };
  const removeItem = (index: number) => { if (items.length <= 1) return; updateItems(items.filter((_, itemIndex) => itemIndex !== index)); setExpandedIndex(null); };
  const color = (label: string, value: string, key: keyof CanvasBlock) => <label className="faq-color-field"><span>{label}</span><div><input type="color" value={value.startsWith("#") ? value : "#11213b"} onChange={(event) => onBlockChange({ [key]: event.target.value })} /><input value={value} onChange={(event) => onBlockChange({ [key]: event.target.value })} /></div></label>;
  return <div className="faq-properties"><div className="properties-tabs"><button type="button" className={activeTab === "config" ? "active" : ""} onClick={() => setActiveTab("config")}>Configurações</button><button type="button" className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button></div>{activeTab === "config" ? <><div className="property-section"><label>Título</label><input value={block.faqTitle ?? "Perguntas frequentes"} onChange={(event) => onBlockChange({ faqTitle: event.target.value })} /></div><div className="property-section"><label>Largura <output>{block.faqWidth ?? 100}%</output></label><input type="range" min="20" max="100" value={block.faqWidth ?? 100} onChange={(event) => onBlockChange({ faqWidth: Number(event.target.value) })} /></div><div className="property-section faq-items-manager"><label>Itens</label><small>Gerencie as perguntas e respostas</small><div className="faq-items-list">{items.map((item, index) => <div className="faq-editor" key={item.id}><div className="faq-editor-header"><strong>{item.question}</strong><button type="button" className="faq-icon-button" onClick={() => duplicateItem(index)}><FaqIcon type="duplicate" /></button><button type="button" className="faq-icon-button faq-delete-button" onClick={() => removeItem(index)}><FaqIcon type="delete" /></button><button type="button" className="faq-icon-button" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}><FaqIcon type="chevron" /></button></div>{expandedIndex === index && <div className="faq-editor-body"><label>Pergunta<small>Título da pergunta</small><input value={item.question} onChange={(event) => updateItem(index, { question: event.target.value })} /></label><label>Resposta<small>Conteúdo da resposta</small><textarea value={item.answer} onChange={(event) => updateItem(index, { answer: event.target.value })} /></label></div>}</div>)}<button type="button" className="add-option-btn" onClick={addItem}>＋ Adicionar item</button></div></div></> : <div className="faq-design">{color("Cor do título", block.faqTitleColor ?? "#11213b", "faqTitleColor")} {color("Cor do texto (aberto)", block.faqOpenTextColor ?? "#11213b", "faqOpenTextColor")} {color("Cor do texto (fechado)", block.faqClosedTextColor ?? "#11213b", "faqClosedTextColor")} {color("Cor da resposta", block.faqAnswerColor ?? "#6b7280", "faqAnswerColor")}</div>}</div>;
}
