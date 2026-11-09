"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditorStep } from "./types";
import { readEditorDocumentCache } from "@/lib/editor/cache";

type FlowStep = EditorStep & { id?: string; position?: number };
type FlowEvent = { step_id: string | null; event_type: string; lead_id: string | null };

type FlowViewProps = {
  funnelId: string | null;
  supabase: SupabaseClient | null;
};

export function FlowView({ funnelId, supabase }: FlowViewProps) {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [events, setEvents] = useState<FlowEvent[]>([]);
  const [people, setPeople] = useState(0);
  const [showMetrics, setShowMetrics] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const cache = funnelId ? readEditorDocumentCache(funnelId) : null;
      if (cache?.steps?.length && active) setSteps(cache.steps.filter((step) => !step.break));
      if (!supabase || !funnelId) {
        setLoading(false);
        return;
      }
      const stepResult = await supabase.from("funnel_steps").select("id, title, step_type, position").eq("funnel_id", funnelId).order("position");
      if (!active) return;
      if (!stepResult.error) setSteps((stepResult.data ?? []).filter((step) => step.step_type !== "break").map((step) => ({ id: step.id, title: step.title, position: step.position, kind: step.step_type === "intro" ? "INTRO" : step.step_type === "result" ? "RESULTADO" : "PERGUNTA" })));
      const [eventResult, leadResult] = await Promise.all([
        supabase.from("funnel_events").select("step_id, event_type, lead_id").eq("funnel_id", funnelId),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("funnel_id", funnelId),
      ]);
      if (!active) return;
      if (!eventResult.error) setEvents((eventResult.data ?? []) as FlowEvent[]);
      if (!leadResult.error) setPeople(leadResult.count ?? 0);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [funnelId, supabase]);

  const totalPeople = useMemo(() => {
    const eventPeople = new Set(events.map((event) => event.lead_id).filter(Boolean)).size;
    return Math.max(people, eventPeople);
  }, [events, people]);

  return <div className="flow-page">
    <div className="flow-toolbar"><div><h2>Fluxo do funil</h2><p>{loading ? "Sincronizando etapas..." : `${steps.length} etapas sincronizadas`}</p></div><button type="button" className={showMetrics ? "toggle on" : "toggle"} aria-label="Mostrar métricas" onClick={() => setShowMetrics((value) => !value)} /></div>
    <div className="flow-summary"><div><span>Pessoas no funil</span><strong>{totalPeople}</strong></div><div><span>Respostas</span><strong>{events.filter((event) => event.event_type === "answer_submitted").length}</strong></div><div><span>Taxa de conclusão</span><strong>{totalPeople ? `${Math.round((events.filter((event) => event.event_type === "completed").length / totalPeople) * 100)}%` : "0%"}</strong></div></div>
    <div className="flow-map">
      {steps.length === 0 ? <div className="flow-empty">Nenhuma etapa encontrada neste funil.</div> : steps.map((step, index) => {
        const viewed = events.filter((event) => event.step_id === step.id && event.event_type === "step_viewed").length;
        const responses = events.filter((event) => event.step_id === step.id && event.event_type === "answer_submitted").length;
        const rate = viewed ? Math.round((responses / viewed) * 100) : 0;
        return <div className="map-node" key={step.id ?? `${step.title}-${index}`}><strong>{step.title}</strong><span>{step.kind === "INTRO" ? "Introdução" : step.kind === "RESULTADO" ? "Resultado" : "Pergunta"}</span>{showMetrics && <><span>👥 {viewed || totalPeople} pessoas</span><span>↗ {responses} respostas</span><b>{rate}% taxa</b></>}</div>;
      })}
    </div>
    <div className="zoom-controls">＋<br /><span>⌁</span><br />−</div>
  </div>;
}
