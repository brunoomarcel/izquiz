"use client";

import { useState, type CSSProperties } from "react";
import type { CanvasBlock } from "./types";

function values(raw: string | undefined, fallback: number[]) {
  const parsed = (raw ?? "").split(",").map((item) => Number(item.trim())).filter((item) => Number.isFinite(item));
  return parsed.length > 1 ? parsed : fallback;
}

function comparablePath(data: number[], min: number, max: number, width = 300, height = 150) {
  const range = max - min || 1;
  const points = data.map((item, index) => ({ x: (index / Math.max(data.length - 1, 1)) * width, y: height - ((item - min) / range) * (height - 18) - 9 }));
  return points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1]; const control = (point.x - previous.x) / 2;
    return `C ${previous.x + control} ${previous.y}, ${point.x - control} ${point.y}, ${point.x} ${point.y}`;
  }).join(" ");
}

function smoothPath(data: number[], width = 300, height = 100) {
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const points = data.map((item, index) => ({ x: (index / Math.max(data.length - 1, 1)) * width, y: height - ((item - min) / range) * (height - 18) - 9 }));
  return points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1]; const control = (point.x - previous.x) / 2;
    return `C ${previous.x + control} ${previous.y}, ${point.x - control} ${point.y}, ${point.x} ${point.y}`;
  }).join(" ");
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="chart-color-field"><span>{label}</span><div><input type="color" value={value.startsWith("#") ? value : "#2f6df3"} onChange={(event) => onChange(event.target.value)} /><input value={value} onChange={(event) => onChange(event.target.value)} /></div></label>;
}

export function TrendBlock({ block }: { block: CanvasBlock }) {
  const positive = block.trendPositive ?? true; const percentage = block.trendPercentage ?? 88; const color = positive ? "#00b879" : "#ef4444";
  const data = values(block.trendData, [3, 5, 2, 6]); const line = smoothPath(data); const area = `${line} L 300 100 L 0 100 Z`;
  const displayValue = block.trendValue || `${percentage}%`;
  return <div className="canvas-trend" style={{ "--trend-color": block.trendColor ?? color } as CSSProperties}><div className="trend-copy"><small>{block.trendTitle ?? "Tendência"}</small><strong>{displayValue}</strong><span>{positive ? "↗" : "↘"} {percentage}%</span><em>{block.trendPeriod ?? "Última semana"}</em></div><svg className="trend-chart" viewBox="0 0 300 100" preserveAspectRatio="none" aria-label="Gráfico de tendência"><path className="trend-area" d={area} /><path className="trend-line" d={line} /></svg></div>;
}

export function EvolutionBlock({ block }: { block: CanvasBlock }) {
  const first = values(block.evolutionSeriesOneValues, [15, 25, 40]); const second = values(block.evolutionSeriesTwoValues, [8, 15, 28]);
  const labels = (block.evolutionLabels ?? "Jan,Fev,Mar").split(",").map((item) => item.trim()).filter(Boolean); const min = Math.min(...first, ...second); const max = Math.max(...first, ...second); const one = comparablePath(first, min, max); const two = comparablePath(second, min, max);
  return <div className="canvas-evolution" style={{ "--evolution-one": block.evolutionSeriesOneColor ?? "#3a9ff8", "--evolution-two": block.evolutionSeriesTwoColor ?? "#111827" } as CSSProperties}><h3>{block.evolutionTitle ?? "Gráfico Comparativo"}</h3><p>{block.evolutionDescription ?? "Comparação Você vs. Concorrente"}</p><svg viewBox="0 0 300 150" preserveAspectRatio="none" aria-label="Gráfico evolutivo"><path className="evolution-grid" d="M0 30H300M0 70H300M0 110H300" /><path className="evolution-area-one" d={`${one} L 300 150 L 0 150 Z`} /><path className="evolution-area-two" d={`${two} L 300 150 L 0 150 Z`} /><path className="evolution-line-one" d={one} /><path className="evolution-line-two" d={two} /><g className="evolution-point-labels"><text x="296" y="27" textAnchor="end">{block.evolutionSeriesOneLabel ?? "Seu concorrente"}</text><text x="296" y="91" textAnchor="end">{block.evolutionSeriesTwoLabel ?? "Você"}</text></g></svg><div className="evolution-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div></div>;
}

export function TrendProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  return <div className="chart-properties"><div className="properties-tabs"><button className="active" type="button">Configurações</button><button type="button">Design</button></div><label>Título<input value={block.trendTitle ?? "Tendência"} onChange={(event) => onBlockChange({ trendTitle: event.target.value })} /></label><label>Descrição<input value={block.trendValue ?? "88%"} onChange={(event) => onBlockChange({ trendValue: event.target.value })} /></label><label>Descrição da Porcentagem<input value={block.trendPeriod ?? "Última semana"} onChange={(event) => onBlockChange({ trendPeriod: event.target.value })} /></label><label>Valor da Porcentagem<input type="number" value={block.trendPercentage ?? 88} onChange={(event) => onBlockChange({ trendPercentage: Number(event.target.value) })} /></label><div className="toggle-row"><label>Porcentagem Positiva</label><button type="button" className={block.trendPositive === false ? "toggle" : "toggle on"} onClick={() => onBlockChange({ trendPositive: !(block.trendPositive ?? true) })} /></div><label>Dados da Tendência<small>Valores separados por vírgula para o gráfico (ex.: 10,20,30,40)</small><input value={block.trendData ?? "3,5,2,6"} onChange={(event) => onBlockChange({ trendData: event.target.value })} /></label><ColorField label="Cor do gráfico" value={block.trendColor ?? "#00b879"} onChange={(value) => onBlockChange({ trendColor: value })} /></div>;
}

