"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Domain = { id: string; hostname: string; is_verified: boolean };
type Funnel = { id: string; name: string; custom_domain_id: string | null };

function normalizeHostname(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";
  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  }
}

export function DomainSettings({ supabase, funnelId, notify }: { supabase: SupabaseClient | null; funnelId: string | null; notify: (message: string) => void }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [hostname, setHostname] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let active = true;
    async function load() {
      const { data: userResult } = await db.auth.getUser();
      const userId = userResult.user?.id;
      if (!userId) { if (active) setLoading(false); return; }
      const memberships = await db.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
      const workspace = memberships.data?.workspace_id ?? null;
      if (!workspace || !active) { if (active) setLoading(false); return; }
      setWorkspaceId(workspace);
      const [domainResult, funnelResult] = await Promise.all([
        db.from("custom_domains").select("id, hostname, is_verified").eq("workspace_id", workspace).order("hostname"),
        db.from("funnels").select("id, name, custom_domain_id").eq("workspace_id", workspace).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setDomains((domainResult.data ?? []) as Domain[]);
      setFunnels((funnelResult.data ?? []) as Funnel[]);
      const current = funnelResult.data?.find((item) => item.id === funnelId)?.custom_domain_id ?? "";
      setSelectedDomainId(current);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [funnelId, supabase]);

  async function addDomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeHostname(hostname);
    if (!supabase || !workspaceId || !normalized) return;
    setSaving(true);
    const result = await supabase.from("custom_domains").insert({ workspace_id: workspaceId, hostname: normalized }).select("id, hostname, is_verified").single();
    if (result.error) notify(result.error.code === "23505" ? "Este domínio já está cadastrado" : "Não foi possível cadastrar o domínio");
    else { setDomains((current) => [...current, result.data as Domain].sort((a, b) => a.hostname.localeCompare(b.hostname))); setHostname(""); notify("Domínio cadastrado"); }
    setSaving(false);
  }

  async function assignDomain(domainId: string) {
    if (!supabase || !funnelId) return;
    setSelectedDomainId(domainId);
    const result = await supabase.from("funnels").update({ custom_domain_id: domainId || null }).eq("id", funnelId);
    if (result.error) notify("Não foi possível vincular o domínio");
    else { setFunnels((current) => current.map((funnel) => funnel.id === funnelId ? { ...funnel, custom_domain_id: domainId || null } : funnel)); notify(domainId ? "Domínio vinculado ao funil" : "Domínio removido do funil"); }
  }

  if (!supabase) return <div className="settings-domain-card"><h3>Domínios personalizados</h3><p>Faça login para cadastrar domínios.</p></div>;
  if (loading) return <div className="settings-domain-card"><p>Carregando domínios...</p></div>;

  return <div className="settings-domain-card">
    <h2>Domínios personalizados</h2>
    <p>Cadastre domínios da sua conta e escolha em qual domínio cada funil publicado ficará disponível.</p>
    <form className="domain-add-form" onSubmit={addDomain}>
      <label>Adicionar domínio<input value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="quiz.suaempresa.com.br" /></label>
      <button className="primary-btn" disabled={saving || !hostname.trim()}>{saving ? "Salvando..." : "Adicionar domínio"}</button>
    </form>
    <div className="domain-help"><strong>Configuração de DNS</strong><span>Aponte o registro CNAME do domínio para o endereço onde o izquiz estiver publicado. Exemplo: <code>quiz.suaempresa.com.br → izquiz.stuffshub.com</code></span></div>
    <div className="domain-list">{domains.length === 0 ? <p>Nenhum domínio cadastrado ainda.</p> : domains.map((domain) => <div className="domain-row" key={domain.id}><span><strong>{domain.hostname}</strong><small>{domain.is_verified ? "Ativo" : "Aguardando verificação"}</small></span><button type="button" className="outline-btn" onClick={() => void navigator.clipboard?.writeText(`https://${domain.hostname}`)}>Copiar domínio</button></div>)}</div>
    {funnelId && <label className="domain-funnel-select">Domínio deste funil<select value={selectedDomainId} onChange={(event) => void assignDomain(event.target.value)}><option value="">Usar domínio padrão do izquiz</option>{domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.hostname}</option>)}</select><small>{funnels.find((funnel) => funnel.id === funnelId)?.name ?? "Funil atual"}</small></label>}
  </div>;
}
