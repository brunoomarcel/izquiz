"use client";

import { useEffect, useState, type DragEvent } from "react";
import type { EditorStep } from "./types";

type StepListProps = {
  steps: EditorStep[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onRequestDelete: (index: number, title: string) => void;
  onAction: (action: "preview" | "rename" | "duplicate" | "save-model", index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
};

function StepMenuIcon({ type }: { type: "preview" | "rename" | "duplicate" | "save-model" | "delete" }) {
  const paths = {
    preview: <><path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2" /></>,
    rename: <><path d="m4 16-.8 4.8L8 20l10.7-10.7a2.1 2.1 0 0 0-3-3L5 17" /><path d="m14.5 7.5 3 3" /></>,
    duplicate: <><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" /></>,
    "save-model": <><path d="M5 3v6h10V3" /><path d="M4 21h16V8l-5-5H4z" /><path d="M8 21v-6h8v6" /></>,
    delete: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="m6 7 1 14h10l1-14M9 7V4h6v3" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

export function StepList({ steps, selectedIndex, onSelect, onRequestDelete, onAction, onMove, onReorder, onAdd }: StepListProps) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".step-item")) setOpenMenuIndex(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuIndex(null);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const dropStep = (event: DragEvent<HTMLDivElement>, targetIndex: number) => {
    event.preventDefault();
    const rawIndex = event.dataTransfer.getData("application/x-izquiz-step");
    const fromIndex = Number(rawIndex);
    if (Number.isInteger(fromIndex) && fromIndex >= 0 && fromIndex < steps.length && fromIndex !== targetIndex) {
      onReorder(fromIndex, targetIndex);
    }
    setDraggingIndex(null);
  };

  return (
    <>
      <div className="step-list">
        {steps.map((step, index) => (
          <div
            className={`step-item ${draggingIndex === index ? "step-dragging" : ""}`}
            key={step.id ?? `${step.title}-${index}`}
            draggable
            onDragStart={(event) => {
              setDraggingIndex(index);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("application/x-izquiz-step", String(index));
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => dropStep(event, index)}
            onDragEnd={() => setDraggingIndex(null)}
          >
            <button
              type="button"
              className={`step-item-button ${selectedIndex === index ? "selected" : ""}`}
              onClick={() => onSelect(index)}
              title="Clique para editar. Arraste para reordenar."
            >
              <span>{step.title}</span>
              <span className="step-actions" aria-hidden="true">
                <span className="step-drag-icon">☷</span>
                <span className="step-menu-trigger" onClick={(event) => { event.stopPropagation(); setOpenMenuIndex(openMenuIndex === index ? null : index); }}>⋮</span>
              </span>
            </button>

            {openMenuIndex === index && (
              <div className="step-menu" onClick={(event) => event.stopPropagation()}>
                <button type="button" disabled={index === 0} onClick={() => { onMove(index, "up"); setOpenMenuIndex(null); }}><span>↑</span><span>Mover para cima</span></button>
                <button type="button" disabled={index === steps.length - 1} onClick={() => { onMove(index, "down"); setOpenMenuIndex(null); }}><span>↓</span><span>Mover para baixo</span></button>
                <button type="button" onClick={() => { onAction("preview", index); setOpenMenuIndex(null); }}><StepMenuIcon type="preview" /><span>Preview</span></button>
                <button type="button" onClick={() => { onAction("rename", index); setOpenMenuIndex(null); }}><StepMenuIcon type="rename" /><span>Renomear</span></button>
                <button type="button" onClick={() => { onAction("duplicate", index); setOpenMenuIndex(null); }}><StepMenuIcon type="duplicate" /><span>Duplicar</span></button>
                <button type="button" onClick={() => { onAction("save-model", index); setOpenMenuIndex(null); }}><StepMenuIcon type="save-model" /><span>Salvar Modelo</span></button>
                <button type="button" className="danger" onClick={() => { onRequestDelete(index, step.title); setOpenMenuIndex(null); }}><StepMenuIcon type="delete" /><span>Excluir</span></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="add-step" onClick={onAdd}>+ Adicionar etapa</button>
    </>
  );
}
