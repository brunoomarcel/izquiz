"use client";

import { useState } from "react";
import type { CanvasBlock, FormField } from "./types";

const defaultFields: FormField[] = [
  { id: 1, label: "Nome", type: "text", placeholder: "Digite seu nome" },
  { id: 2, label: "Email", type: "email", placeholder: "Digite seu email" },
];

function getFields(block: CanvasBlock) {
  return block.formFields?.length ? block.formFields : defaultFields;
}

function FormIcon({ type }: { type: "duplicate" | "delete" | "chevron" }) {
  if (type === "duplicate") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
  if (type === "delete") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>;
}

export function FormBlock({ block, onNotify }: { block: CanvasBlock; onNotify: (message: string) => void }) {
  const fields = getFields(block);
  const align = block.formAlign ?? "center";
  const width = block.formWidth ?? 100;
  const buttonWidth = block.formButtonWidth ?? 100;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onNotify(block.formSubmitAction === "message" ? "Formulário enviado" : block.formSubmitAction === "url" ? "Navegação após envio configurada" : "Próxima etapa configurada");
  }

  return <form className="canvas-form" style={{ width: `${width}%`, marginLeft: align === "right" || align === "center" ? "auto" : "0", marginRight: align === "left" || align === "center" ? "auto" : "0" }} onSubmit={submit} onClick={(event) => event.stopPropagation()}>
    <strong>{block.formTitle ?? "Formulário de Contato"}</strong>
    {fields.map((field) => <label key={field.id}>{field.label}{field.required && <em>*</em>}<input type={field.type} placeholder={field.placeholder} required={field.required} /></label>)}
    <button type="submit" style={{ width: `${buttonWidth}%`, marginLeft: align === "right" || align === "center" ? "auto" : "0", marginRight: align === "left" || align === "center" ? "auto" : "0" }}>{block.formButtonText ?? "Enviar"}</button>
  </form>;
}

export function FormProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const fields = getFields(block);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function updateFields(nextFields: FormField[]) { onBlockChange({ formFields: nextFields }); }
  function updateField(index: number, patch: Partial<FormField>) { updateFields(fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field)); }
  function addField() { const id = Math.max(0, ...fields.map((field) => field.id)) + 1; updateFields([...fields, { id, label: `Campo ${id}`, type: "text", placeholder: "Digite sua resposta" }]); setExpandedIndex(fields.length); }
  function duplicateField(index: number) { const field = fields[index]; if (!field) return; const id = Math.max(0, ...fields.map((item) => item.id)) + 1; updateFields([...fields.slice(0, index + 1), { ...field, id, label: `${field.label} (cópia)` }, ...fields.slice(index + 1)]); }
  function removeField(index: number) { if (fields.length <= 1) return; updateFields(fields.filter((_, fieldIndex) => fieldIndex !== index)); setExpandedIndex(null); }

  return <div className="form-properties"><div className="properties-tabs"><button className="active" type="button">Configurações</button><button type="button">Design</button></div><div className="property-section form-fields-manager"><label>Campos do Formulário</label><small>Gerenciar os campos do formulário</small><div className="form-fields-list">{fields.map((field, index) => <div className="form-field-editor" key={field.id}><div className="form-field-header"><strong>{field.label}</strong><button type="button" className="form-icon-button" title="Duplicar campo" aria-label="Duplicar campo" onClick={() => duplicateField(index)}><FormIcon type="duplicate" /></button><button type="button" className="form-icon-button form-delete-button" title="Excluir campo" aria-label="Excluir campo" onClick={() => removeField(index)}><FormIcon type="delete" /></button><button type="button" className="form-icon-button" title="Expandir campo" aria-label="Expandir campo" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}><FormIcon type="chevron" /></button></div>{expandedIndex === index && <div className="form-field-body"><label>Label<input value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} /></label><label>Tipo<select value={field.type} onChange={(event) => updateField(index, { type: event.target.value as FormField["type"] })}><option value="text">Texto</option><option value="email">E-mail</option><option value="tel">Telefone</option><option value="number">Número</option></select></label><label>Placeholder<input value={field.placeholder} onChange={(event) => updateField(index, { placeholder: event.target.value })} /></label><div className="toggle-row"><div><label>Campo obrigatório</label></div><button type="button" className={field.required ? "toggle on" : "toggle"} onClick={() => updateField(index, { required: !field.required })} /></div></div>}</div>)}<button type="button" className="add-option-btn" onClick={addField}>＋ Adicionar Novo Campo</button></div></div><div className="property-section"><label>Título</label><textarea className="form-title-input" value={block.formTitle ?? "Formulário de Contato"} onChange={(event) => onBlockChange({ formTitle: event.target.value })} /></div><div className="property-section"><label>Alinhamento Horizontal</label><div className="alignment-buttons"><button className={block.formAlign === "left" ? "active" : ""} type="button" onClick={() => onBlockChange({ formAlign: "left" })}>≡</button><button className={!block.formAlign || block.formAlign === "center" ? "active" : ""} type="button" onClick={() => onBlockChange({ formAlign: "center" })}>≡</button><button className={block.formAlign === "right" ? "active" : ""} type="button" onClick={() => onBlockChange({ formAlign: "right" })}>≡</button></div></div><div className="property-section"><label>Largura Personalizada <output>{block.formWidth ?? 100}%</output></label><input type="range" min="20" max="100" value={block.formWidth ?? 100} onChange={(event) => onBlockChange({ formWidth: Number(event.target.value) })} /></div><div className="property-section"><label>Texto do Botão</label><input value={block.formButtonText ?? "Enviar"} onChange={(event) => onBlockChange({ formButtonText: event.target.value })} /></div><div className="property-section"><label>Largura do Botão <output>{block.formButtonWidth ?? 100}%</output></label><input type="range" min="20" max="100" value={block.formButtonWidth ?? 100} onChange={(event) => onBlockChange({ formButtonWidth: Number(event.target.value) })} /></div><div className="property-section"><label>Ação após envio</label><select value={block.formSubmitAction ?? "next"} onChange={(event) => onBlockChange({ formSubmitAction: event.target.value as CanvasBlock["formSubmitAction"] })}><option value="next">Navegar para próxima etapa</option><option value="url">Abrir um link</option><option value="message">Exibir mensagem</option></select></div></div>;
}
