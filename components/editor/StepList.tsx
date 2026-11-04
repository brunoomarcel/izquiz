"use client";

import { useEffect, useState } from "react";
import type { EditorStep } from "./types";

type StepListProps = {
  steps: EditorStep[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onRequestDelete: (index: number, title: string) => void;
  onAction: (action: "preview" | "rename" | "duplicate" | "save-model", index: number) => void;
  onAdd: () => void;
};

function StepMenuIcon({ type }: { type: "preview" | "rename" | "duplicate" | "save-model" | "delete" }) {
  const paths = {
    preview: <><path d="M9 15 15 9" /><path d="M7 17H5a4 4 0 0 1 0-8h3M17 7h2a4 4 0 0 1 0 8h-3" /></>,
    rename: <><path d="m4 17 2-.5L18 4.5a1.7 1.7 0 0 0-2.4-2.4L3.6 14.1 3 17Z" /><path d="m14.5 3.5 2 2" /></>,
    duplicate: <><rect x="7" y="7" width="12" height="12" rx="2" /><path d="M4 15H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" /></>,
    "save-model": <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>,
  };
  return <svg className="step-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export function StepList({ steps, selectedIndex, onSelect, onRequestDelete, onAction, onAdd }: StepListProps) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openMenuIndex === null) return;

    const closeMenu = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && (target.closest(".step-menu") || target.closest("[data-step-menu-trigger]"))) return;
      setOpenMenuIndex(null);
    };

    const closeMenuWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuIndex(null);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenuWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenuWithEscape);
    };
  }, [openMenuIndex]);

  const runAction = (action: "preview" | "rename" | "duplicate" | "save-model", index: number) => { setOpenMenuIndex(null); onAction(action, index); };
  return <><div className="step-list">{steps.map((step, index) => <div className="step-item" key={`${step.id ?? step.title}-${index}`}><button className={selectedIndex === index ? "step-row active" : "step-row"} onClick={() => onSelect(index)}><span>{step.title}</span><span className="step-actions"><span aria-hidden="true">☷</span><span className="step-menu-trigger" data-step-menu-trigger role="button" tabIndex={0} aria-label={`Ações de ${step.title}`} onClick={(event) => { event.stopPropagation(); setOpenMenuIndex(openMenuIndex === index ? null : index); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setOpenMenuIndex(openMenuIndex === index ? null : index); } }}>⋮</span></span></button>{openMenuIndex === index && <div className="step-menu"><button onClick={() => runAction("preview", index)}><StepMenuIcon type="preview" /><span>Preview</span></button><button onClick={() => runAction("rename", index)}><StepMenuIcon type="rename" /><span>Renomear</span></button><button onClick={() => runAction("duplicate", index)}><StepMenuIcon type="duplicate" /><span>Duplicar</span></button><button onClick={() => runAction("save-model", index)}><StepMenuIcon type="save-model" /><span>Salvar Modelo</span></button><div /><button className="delete" onClick={() => { setOpenMenuIndex(null); onRequestDelete(index, step.title); }}><StepMenuIcon type="delete" /><span>Excluir</span></button></div>}</div>)}</div><button className="add-step" onClick={onAdd}>＋ Adicionar Passo</button></>;
}
