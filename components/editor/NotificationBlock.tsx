import { useEffect, useState } from "react";
import type { CanvasBlock } from "./types";

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="notification-color-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input value={value} onChange={(event) => onChange(event.target.value)} /></div></label>;
}

export function NotificationBlock({ block }: { block: CanvasBlock }) {
  const position = block.notificationPosition ?? "default";
  const duration = Math.max(1, block.notificationDuration ?? 5);
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const startedAt = performance.now();
    let animationFrame = 0;
    const update = (now: number) => {
      const elapsed = now - startedAt;
      const nextProgress = Math.max(0, 100 - (elapsed / (duration * 1000)) * 100);
      setProgress(nextProgress);
      if (elapsed < duration * 1000) animationFrame = requestAnimationFrame(update);
      else setVisible(false);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration]);
  if (!visible) return null;
  return <div key={duration} className={`canvas-notification notification-position-${position}`} style={{ "--notification-text": block.notificationTextColor ?? "#fff", "--notification-progress": block.notificationProgressColor ?? "#266dff", "--notification-background": block.notificationBackgroundColor ?? "#266dff" } as React.CSSProperties}><strong>{block.notificationTitle ?? "nova"}</strong><span>{block.notificationMessage ?? "Você tem uma nova notificação."}</span><i style={{ width: `${progress}%` }} /></div>;
}

export function NotificationProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const [activeTab, setActiveTab] = useState<"config" | "design">("config");
  const position = block.notificationPosition ?? "default";
  return <div className="notification-properties"><div className="properties-tabs"><button type="button" className={activeTab === "config" ? "active" : ""} onClick={() => setActiveTab("config")}>Configurações</button><button type="button" className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button></div>{activeTab === "config" ? <><div className="property-section"><label>Título</label><input value={block.notificationTitle ?? "nova"} onChange={(event) => onBlockChange({ notificationTitle: event.target.value })} /></div><div className="property-section"><label>Mensagem</label><textarea value={block.notificationMessage ?? "Você tem uma nova notificação."} onChange={(event) => onBlockChange({ notificationMessage: event.target.value })} /></div><div className="property-section"><label>Tipo</label><select value={block.notificationType ?? "info"} onChange={(event) => onBlockChange({ notificationType: event.target.value as CanvasBlock["notificationType"] })}><option value="info">Informação</option><option value="success">Sucesso</option><option value="warning">Atenção</option><option value="error">Erro</option></select></div><div className="property-section"><label>Posição</label><small>Escolha a posição da notificação na tela</small><select value={position} onChange={(event) => onBlockChange({ notificationPosition: event.target.value as CanvasBlock["notificationPosition"] })}><option value="default">Padrão</option><option value="top">Topo</option><option value="center">Centro</option><option value="bottom">Rodapé</option></select></div><div className="property-section"><label>Duração <output>{block.notificationDuration ?? 5}s</output></label><input type="range" min="1" max="30" value={block.notificationDuration ?? 5} onChange={(event) => onBlockChange({ notificationDuration: Number(event.target.value) })} /></div></> : <div className="notification-design"><ColorField label="Cor do Texto" value={block.notificationTextColor ?? "#ffffff"} onChange={(value) => onBlockChange({ notificationTextColor: value })} /><ColorField label="Cor da Barra de Progresso" value={block.notificationProgressColor ?? "#266dff"} onChange={(value) => onBlockChange({ notificationProgressColor: value })} /><ColorField label="Cor de Fundo" value={block.notificationBackgroundColor ?? "#266dff"} onChange={(value) => onBlockChange({ notificationBackgroundColor: value })} /></div>}</div>;
}
