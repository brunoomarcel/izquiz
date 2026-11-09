"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDomainBaseUrl, getPublicBaseUrl } from "@/lib/public-url";

type Domain = { id: string; hostname: string };

export function DomainShareView({ notify, funnelId, supabase }: { notify: (message: string) => void; funnelId: string; supabase: SupabaseClient | null }) {
  const [tab, setTab] = useState<"share" | "embed">("share");
  const [slug, setSlug] = useState(funnelId);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainId, setDomainId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let active = true;
    async function load() {
      const funnel = await db.from("funnels").select("slug, custom_domain_id, workspace_id").eq("id", funnelId).maybeSingle();
      if (!active) return;
      if (funnel.data) { setSlug(funnel.data.slug); setDomainId(funnel.data.custom_domain_id ?? ""); }
      if (funnel.data?.workspace_id) {
        const domainResult = await db.from("custom_domains").select("id, hostname").eq("workspace_id", funnel.data.workspace_id).order("hostname");
        if (active) setDomains((domainResult.data ?? []) as Domain[]);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [funnelId, supabase]);

  const selectedDomain = domains.find((domain) => domain.id === domainId)?.hostname;
  const link = `${selectedDomain ? getDomainBaseUrl(selectedDomain) : getPublicBaseUrl()}/quiz/${slug}`;
  const embed = `<iframe src="${link}" width="100%" height="800" frameborder="0"></iframe>`;
  async function copy(value: string, message: string) { try { await navigator.clipboard.writeText(value); notify(message); } catch { notify("Não foi possível copiar"); } }
  async function assignDomain(nextDomainId: string) {
    if (!supabase) return;
    setDomainId(nextDomainId);
    const result = await supabase.from("funnels").update({ custom_domain_id: nextDomainId || null }).eq("id", funnelId);
    notify(result.error ? "Não foi possível vincular o domínio" : nextDomainId ? "Domínio vinculado ao funil" : "Domínio removido do funil");
  }

  return <div className="share-page"><div className="subtabs"><button className={tab === "share" ? "active" : ""} onClick={() => setTab("share")}>↗ Compartilhar</button><button className={tab === "embed" ? "active" : ""} onClick={() => setTab("embed")}>&lt;/&gt; Incorporar</button></div>{tab === "share" ? <div className="share-content"><h2>Link do seu funil</h2><p>Copie o link direto e compartilhe onde quiser.</p><label className="share-domain-label">Domínio do funil<select disabled={loading || domains.length === 0} value={domainId} onChange={(event) => void assignDomain(event.target.value)}><option value="">Domínio padrão do izquiz</option>{domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.hostname}</option>)}</select></label><div className="share-link"><span className="share-url">{link}</span><button onClick={() => copy(link, "Link copiado")}>▣ Copiar</button><button onClick={() => window.open(link, "_blank", "noopener,noreferrer")}>↗ Preview</button></div>{domains.length === 0 && <small className="share-domain-hint">Cadastre um domínio em Configurações → Domínio para vincular este funil.</small>}</div> : <div className="share-content"><h2>Incorporar funil</h2><p>Use este código para incorporar o funil em uma página.</p><textarea className="embed-code" readOnly value={embed} /><button className="primary-btn" onClick={() => copy(embed, "Código copiado")}>▣ Copiar código</button></div>}</div>;
}