export function EvolutionProperties({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const [series, setSeries] = useState<1 | 2>(1); const [design, setDesign] = useState(false); const activeValues = series === 1 ? block.evolutionSeriesOneValues ?? "15,25,40" : block.evolutionSeriesTwoValues ?? "8,15,28"; const activeLabel = series === 1 ? block.evolutionSeriesOneLabel ?? "Seu concorrente" : block.evolutionSeriesTwoLabel ?? "Você"; const labels = (block.evolutionLabels ?? "Jan,Fev,Mar").split(",");
  function updateRow(index: number, key: "label" | "value", value: string) { const nextLabels = [...labels]; const nextValues = activeValues.split(","); if (key === "label") nextLabels[index] = value; else nextValues[index] = value; onBlockChange({ evolutionLabels: nextLabels.join(","), ...(series === 1 ? { evolutionSeriesOneValues: nextValues.join(",") } : { evolutionSeriesTwoValues: nextValues.join(",") }) }); }
  function addRow() { const nextLabels = [...labels, `Ponto ${labels.length + 1}`]; const nextValues = [...activeValues.split(","), "0"]; onBlockChange({ evolutionLabels: nextLabels.join(","), ...(series === 1 ? { evolutionSeriesOneValues: nextValues.join(",") } : { evolutionSeriesTwoValues: nextValues.join(",") }) }); }
  function removeRow(index: number) { if (labels.length <= 2) return; const nextLabels = labels.filter((_, itemIndex) => itemIndex !== index); const nextValues = activeValues.split(",").filter((_, itemIndex) => itemIndex !== index); onBlockChange({ evolutionLabels: nextLabels.join(","), ...(series === 1 ? { evolutionSeriesOneValues: nextValues.join(",") } : { evolutionSeriesTwoValues: nextValues.join(",") }) }); }
  return <div className="chart-properties"><div className="properties-tabs"><button className={!design ? "active" : ""} type="button" onClick={() => setDesign(false)}>Configurações</button><button className={design ? "active" : ""} type="button" onClick={() => setDesign(true)}>Design</button></div>{design ? <><label>Estilo das Séries<small>Configure as cores das séries</small></label><span className="chart-series-tabs"><button className={series === 1 ? "active" : ""} type="button" onClick={() => setSeries(1)}>Série 1</button><button className={series === 2 ? "active" : ""} type="button" onClick={() => setSeries(2)}>Série 2</button></span><ColorField label="" value={series === 1 ? block.evolutionSeriesOneColor ?? "#3a9ff8" : block.evolutionSeriesTwoColor ?? "#111827"} onChange={(value) => onBlockChange(series === 1 ? { evolutionSeriesOneColor: value } : { evolutionSeriesTwoColor: value })} /><button className="add-chart-row" type="button">＋ Adicionar Cor</button></> : <><label>Título<input value={block.evolutionTitle ?? "Gráfico Comparativo"} onChange={(event) => onBlockChange({ evolutionTitle: event.target.value })} /></label><label>Descrição<input value={block.evolutionDescription ?? "Comparação Você vs. Concorrente"} onChange={(event) => onBlockChange({ evolutionDescription: event.target.value })} /></label><div className="chart-series-fields"><span className="chart-series-tabs"><button className={series === 1 ? "active" : ""} type="button" onClick={() => setSeries(1)}>Série 1</button><button className={series === 2 ? "active" : ""} type="button" onClick={() => setSeries(2)}>Série 2</button><button type="button" onClick={addRow}>＋</button></span><label>Descrição do Último Ponto<input value={activeLabel} onChange={(event) => onBlockChange(series === 1 ? { evolutionSeriesOneLabel: event.target.value } : { evolutionSeriesTwoLabel: event.target.value })} /></label><div className="chart-table-head"><span>Legenda</span><span>Valor</span></div>{labels.map((label, index) => <div className="chart-data-row" key={`${label}-${index}`}><input value={label} onChange={(event) => updateRow(index, "label", event.target.value)} /><input value={activeValues.split(",")[index] ?? ""} onChange={(event) => updateRow(index, "value", event.target.value)} /><button type="button" onClick={() => removeRow(index)} aria-label={`Excluir ${label}`}>♧</button></div>)}<button className="add-chart-row" type="button" onClick={addRow}>＋ Adicionar Valor</button></div></>}</div>;
}
