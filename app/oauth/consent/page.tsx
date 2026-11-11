"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "../../../lib/supabase/client";

type AuthorizationDetails = {
  authorization_id: string;
  client: { name?: string; uri?: string };
  scope?: string;
};

function ConsentContent() {
  const params = useSearchParams();
  const authorizationId = params.get("authorization_id");
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  const loadAuthorization = useCallback(async () => {
    if (!supabase || !authorizationId) {
      setMessage("Solicitação OAuth inválida.");
      setBusy(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    setUser(sessionData.session?.user ?? null);
    if (!sessionData.session) {
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error) {
      setMessage(error.message);
    } else if ("redirect_url" in data) {
      window.location.assign(data.redirect_url);
      return;
    } else {
      setDetails(data as AuthorizationDetails);
    }
    setBusy(false);
  }, [authorizationId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAuthorization(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAuthorization]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    await loadAuthorization();
  }

  async function decide(approved: boolean) {
    if (!supabase || !authorizationId) return;
    setBusy(true);
    setMessage("");
    const result = approved
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }
    if (result.data?.redirect_url) window.location.assign(result.data.redirect_url);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fb", color: "#13213b", fontFamily: "Poppins, Arial, sans-serif" }}>
      <section style={{ width: "min(100%, 460px)", background: "#fff", border: "1px solid #e4eaf3", borderRadius: 16, padding: 30, boxShadow: "0 12px 30px #13213b12" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18 }}><span style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, background: "#3778fa", color: "#fff", fontSize: 11 }}>iz</span> izquiz</div>
        <p style={{ color: "#2f6df3", fontSize: 11, letterSpacing: 1.2, fontWeight: 700, marginTop: 28 }}>AUTORIZAÇÃO</p>
        <h1 style={{ fontSize: 24, margin: "8px 0" }}>Conectar aplicativo</h1>
        {!authorizationId && <p>Não foi possível identificar a solicitação de autorização.</p>}
        {authorizationId && !user && <>
          <p style={{ color: "#5f7391", lineHeight: 1.6 }}>Entre na sua conta do Izquiz para autorizar o acesso.</p>
          <form onSubmit={signIn} style={{ display: "grid", gap: 12 }}>
            <label>E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ display: "block", width: "100%", marginTop: 6, padding: 11, border: "1px solid #dce4ee", borderRadius: 8 }} /></label>
            <label>Senha<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: "block", width: "100%", marginTop: 6, padding: 11, border: "1px solid #dce4ee", borderRadius: 8 }} /></label>
            <button type="submit" disabled={busy} style={{ border: 0, borderRadius: 8, padding: 12, background: "#2f6df3", color: "#fff", fontWeight: 700 }}>Entrar</button>
          </form>
        </>}
        {user && details && <>
          <p style={{ color: "#5f7391", lineHeight: 1.6 }}><strong>{details.client.name ?? "Um aplicativo"}</strong> solicita acesso à sua conta do Izquiz.</p>
          <div style={{ background: "#f7f9fc", borderRadius: 10, padding: 16, margin: "20px 0", color: "#4f6386" }}>
            <strong>Permissões solicitadas</strong>
            <p style={{ marginBottom: 0 }}>{(details.scope ?? "openid").split(" ").join(", ")}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" disabled={busy} onClick={() => void decide(false)} style={{ flex: 1, border: "1px solid #dce4ee", borderRadius: 8, padding: 12, background: "#fff", color: "#314c70" }}>Negar</button>
            <button type="button" disabled={busy} onClick={() => void decide(true)} style={{ flex: 1, border: 0, borderRadius: 8, padding: 12, background: "#2f6df3", color: "#fff", fontWeight: 700 }}>Autorizar</button>
          </div>
        </>}
        {busy && !user && <p style={{ color: "#70839e" }}>Carregando...</p>}
        {message && <p style={{ color: "#c0392b", lineHeight: 1.5 }}>{message}</p>}
      </section>
    </main>
  );
}

export default function OAuthConsentPage() {
  return <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Carregando...</main>}><ConsentContent /></Suspense>;
}
