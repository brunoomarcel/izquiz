"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type FunnelStep = { id: string; title: string; position: number };
type MetaSettings = { pixelId?: string; accessToken?: string; conversionMode?: "any_form" | "specific_step"; conversionStepId?: string };
type Props = { funnelId: string | null; supabase: SupabaseClient | null; notify: (message: string) => void };

const storageKey = (funnelId: string | null) => `izquiz:meta-pixel:${funnelId ?? "local"}`;
function readStoredSettings(funnelId: string | null): MetaSettings {
  if (typeof window === "undefined") return { conversionMode: "specific_step" };
  try { return (JSON.parse(window.localStorage.getItem(storageKey(funnelId)) ?? "null") as MetaSettings | null) ?? { conversionMode: "specific_step" }; } catch { return { conversionMode: "specific_step" }; }
}

export function MetaPixelIntegration({ funnelId, supabase, notify }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"credentials" | "conversion">("credentials");
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [settings, setSettings] = useState<MetaSettings>(() => readStoredSettings(funnelId));

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !funnelId) return;
      const result = await supabase.from("funnel_steps").select("id, title, position").eq("funnel_id", funnelId).order("position");
      if (active && !result.error) setSteps(result.data ?? []);
    }
    void load();
    return () => { active = false; };
  }, [funnelId, supabase]);

  async function save(next: MetaSettings, message: string) {
    setSettings(next);
    window.localStorage.setItem(storageKey(funnelId), JSON.stringify(next));
    if (supabase && funnelId) {
      const current = await supabase.from("funnels").select("settings").eq("id", funnelId).maybeSingle();
      const currentSettings = (current.data?.settings ?? {}) as Record<string, unknown>;
      await supabase.from("funnels").update({ settings: { ...currentSettings, metaPixel: next } }).eq("id", funnelId);
    }
    notify(message);
  }

  return <div className="section-page integrations-page"><h2>Integração</h2><p className="integration-intro">Conecte o Meta/Facebook Pixel para acompanhar conversões e eventos do seu funil.</p><div className="meta-integration-card"><div className="meta-logo">∞</div><div><h3>Meta/Facebook Pixel</h3><p>Rastreie visualizações, respostas e conversões do quiz.</p></div><button type="button" className="primary-btn" onClick={() => setOpen(true)}>Configurar</button></div>{open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="meta-pixel-modal" role="dialog" aria-modal="true" aria-labelledby="meta-pixel-title"><button type="button" className="modal-close" aria-label="Fechar" onClick={() => setOpen(false)}>×</button><h2 id="meta-pixel-title"><span className="meta-logo">∞</span> Configurar Meta/Facebook Pixel</h2><div className="properties-tabs"><button type="button" className={tab === "credentials" ? "active" : ""} onClick={() => setTab("credentials")}>⚙ Credenciais</button><button type="button" className={tab === "conversion" ? "active" : ""} onClick={() => setTab("conversion")}>◉ Conversão</button></div>{tab === "credentials" ? <div className="meta-pixel-form"><h3>Configuração do Meta Pixel</h3><p>Configure seu Pixel do Facebook para rastrear conversões e eventos personalizados.</p><label>Pixel ID<input value={settings.pixelId ?? ""} onChange={(event) => setSettings({ ...settings, pixelId: event.target.value })} placeholder="1008219498559775" /></label><small>* Encontre seu Pixel ID no Facebook Business Manager</small><label>Token de Acesso (Opcional)<input type="password" value={settings.accessToken ?? ""} onChange={(event) => setSettings({ ...settings, accessToken: event.target.value })} placeholder="EAAxxxxxxxxxxxx" /></label><small>* Necessário apenas para eventos server-side</small><button type="button" className="primary-btn" onClick={() => void save(settings, "Credenciais do Meta Pixel salvas")}>Salvar Credenciais</button></div> : <div className="meta-pixel-form"><h3>Configuração de Conversão</h3><p>Determine quando um preenchimento será considerado uma conversão para o Meta Pixel.</p><label>Momento da conversão<select value={settings.conversionMode ?? "specific_step"} onChange={(event) => setSettings({ ...settings, conversionMode: event.target.value as MetaSettings["conversionMode"] })}><option value="any_form">Ao finalizar o formulário por qualquer caminho</option><option value="specific_step">Ao chegar em um step específico</option></select></label>{settings.conversionMode === "specific_step" && <label>Selecione o step<select value={settings.conversionStepId ?? ""} onChange={(event) => setSettings({ ...settings, conversionStepId: event.target.value })}><option value="">Escolha um step...</option>{steps.map((step) => <option key={step.id} value={step.id}>{step.title}</option>)}</select></label>}<button type="button" className="primary-btn" onClick={() => void save(settings, "Configuração de conversão salva")}>Salvar Configuração</button></div>}</section></div>}</div>;
}
