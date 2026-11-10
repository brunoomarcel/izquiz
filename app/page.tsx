"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SetStateAction } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImagePickerModal } from "@/components/editor/ImagePickerModal";
import { StepList } from "@/components/editor/StepList";
import { BlockRenderer } from "@/components/editor/BlockRenderer";
import { OptionsBlock, OptionsProperties } from "@/components/editor/OptionsBlock";
import { FormBlock, FormProperties } from "@/components/editor/FormBlock";
import { TextareaBlock, TextareaProperties } from "@/components/editor/TextareaBlock";
import { ArgumentsBlock, ArgumentsProperties } from "@/components/editor/ArgumentsBlock";
import { AlertBlock, AlertProperties } from "@/components/editor/AlertBlock";
import { FaqBlock, FaqProperties } from "@/components/editor/FaqBlock";
import { CarouselBlock, CarouselProperties } from "@/components/editor/CarouselBlock";
import { TestimonialsBlock, TestimonialsProperties } from "@/components/editor/TestimonialsBlock";
import { BeforeAfterBlock, BeforeAfterProperties } from "@/components/editor/BeforeAfterBlock";
import { AudioBlock, AudioProperties } from "@/components/editor/AudioBlock";
import { SpacerBlock } from "@/components/editor/SpacerBlock";
import { LoadingBlock, LoadingProperties } from "@/components/editor/LoadingBlock";
import { TimerBlock } from "@/components/editor/TimerBlock";
import { DelayBlock, DelayProperties } from "@/components/editor/DelayBlock";
import { LevelBlock, LevelProperties } from "@/components/editor/LevelBlock";
import { WeightBlock, WeightProperties } from "@/components/editor/WeightBlock";
import { HeightBlock, HeightProperties } from "@/components/editor/HeightBlock";
import { EvolutionBlock, EvolutionProperties, TrendBlock, TrendProperties } from "@/components/editor/TrendEvolutionBlock";
import { NotificationBlock, NotificationProperties } from "@/components/editor/NotificationBlock";
import { ScriptBlock } from "@/components/editor/ScriptBlock";
import { DataBlock } from "@/components/editor/DataBlocks";
import { GamificationBlock, GamificationProperties } from "@/components/editor/GamificationBlock";
import { BodyMapBlock } from "@/components/editor/BodyMapBlock";
import { PlansBlock, PlansProperties } from "@/components/editor/PlansBlock";
import { ButtonProperties } from "@/components/editor/ButtonProperties";
import { SimpleElementProperties, type SimpleKind } from "@/components/editor/SimpleElementProperties";
import { FlowView } from "@/components/editor/FlowView";
import { MetaPixelIntegration } from "@/components/editor/MetaPixelIntegration";
import { DomainSettings } from "@/components/editor/DomainSettings";
import { DomainShareView } from "@/components/editor/DomainShareView";
import { getPublicBaseUrl } from "@/lib/public-url";
import type { CanvasBlock, EditorStep } from "@/components/editor/types";
import { groupBlocksByStep } from "@/lib/editor/document";
import { readEditorDocumentCache, writeEditorDocumentCache } from "@/lib/editor/cache";

type Screen = "Dashboard" | "Analytics";
type EditorView = "Editar" | "Integrar" | "Fluxo" | "Resultados" | "Compartilhar" | "Configurações";
type Step = EditorStep;
type EditorSession = { inEditor: boolean; screen: Screen; editorView: EditorView; funnelId: string | null; sidebarCollapsed: boolean; published: boolean };

function readEditorSession(): EditorSession | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem("izquiz:editor-session") ?? "null") as EditorSession | null; } catch { return null; }
}

const steps: Step[] = [
  { title: "Passo 1", kind: "INTRO", active: true },
  { title: "Passo 2", kind: "PERGUNTA" },
  { title: "Passo 3", kind: "PERGUNTA" },
  { title: "break 1", kind: "BREAK", break: true },
  { title: "Passo 4", kind: "PERGUNTA" },
  { title: "Passo 5", kind: "PERGUNTA" },
  { title: "break 2", kind: "BREAK", break: true },
  { title: "Passo 6", kind: "PERGUNTA" },
  { title: "Passo 7", kind: "PERGUNTA" },
  { title: "break 3", kind: "BREAK", break: true },
  { title: "Passo 8", kind: "PERGUNTA" },
  { title: "Passo 9", kind: "PERGUNTA" },
  { title: "LP", kind: "LANDING" },
];

const blankSteps: Step[] = [
  { title: "Introdução", kind: "INTRO", active: true },
  { title: "Pergunta 1", kind: "PERGUNTA" },
  { title: "Pergunta 2", kind: "PERGUNTA" },
  { title: "Pergunta 3", kind: "PERGUNTA" },
  { title: "Resultado", kind: "RESULTADO" },
];

const components = [
  { group: "Texto", items: ["Texto", "Argumentos", "Alerta", "FAQ"] },
  { group: "Mídia", items: ["Imagem", "Vídeo", "Carrossel", "Depoimentos", "Antes/Depois", "Áudio"] },
  { group: "Ação", items: ["Botão", "Opções", "Espaço", "Loading", "Timer", "Delay"] },
  { group: "Notificação", items: ["Notificação", "Script"] },
  { group: "Forms", items: ["Formulário", "Texto", "Área de Texto"] },
  { group: "Dados", items: ["Nível", "Peso", "Altura", "IMC", "Idade", "Tendência", "Evolutivo", "Gamificação", "Mapa Corporal"] },
  { group: "Checkout", items: ["Planos"] },
];

const lockedComponents = new Set<string>([]);

const integrations = ["Google Analytics GA4", "Google Tag Manager", "Meta/Facebook Pixel", "Google Site Verification", "Jivo", "Crisp", "TikTok", "N8N", "Make"];

function Icon({ children }: { children: React.ReactNode }) { return <span className="ui-icon">{children}</span>; }

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [savedSession] = useState(readEditorSession);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>(savedSession?.screen ?? "Dashboard");
  const [editorView, setEditorView] = useState<EditorView>(savedSession?.editorView ?? "Editar");
  const [inEditor, setInEditor] = useState(savedSession?.inEditor ?? false);
  const [toast, setToast] = useState("");
  const [published, setPublished] = useState(savedSession?.published ?? false);
  const [editorSteps, setEditorSteps] = useState<Step[]>(blankSteps);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(savedSession?.funnelId ?? null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(savedSession?.sidebarCollapsed ?? false);

  useEffect(() => {
    window.localStorage.setItem("izquiz:editor-session", JSON.stringify({ inEditor, screen, editorView, funnelId: activeFunnelId, sidebarCollapsed, published } satisfies EditorSession));
  }, [activeFunnelId, editorView, inEditor, published, screen, sidebarCollapsed]);

  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); }, []);
  const openEditor = (mode: "blank" | "sample" = "blank", funnelId: string | null = null) => { setActiveFunnelId(funnelId); setEditorSteps(mode === "sample" ? steps : blankSteps); setScreen("Dashboard"); setEditorView("Editar"); setSidebarCollapsed(true); setInEditor(true); if (mode === "sample") notify("Funil aberto"); else if (!funnelId) notify("Novo funil criado com template inicial"); };

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setAuthLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  if (authLoading) return <div className="auth-loading">Carregando izquiz...</div>;
  if (supabase && !user) return <AuthScreen supabase={supabase} />;

  if (inEditor) {
    return <ProductFrame toast={toast} editorMode sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} screen={screen} editorView={editorView} setScreen={setScreen} setEditorView={setEditorView} setInEditor={setInEditor} notify={notify} published={published} setPublished={setPublished}>{editorView === "Editar" ? <EditorCanvas supabase={supabase} funnelId={activeFunnelId} notify={notify} stepsData={editorSteps} onBack={() => { setInEditor(false); setSidebarCollapsed(false); }} /> : <SecondaryView editorView={editorView} screen={screen} notify={notify} funnelId={activeFunnelId} supabase={supabase} />}</ProductFrame>;
  }

  if (editorView !== "Editar" || screen === "Analytics") {
    return <ProductFrame toast={toast} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} screen={screen} editorView={editorView} setScreen={setScreen} setEditorView={setEditorView} setInEditor={setInEditor} notify={notify} published={published} setPublished={setPublished}><SecondaryView editorView={editorView} screen={screen} notify={notify} funnelId={activeFunnelId} supabase={supabase} /></ProductFrame>;
  }

  return <ProductFrame toast={toast} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} screen={screen} editorView={editorView} setScreen={setScreen} setEditorView={setEditorView} setInEditor={setInEditor} notify={notify} published={published} setPublished={setPublished}>
    <Dashboard supabase={supabase} userId={user?.id ?? "local-user"} openEditor={openEditor} notify={notify} />
  </ProductFrame>;
}

function AuthScreen({ supabase }: { supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) setMessage(result.error.message);
    else setMessage(mode === "signup" ? "Conta criada. Verifique seu e-mail se a confirmação estiver ativa." : "Acesso realizado.");
    setBusy(false);
  }

  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="logo-mark">iz</div><span>izquiz</span></div><p className="eyebrow">QUIZ BUILDER</p><h1>{mode === "login" ? "Entre no seu painel" : "Crie sua conta"}</h1><p className="auth-copy">Crie, publique e acompanhe seus quizzes interativos em um só lugar.</p><form onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" required /></label><label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} required /></label>{message && <p className="auth-message">{message}</p>}<button className="primary-btn auth-submit" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button></form><button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}</button></section></main>;
}

function ProductFrame({ children, screen, editorView, setScreen, setEditorView, setInEditor, notify, published, setPublished, editorMode = false, toast, sidebarCollapsed, setSidebarCollapsed }: { children: React.ReactNode; screen: Screen; editorView: EditorView; setScreen: (value: Screen) => void; setEditorView: (value: EditorView) => void; setInEditor: (value: boolean) => void; notify: (message: string) => void; published: boolean; setPublished: (value: boolean) => void; editorMode?: boolean; toast: string; sidebarCollapsed: boolean; setSidebarCollapsed: (value: boolean) => void }) {
  return <div className={`product-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="product-sidebar">
      <button className="product-logo" aria-label="Voltar ao início" onClick={() => { setScreen("Dashboard"); setEditorView("Editar"); setInEditor(false); setSidebarCollapsed(false); }}><div className="logo-mark">iz</div><span>izquiz</span></button>
      <button className="collapse-btn" aria-label={sidebarCollapsed ? "Abrir menu" : "Fechar menu"} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
      <div className="search-box"><Icon>⌕</Icon><span>Pesquisar</span><kbd>⌘ F</kbd></div>
      <nav className="product-nav">
        <button className={screen === "Dashboard" && !editorMode && editorView === "Editar" ? "nav-link active" : "nav-link"} onClick={() => { setScreen("Dashboard"); setEditorView("Editar"); setInEditor(false); }}><Icon>⌂</Icon>Dashboard</button>
        <button className={screen === "Analytics" ? "nav-link active" : "nav-link"} onClick={() => { setScreen("Analytics"); setInEditor(false); }}><Icon>⌁</Icon>Analytics</button>
      </nav>
      <div className="sidebar-bottom"><button className="help-link" onClick={() => notify("Central de ajuda em breve")}><Icon>?</Icon>Ajuda</button><div className="notification-card"><strong>Você não tem notificações</strong><span><b>0</b> Notificações</span></div><div className="usage"><div><span>Leads</span><b>0 / 500</b></div><div className="usage-line"><i style={{ width: "0%" }} /></div><div><span>Funis</span><b>1 / 1</b></div><div className="usage-line"><i style={{ width: "100%" }} /></div><button onClick={() => notify("Plano Pro em breve")}>Fazer upgrade</button></div><div className="profile"><span className="profile-avatar">BM</span><div><strong>BRUNO MARCEL</strong><small>brunomarcel458@gmail...</small></div><b>⋮</b></div></div>
    </aside>
    <div className="product-main">
      <header className="product-header">
        <div className="header-title"><span className="header-home">⌂</span><strong>{editorMode ? "FE POR UM FIO" : editorView === "Editar" ? screen : editorView}</strong></div>
        {editorMode && <EditorNav editorView={editorView} setEditorView={setEditorView} published={published} setPublished={setPublished} notify={notify} />}
      </header>
      <div className="page-content">{children}</div>
    </div>
    {toast && <div className="toast show">{toast}</div>}
  </div>;
}

function EditorNav({ editorView, setEditorView, published, setPublished, notify }: { editorView: EditorView; setEditorView: (value: EditorView) => void; published: boolean; setPublished: (value: boolean) => void; notify: (message: string) => void }) {
  const tabs: EditorView[] = ["Editar", "Integrar", "Fluxo", "Resultados", "Compartilhar", "Configurações"];
  return <><div className="editor-tabs">{tabs.map((tab) => <button key={tab} className={editorView === tab ? "editor-tab active" : "editor-tab"} onClick={() => setEditorView(tab)}><Icon>{tab === "Editar" ? "✎" : tab === "Integrar" ? "⌘" : tab === "Fluxo" ? "⌘" : tab === "Resultados" ? "♙" : tab === "Compartilhar" ? "↗" : "⚙"}</Icon>{tab}</button>)}</div><div className="header-actions"><button className="draft-btn">◈ {published ? "Publicado" : "Rascunho"}</button><button className="primary-btn" onClick={() => { window.dispatchEvent(new Event("izquiz:publish")); setPublished(true); notify("Salvando e publicando o funil..."); }}>⇩ Publicar</button></div></>;
}

type FunnelItem = { id: string; name: string; slug: string; status: string; folder_id: string | null; leads: number };
type FolderItem = { id: string; name: string };

function getCachedFunnels(userId: string): FunnelItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.sessionStorage.getItem(`izquiz:funnels:${userId}`) ?? "[]") as FunnelItem[]; } catch { return []; }
}

function getCachedFolders(userId: string): FolderItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.sessionStorage.getItem(`izquiz:folders:${userId}`) ?? "[]") as FolderItem[]; } catch { return []; }
}

function withTimeout<T>(promise: PromiseLike<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), milliseconds);
    promise.then((value) => { window.clearTimeout(timer); resolve(value); }, (error) => { window.clearTimeout(timer); reject(error); });
  });
}

function FunnelCard({ funnel, openEditor, openMenuId, setOpenMenuId, duplicateFunnel, duplicating, setFunnelToDelete, setFunnelToMove, removeFunnelFromFolder, setFunnelToRename, notify }: { funnel: FunnelItem; openEditor: (mode?: "blank" | "sample", funnelId?: string | null) => void; openMenuId: string | null; setOpenMenuId: (id: string | null) => void; duplicateFunnel: (funnel: FunnelItem) => void; duplicating: boolean; setFunnelToDelete: (funnel: { id: string; name: string }) => void; setFunnelToMove: (funnel: FunnelItem) => void; removeFunnelFromFolder: (funnel: FunnelItem) => void; setFunnelToRename: (funnel: FunnelItem) => void; notify: (message: string) => void }) {
  return <div className="funnel-card"><button className="funnel-open" onClick={() => openEditor("blank", funnel.id)}><span><span className="funnel-icon">◉</span><strong>{funnel.name}</strong></span><p><b>{funnel.leads}</b> Leads</p></button><button className="funnel-more" aria-label={`Ações de ${funnel.name}`} onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === funnel.id ? null : funnel.id); }}>•••</button>{openMenuId === funnel.id && <FunnelMenu funnel={funnel} duplicating={duplicating} onEdit={() => { setOpenMenuId(null); openEditor("blank", funnel.id); }} onDuplicate={() => duplicateFunnel(funnel)} onAddToFolder={() => { setOpenMenuId(null); setFunnelToMove(funnel); }} onRemoveFromFolder={() => { setOpenMenuId(null); removeFunnelFromFolder(funnel); }} onRename={() => { setOpenMenuId(null); setFunnelToRename(funnel); }} onDelete={() => { setOpenMenuId(null); setFunnelToDelete({ id: funnel.id, name: funnel.name }); }} notify={notify} />}</div>;
}

function Dashboard({ supabase, userId, openEditor, notify }: { supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>> | null; userId: string; openEditor: (mode?: "blank" | "sample", funnelId?: string | null) => void; notify: (message: string) => void }) {
  const cacheKey = `izquiz:funnels:${userId}`;
  const foldersCacheKey = `izquiz:folders:${userId}`;
  const cachedFunnels = getCachedFunnels(userId);
  const cachedFolders = getCachedFolders(userId);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [funnels, setFunnels] = useState<FunnelItem[]>(cachedFunnels);
  const [folders, setFolders] = useState<FolderItem[]>(cachedFolders);
  const [loading, setLoading] = useState(cachedFunnels.length === 0 && cachedFolders.length === 0);
  const [creating, setCreating] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [funnelToDelete, setFunnelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"Todos" | "Pastas" | "Funis">("Todos");
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [funnelToMove, setFunnelToMove] = useState<FunnelItem | null>(null);
  const [movingFunnel, setMovingFunnel] = useState(false);
  const [funnelToRename, setFunnelToRename] = useState<FunnelItem | null>(null);
  const [renamingFunnel, setRenamingFunnel] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !loading) window.sessionStorage.setItem(cacheKey, JSON.stringify(funnels));
  }, [cacheKey, funnels, loading]);

  useEffect(() => {
    if (typeof window !== "undefined" && !loading) window.sessionStorage.setItem(foldersCacheKey, JSON.stringify(folders));
  }, [foldersCacheKey, folders, loading]);

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      if (!supabase) return;
      const memberships = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId);
      if (memberships.error) { if (active) notify("Não foi possível carregar seu workspace"); setLoading(false); return; }

      let currentWorkspaceId = memberships.data?.[0]?.workspace_id as string | undefined;
      if (!currentWorkspaceId) {
        const ownWorkspace = await supabase.from("workspaces").select("id").eq("created_by", userId).limit(1).maybeSingle();
        currentWorkspaceId = ownWorkspace.data?.id as string | undefined;
      }
      if (!currentWorkspaceId) {
        const slug = `workspace-${userId.slice(0, 8)}`;
        const newWorkspaceId = crypto.randomUUID();
        const created = await supabase.from("workspaces").insert({ id: newWorkspaceId, name: "Meu workspace", slug, created_by: userId });
        if (created.error) { if (active) notify("Não foi possível criar seu workspace"); setLoading(false); return; }
        currentWorkspaceId = newWorkspaceId;
      }
      const hasMembership = memberships.data?.some((membership) => membership.workspace_id === currentWorkspaceId);
      if (!hasMembership) {
        const membership = await supabase.from("workspace_members").insert({ workspace_id: currentWorkspaceId, user_id: userId, role: "owner" });
        if (membership.error) { if (active) notify("Não foi possível configurar seu workspace"); setLoading(false); return; }
      }

      const [loaded, loadedFolders] = await Promise.all([
        supabase.from("funnels").select("id, name, slug, status, folder_id").eq("workspace_id", currentWorkspaceId).order("created_at", { ascending: false }),
        supabase.from("folders").select("id, name").eq("workspace_id", currentWorkspaceId).order("created_at", { ascending: false }),
      ]);
      if (active) {
        setWorkspaceId(currentWorkspaceId);
        setFunnels((loaded.data ?? []).map((funnel) => ({ ...funnel, leads: 0 })));
        setFolders(loadedFolders.data ?? []);
        setLoading(false);
      }
    }
    void loadWorkspace();
    return () => { active = false; };
  }, [supabase, userId, notify]);

  async function createFunnel(name: string) {
    if (!supabase || !workspaceId || creating) return;
    setCreating(true);
    const suffix = crypto.randomUUID().slice(0, 8);
    const normalizedName = name.trim();
    let created;
    try { created = await withTimeout(supabase.from("funnels").insert({ workspace_id: workspaceId, name: normalizedName, slug: `${normalizedName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "novo-funil"}-${suffix}`, folder_id: selectedFolder?.id ?? null, status: "draft" }).select("id, name, slug, status, folder_id").single(), 12000); } catch { notify("A criação demorou mais que o esperado"); setCreating(false); return; }
    if (created.error || !created.data) { notify("Não foi possível criar o funil"); setCreating(false); return; }
    const stepRows = blankSteps.map((step, position) => ({ funnel_id: created.data.id, position, title: step.title, step_type: step.kind === "INTRO" ? "intro" : step.kind === "RESULTADO" ? "result" : "question" }));
    let insertedSteps;
    try { insertedSteps = await withTimeout(supabase.from("funnel_steps").insert(stepRows), 12000); } catch { notify("A criação dos passos demorou mais que o esperado"); setCreating(false); return; }
    if (insertedSteps.error) { notify("Funil criado, mas houve erro ao criar os passos"); setCreating(false); return; }
    setFunnels((current) => [{ ...created.data, folder_id: selectedFolder?.id ?? null, leads: 0 }, ...current]);
    setCreating(false);
    setShowCreateModal(false);
    openEditor("blank", created.data.id);
  }

  async function createFolder(name: string) {
    if (!supabase || !workspaceId || creatingFolder) return;
    setCreatingFolder(true);
    const result = await withTimeout(supabase.from("folders").insert({ workspace_id: workspaceId, name: name.trim() }).select("id, name").single(), 12000).catch(() => null);
    if (!result || result.error || !result.data) {
      notify(result ? "Não foi possível criar a pasta" : "A criação da pasta demorou mais que o esperado");
      setCreatingFolder(false);
      return;
    }
    setFolders((current) => [result.data, ...current]);
    setCreatingFolder(false);
    setShowFolderModal(false);
    notify("Pasta criada");
  }

  async function deleteFunnel() {
    if (!supabase || !workspaceId || !funnelToDelete || deleting) return;
    setDeleting(true);
    const result = await supabase.from("funnels").delete().eq("id", funnelToDelete.id).eq("workspace_id", workspaceId);
    if (result.error) {
      notify("Não foi possível excluir o funil");
    } else {
      setFunnels((current) => current.filter((funnel) => funnel.id !== funnelToDelete.id));
      notify("Funil excluído");
    }
    setDeleting(false);
    setFunnelToDelete(null);
  }

  async function deleteFolder() {
    if (!supabase || !workspaceId || !folderToDelete || deletingFolder) return;
    setDeletingFolder(true);
    const detached = await supabase.from("funnels").update({ folder_id: null }).eq("folder_id", folderToDelete.id).eq("workspace_id", workspaceId);
    const result = detached.error ? detached : await supabase.from("folders").delete().eq("id", folderToDelete.id).eq("workspace_id", workspaceId);
    if (result.error) {
      notify("Não foi possível excluir a pasta");
    } else {
      setFolders((current) => current.filter((folder) => folder.id !== folderToDelete.id));
      setFunnels((current) => current.map((funnel) => funnel.folder_id === folderToDelete.id ? { ...funnel, folder_id: null } : funnel));
      setSelectedFolder((current) => current?.id === folderToDelete.id ? null : current);
      notify("Pasta excluída");
    }
    setDeletingFolder(false);
    setFolderToDelete(null);
  }

  async function addFunnelToFolder(folderId: string) {
    if (!supabase || !workspaceId || !funnelToMove || movingFunnel) return;
    setMovingFunnel(true);
    const result = await supabase.from("funnels").update({ folder_id: folderId }).eq("id", funnelToMove.id).eq("workspace_id", workspaceId);
    if (result.error) notify("Não foi possível adicionar o funil à pasta");
    else { setFunnels((current) => current.map((funnel) => funnel.id === funnelToMove.id ? { ...funnel, folder_id: folderId } : funnel)); notify("Funil adicionado à pasta"); }
    setMovingFunnel(false);
    setFunnelToMove(null);
  }

  async function removeFunnelFromFolder(funnel: FunnelItem) {
    if (!supabase || !workspaceId || !funnel.folder_id) return;
    const result = await supabase.from("funnels").update({ folder_id: null }).eq("id", funnel.id).eq("workspace_id", workspaceId);
    if (result.error) notify("Não foi possível remover o funil da pasta");
    else { setFunnels((current) => current.map((item) => item.id === funnel.id ? { ...item, folder_id: null } : item)); notify("Funil removido da pasta"); }
  }

  async function renameFunnel(name: string) {
    if (!supabase || !workspaceId || !funnelToRename || renamingFunnel || !name.trim()) return;
    setRenamingFunnel(true);
    const result = await supabase.from("funnels").update({ name: name.trim() }).eq("id", funnelToRename.id).eq("workspace_id", workspaceId);
    if (result.error) notify("Não foi possível renomear o funil");
    else { setFunnels((current) => current.map((funnel) => funnel.id === funnelToRename.id ? { ...funnel, name: name.trim() } : funnel)); notify("Funil renomeado"); }
    setRenamingFunnel(false);
    setFunnelToRename(null);
  }

  async function duplicateFunnel(funnel: FunnelItem) {
    if (!supabase || !workspaceId || duplicating) return;
    setDuplicating(true);
    const suffix = crypto.randomUUID().slice(0, 8);
    const created = await supabase.from("funnels").insert({ workspace_id: workspaceId, name: `${funnel.name} (cópia)`, slug: `${funnel.slug}-copia-${suffix}`, status: "draft" }).select("id, name, slug, status").single();
    if (created.error || !created.data) { notify("Não foi possível duplicar o funil"); setDuplicating(false); return; }
    const sourceSteps = await supabase.from("funnel_steps").select("position, title, step_type, settings").eq("funnel_id", funnel.id).order("position");
    if (sourceSteps.error) { notify("Funil duplicado, mas não foi possível copiar os passos"); } else if (sourceSteps.data?.length) {
      const copiedSteps = await supabase.from("funnel_steps").insert(sourceSteps.data.map((step) => ({ ...step, funnel_id: created.data.id })));
      if (copiedSteps.error) notify("Funil duplicado, mas não foi possível copiar os passos");
    }
    setFunnels((current) => [{ ...created.data, folder_id: null, leads: 0 }, ...current]);
    setOpenMenuId(null);
    setDuplicating(false);
    notify("Funil duplicado");
  }

  return <><div className="dashboard-page"><div className="content-card dashboard-card" onClick={() => setOpenMenuId(null)}><div className="filter-tabs"><button className={activeTab === "Todos" ? "active" : ""} onClick={() => { setActiveTab("Todos"); setSelectedFolder(null); }}>Todos</button><button className={activeTab === "Pastas" ? "active" : ""} onClick={() => { setActiveTab("Pastas"); setSelectedFolder(null); }}>Pastas</button><button className={activeTab === "Funis" ? "active" : ""} onClick={() => { setActiveTab("Funis"); setSelectedFolder(null); }}>Funis</button></div><div className="dashboard-actions"><button className="outline-btn" onClick={() => setShowFolderModal(true)} disabled={creatingFolder}>＋ Nova Pasta</button><button className="primary-btn" onClick={() => setShowCreateModal(true)} disabled={creating || loading}>＋ Novo Funil</button></div>{folders.length > 0 && <div className="folder-list"><span>Pastas</span>{folders.map((folder) => <button key={folder.id} onClick={() => notify("Pasta: " + folder.name)}><ActionIcon type="folder" /> {folder.name}</button>)}</div>}{loading ? <div className="dashboard-empty">Carregando seus funis...</div> : activeTab === "Pastas" && !selectedFolder ? folders.length === 0 ? <div className="dashboard-empty">Você ainda não tem pastas.</div> : <div className="folder-grid">{folders.map((folder) => <button className="folder-card" key={folder.id} onClick={() => setSelectedFolder(folder)}><span className="folder-card-icon"><ActionIcon type="folder" /></span><strong>{folder.name}</strong><span>{funnels.filter((funnel) => funnel.folder_id === folder.id).length} Funis</span><b role="button" tabIndex={0} aria-label="Excluir pasta" onClick={(event) => { event.stopPropagation(); setFolderToDelete(folder); }}>•••</b></button>)}</div> : selectedFolder ? <div className="folder-detail"><button className="back-folder" onClick={() => setSelectedFolder(null)}>‹ Voltar</button><h2><ActionIcon type="folder" /> {selectedFolder.name}</h2>{funnels.filter((funnel) => funnel.folder_id === selectedFolder.id).length === 0 ? <div className="dashboard-empty">Esta pasta ainda não tem funis.</div> : funnels.filter((funnel) => funnel.folder_id === selectedFolder.id).map((funnel) => <div className="funnel-card" key={funnel.id}><button className="funnel-open" onClick={() => openEditor("blank", funnel.id)}><span><span className="funnel-icon">◉</span><strong>{funnel.name}</strong></span><p><b>{funnel.leads}</b> Leads</p></button><button className="funnel-more" aria-label={`Ações de ${funnel.name}`} onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === funnel.id ? null : funnel.id); }}>•••</button>{openMenuId === funnel.id && <FunnelMenu funnel={funnel} duplicating={duplicating} onEdit={() => { setOpenMenuId(null); openEditor("blank", funnel.id); }} onDuplicate={() => duplicateFunnel(funnel)} onAddToFolder={() => { setOpenMenuId(null); setFunnelToMove(funnel); }} onRemoveFromFolder={() => { setOpenMenuId(null); removeFunnelFromFolder(funnel); }} onRename={() => { setOpenMenuId(null); setFunnelToRename(funnel); }} onDelete={() => { setOpenMenuId(null); setFunnelToDelete({ id: funnel.id, name: funnel.name }); }} notify={notify} />}</div>)} </div> : funnels.length === 0 ? <div className="dashboard-empty">Você ainda não tem funis. Crie seu primeiro funil.</div> : funnels.map((funnel) => <FunnelCard key={funnel.id} funnel={funnel} openEditor={openEditor} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} duplicateFunnel={duplicateFunnel} duplicating={duplicating} setFunnelToDelete={setFunnelToDelete} setFunnelToMove={setFunnelToMove} removeFunnelFromFolder={removeFunnelFromFolder} setFunnelToRename={setFunnelToRename} notify={notify} />)}</div></div>{showCreateModal && <CreateFunnelModal busy={creating} onCancel={() => !creating && setShowCreateModal(false)} onCreate={createFunnel} />}{showFolderModal && <CreateFolderModal busy={creatingFolder} onCancel={() => !creatingFolder && setShowFolderModal(false)} onCreate={createFolder} />}{funnelToRename && <RenameFunnelModal funnel={funnelToRename} busy={renamingFunnel} onCancel={() => !renamingFunnel && setFunnelToRename(null)} onRename={renameFunnel} />}{funnelToMove && <AddToFolderModal folders={folders} busy={movingFunnel} onCancel={() => !movingFunnel && setFunnelToMove(null)} onAdd={addFunnelToFolder} />}{funnelToDelete && <ConfirmModal title="Excluir funil?" description={`Tem certeza que deseja excluir “${funnelToDelete.name}”? Esta ação não pode ser desfeita.`} confirmLabel={deleting ? "Excluindo..." : "Excluir funil"} onCancel={() => !deleting && setFunnelToDelete(null)} onConfirm={deleteFunnel} />}{folderToDelete && <ConfirmModal title="Excluir pasta?" description={`Tem certeza que deseja excluir a pasta “${folderToDelete.name}”? Os funis serão mantidos, mas ficarão sem pasta.`} confirmLabel={deletingFolder ? "Excluindo..." : "Excluir pasta"} onCancel={() => !deletingFolder && setFolderToDelete(null)} onConfirm={deleteFolder} />}</>;
}

function ActionIcon({ type }: { type: "folder" | "rename" | "duplicate" | "edit" | "share" | "link" | "preview" | "delete" }) {
  const iconPaths = { folder: <><path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path d="M2 9h19" /></>, rename: <><path d="m4 17 2-.5L18 4.5a1.7 1.7 0 0 0-2.4-2.4L3.6 14.1 3 17Z" /><path d="m14.5 3.5 2 2" /></>, duplicate: <><rect x="7" y="7" width="12" height="12" rx="2" /><path d="M4 15H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" /></>, edit: <><path d="m4 17 2-.5L18 4.5a1.7 1.7 0 0 0-2.4-2.4L3.6 14.1 3 17Z" /><path d="m14.5 3.5 2 2" /></>, share: <><path d="M14 3h7v7" /><path d="M21 3 11 13" /><path d="M19 13v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></>, link: <><path d="M9 15 15 9" /><path d="M7 17H5a4 4 0 0 1 0-8h3M17 7h2a4 4 0 0 1 0 8h-3" /></>, preview: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>, delete: <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7" /></> } as const;
  return <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[type]}</svg>;
}

function FunnelMenu({ funnel, duplicating, onEdit, onDuplicate, onAddToFolder, onRemoveFromFolder, onRename, onDelete, notify }: { funnel: { slug: string; folder_id: string | null }; duplicating: boolean; onEdit: () => void; onDuplicate: () => void; onAddToFolder: () => void; onRemoveFromFolder: () => void; onRename: () => void; onDelete: () => void; notify: (message: string) => void }) {
  return <div className="funnel-menu" onClick={(event) => event.stopPropagation()}>{funnel.folder_id ? <button className="menu-item" onClick={onRemoveFromFolder}><ActionIcon type="folder" /><span>Remover da pasta</span></button> : <button className="menu-item" onClick={onAddToFolder}><ActionIcon type="folder" /><span>Adicionar a uma pasta</span></button>}<button className="menu-item" onClick={onRename}><ActionIcon type="rename" /><span>Renomear</span></button><button className="menu-item" onClick={onDuplicate} disabled={duplicating}><ActionIcon type="duplicate" /><span>Duplicar</span></button><div className="menu-divider" /><button className="menu-item" onClick={onEdit}><ActionIcon type="edit" /><span>Editar</span></button><button className="menu-item" onClick={() => notify("Compartilhar em breve")}><ActionIcon type="share" /><span>Compartilhar</span></button><button className="menu-item" onClick={() => { navigator.clipboard?.writeText(`${getPublicBaseUrl()}/quiz/${funnel.slug}`); notify("Link copiado"); }}><ActionIcon type="link" /><span>Copiar Link</span></button><button className="menu-item" onClick={() => window.open(`${getPublicBaseUrl()}/quiz/${funnel.slug}`, "_blank")}><ActionIcon type="preview" /><span>Preview</span></button><div className="menu-divider" /><button className="menu-item delete-action" onClick={onDelete}><ActionIcon type="delete" /><span>Excluir</span></button></div>;
}

function CreateFunnelModal({ busy, onCancel, onCreate }: { busy: boolean; onCancel: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (name.trim()) onCreate(name); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-funnel-title"><button className="modal-close" aria-label="Fechar" onClick={onCancel}>×</button><h2 id="create-funnel-title">Criar novo funil</h2><p>Configure seu funil de conversão e organize em uma pasta</p><form onSubmit={submit}><label>Nome do funil<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Landing Page Produto X" /></label><small>Escolha um nome descritivo para seu funil</small><div className="confirm-actions"><button type="button" className="outline-btn" onClick={onCancel}>Cancelar</button><button type="submit" className="primary-btn" disabled={busy || !name.trim()}>{busy ? "Criando..." : "Criar funil"}</button></div></form></section></div>;
}

function RenameFunnelModal({ funnel, busy, onCancel, onRename }: { funnel: FunnelItem; busy: boolean; onCancel: () => void; onRename: (name: string) => void }) {
  const [name, setName] = useState(funnel.name);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (name.trim()) onRename(name); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="rename-funnel-title"><button className="modal-close" aria-label="Fechar" onClick={onCancel}>×</button><h2 id="rename-funnel-title">Renomear funil</h2><p>Atualize o nome que será exibido no seu dashboard.</p><form onSubmit={submit}><label>Nome do funil<input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><div className="confirm-actions"><button type="button" className="outline-btn" onClick={onCancel}>Cancelar</button><button type="submit" className="primary-btn" disabled={busy || !name.trim()}>{busy ? "Salvando..." : "Salvar"}</button></div></form></section></div>;
}

function AddToFolderModal({ folders, busy, onCancel, onAdd }: { folders: FolderItem[]; busy: boolean; onCancel: () => void; onAdd: (folderId: string) => void }) {
  const [folderId, setFolderId] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (folderId) onAdd(folderId); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="add-folder-title"><button className="modal-close" aria-label="Fechar" onClick={onCancel}>×</button><h2 id="add-folder-title">Adicionar a uma pasta</h2><p>Selecione uma pasta para organizar este item.</p><form onSubmit={submit}><label>Selecionar pasta<select value={folderId} onChange={(event) => setFolderId(event.target.value)}><option value="">Escolha uma pasta</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>{folders.length === 0 && <small>Nenhuma pasta disponível. Crie uma pasta primeiro.</small>}<div className="confirm-actions"><button type="button" className="outline-btn" onClick={onCancel}>Cancelar</button><button type="submit" className="primary-btn" disabled={busy || !folderId}>{busy ? "Adicionando..." : "Adicionar"}</button></div></form></section></div>;
}

function CreateFolderModal({ busy, onCancel, onCreate }: { busy: boolean; onCancel: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (name.trim()) onCreate(name); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-folder-title"><button className="modal-close" aria-label="Fechar" onClick={onCancel}>×</button><h2 id="create-folder-title">Criar nova pasta</h2><p>Organize seus funis em pastas para encontrar tudo com facilidade.</p><form onSubmit={submit}><label>Nome da pasta<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Campanhas de Novembro" /></label><small>Escolha um nome descritivo para sua pasta</small><div className="confirm-actions"><button type="button" className="outline-btn" onClick={onCancel}>Cancelar</button><button type="submit" className="primary-btn" disabled={busy || !name.trim()}>{busy ? "Criando..." : "Criar pasta"}</button></div></form></section></div>;
}

function ConfirmModal({ title, description, confirmLabel, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title"><div className="confirm-icon">!</div><h2 id="confirm-modal-title">{title}</h2><p>{description}</p><div className="confirm-actions"><button className="outline-btn" onClick={onCancel}>Cancelar</button><button className="danger-btn" onClick={onConfirm}>{confirmLabel}</button></div></section></div>;
}

function RenameStepModal({ step, busy, onCancel, onRename }: { step: { title: string }; busy: boolean; onCancel: () => void; onRename: (name: string) => void }) {
  const [name, setName] = useState(step.title);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (name.trim()) onRename(name); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="rename-step-title"><button className="modal-close" aria-label="Fechar" onClick={onCancel}>×</button><h2 id="rename-step-title">Renomear etapa</h2><p>Defina o nome que aparecerá na lista de etapas.</p><form onSubmit={submit}><label>Nome da etapa<input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><div className="confirm-actions"><button type="button" className="outline-btn" onClick={onCancel}>Cancelar</button><button type="submit" className="primary-btn" disabled={busy || !name.trim()}>{busy ? "Salvando..." : "Salvar"}</button></div></form></section></div>;
}

function SecondaryView({ editorView, screen, notify, funnelId, supabase }: { editorView: EditorView; screen: Screen; notify: (message: string) => void; funnelId: string | null; supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>> | null }) {
  if (screen === "Analytics") return <Analytics notify={notify} />;
  if (editorView === "Integrar") return <MetaPixelIntegration notify={notify} funnelId={funnelId} supabase={supabase} />;
  if (editorView === "Fluxo") return <FlowView funnelId={funnelId} supabase={supabase} />;
  if (editorView === "Resultados") return <Results notify={notify} />;
  if (editorView === "Compartilhar") return funnelId ? <DomainShareView notify={notify} funnelId={funnelId} supabase={supabase} /> : <ShareView notify={notify} />;
  return <Settings notify={notify} supabase={supabase} funnelId={funnelId} />;
}

function BlockIcon({ item }: { item: string }) {
  const icons: Record<string, React.ReactNode> = {
    Texto: <><path d="M5 5h14M12 5v14M8 19h8" /></>,
    Argumentos: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h5M8 16h8" /></>,
    Alerta: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
    FAQ: <><path d="M5 6h14M5 11h14M5 16h9" /><path d="m18 15 2 2-2 2" /></>,
    Imagem: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4.5 17 4.5-4.5 3.5 3 2.5-2.5 4.5 4" /></>,
    Vídeo: <><rect x="3.5" y="5" width="12.5" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3Z" /></>,
    Carrossel: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 7h8M8 17h8M3 8v8M21 8v8" /></>,
    Depoimentos: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="10" r="2.2" /><path d="M8.5 17c.7-2.1 2-3.2 3.5-3.2s2.8 1.1 3.5 3.2" /></>,
    "Antes/Depois": <><rect x="4" y="5" width="7" height="14" rx="1.5" /><rect x="13" y="5" width="7" height="14" rx="1.5" /><path d="M12 4v16" /></>,
    "Áudio": <><path d="M5 9v6h3l5 4V5L8 9H5Z" /><path d="M17 9a4 4 0 0 1 0 6M19 7a7 7 0 0 1 0 10" /></>,
    Botão: <rect x="4" y="6" width="16" height="12" rx="2" />,
    Opções: <><path d="M5 6h14M5 12h14M5 18h14" /><circle cx="9" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /></>,
    Espaço: <><path d="M5 5v14M19 5v14M8 8l-3-3-3 3M16 16l3 3 3-3" /></>,
    Loading: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
    Timer: <><circle cx="12" cy="13" r="7.5" /><path d="M12 13V9M12 13l3 2M9 3h6M12 3v2" /></>,
    Delay: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2M16 4l3 1-1 3" /></>,
    Notificação: <><path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Z" /><path d="M10 20h4" /></>,
    Script: <><path d="m9 7-4 5 4 5M15 7l4 5-4 5M13 5l-2 14" /></>,
    Formulário: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 7h6M9 11h6M9 15h3M8 7h.01M8 11h.01M8 15h.01" /></>,
    "Área de Texto": <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M7 9h10M7 12h10M7 15h6" /></>,
    Nível: <><path d="M5 6h14M5 12h14M5 18h14" /><path d="M9 4v4M15 10v4M11 16v4" /></>,
    Peso: <><path d="M8 7h8l2 13H6L8 7Z" /><path d="M9 7a3 3 0 0 1 6 0M12 11v3M10.5 12.5h3" /></>,
    Altura: <><path d="m8 4 3-1 8 8-9 9-6-6 9-9" /><path d="m10 6 2 2M8 8l2 2M13 9l2 2M11 11l2 2M15 13l2 2" /></>,
    IMC: <><circle cx="10" cy="9" r="3" /><path d="M4.5 20c.8-3.7 2.7-5.5 5.5-5.5M15 7h5M15 11h5M15 15h5" /></>,
    Idade: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14c.9 1.3 2 2 3.5 2s2.6-.7 3.5-2M9 9h.01M15 9h.01" /></>,
    Tendência: <><path d="M4 17V7M4 17h16" /><path d="m7 14 3-3 3 2 5-6" /><path d="M15 7h3v3" /></>,
    Evolutivo: <><path d="M4 18V6M4 18h16" /><path d="M6 15c3-1 2-6 5-6s2 5 7 1" /></>,
    Gamificação: <><path d="M8 8h8l3 3v6a2 2 0 0 1-3 1l-3-2h-2l-3 2a2 2 0 0 1-3-1v-6l3-3Z" /><path d="M8 12v4M6 14h4M16 13h.01M18 15h.01" /></>,
    "Mapa Corporal": <><circle cx="12" cy="5.5" r="2.5" /><path d="M8.5 20v-5l-2-4 2.5-2.5L12 11l3-2.5 2.5 2.5-2 4v5M9 15h6" /></>,
    Planos: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 9h16M8 13h3M8 16h5" /><path d="M8 5V3M16 5V3" /></>,
  };
  const icon = icons[item] ?? <circle cx="12" cy="12" r="8" />;
  return <svg className="block-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>;
}

function LockIcon() {
  return <svg className="component-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function EditorActionIcon({ type }: { type: "edit" | "move" | "duplicate" | "delete" }) {
  const paths = {
    edit: <><path d="m4 17 2-.5L18 4.5a1.7 1.7 0 0 0-2.4-2.4L3.6 14.1 3 17Z" /><path d="m14.5 3.5 2 2" /></>,
    move: <><path d="M12 3v18M9 6l3-3 3 3M9 18l3 3 3-3" /><path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3" /></>,
    duplicate: <><rect x="7" y="7" width="12" height="12" rx="2" /><path d="M4 15H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>,
  };
  return <svg className="editor-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function EditorCanvas({ supabase, funnelId, notify, stepsData, onBack }: { supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>> | null; funnelId: string | null; notify: (message: string) => void; stepsData: Step[]; onBack: () => void }) {
  const [cachedDocument] = useState(() => funnelId ? readEditorDocumentCache(funnelId) : null);
  const selectionKey = funnelId ? `izquiz:editor-selection:${funnelId}` : "izquiz:editor-selection:local";
  const [savedSelection] = useState(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(window.localStorage.getItem(selectionKey) ?? "null") as { stepIndex?: number; blockId?: number | null } | null; } catch { return null; }
  });
  const [selected, setSelected] = useState(savedSelection?.stepIndex ?? 0);
  const [editableSteps, setEditableSteps] = useState<Step[]>(cachedDocument?.steps ?? (funnelId ? [] : stepsData));
  const [stepToDelete, setStepToDelete] = useState<{ index: number; title: string } | null>(null);
  const [deletingStep, setDeletingStep] = useState(false);
  const [stepToRename, setStepToRename] = useState<{ index: number; title: string } | null>(null);
  const [renamingStep, setRenamingStep] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [blocksByStep, setBlocksByStep] = useState<Record<string, CanvasBlock[]>>(cachedDocument?.blocksByStep ?? {});
  const persistQueue = useRef<Promise<void>>(Promise.resolve());
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(savedSelection?.blockId ?? null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [movingBlockId, setMovingBlockId] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ targetId: number; position: "before" | "after" } | null>(null);
  const [blocksLoaded, setBlocksLoaded] = useState(Boolean(cachedDocument));
  const nextBlockId = useRef(1);
  const funnelStepCount = editableSteps.filter((step) => !step.break).length;
  const currentFunnelStep = editableSteps.slice(0, selected + 1).filter((step) => !step.break).length;
  const funnelProgress = funnelStepCount ? Math.round((currentFunnelStep / funnelStepCount) * 100) : 0;

  useEffect(() => {
    const client = supabase;
    if (!client || !funnelId) return;
    let active = true;
    async function loadSteps() {
      const db = client;
      if (!db) return;
      const result = await db.from("funnel_steps").select("id, title, step_type, position").eq("funnel_id", funnelId).order("position");
      if (!active || result.error || !result.data) return;
      const loadedSteps = result.data.map((step) => ({
        id: step.id,
        title: step.title,
        kind: step.step_type === "intro" ? "INTRO" : step.step_type === "result" ? "RESULTADO" : "PERGUNTA",
        active: false,
      }));
      const stepIds = loadedSteps.map((step) => step.id);
      const blockResult = stepIds.length ? await db.from("step_blocks").select("step_id, position, block_type, content").in("step_id", stepIds).order("position") : { data: [], error: null };
      if (!active) return;
      setEditableSteps(loadedSteps);
      const remoteDocument = groupBlocksByStep(stepIds, blockResult.data ?? []);
      const document = Object.fromEntries(stepIds.map((stepId) => [stepId, remoteDocument[stepId]?.length ? remoteDocument[stepId] : cachedDocument?.blocksByStep[stepId] ?? []])) as Record<string, CanvasBlock[]>;
      setBlocksByStep(document);
      nextBlockId.current = Math.max(1, ...Object.values(document).flat().map((block) => block.id + 1));
      setBlocksLoaded(true);
    }
    void loadSteps();
    return () => { active = false; };
  }, [supabase, funnelId, cachedDocument]);

  useEffect(() => {
    if (!funnelId || editableSteps.length === 0) return;
    writeEditorDocumentCache(funnelId, { steps: editableSteps, blocksByStep });
  }, [funnelId, editableSteps, blocksByStep]);
  useEffect(() => {
    window.localStorage.setItem(selectionKey, JSON.stringify({ stepIndex: selected, blockId: selectedBlockId }));
  }, [selected, selectedBlockId, selectionKey]);
  const activeStepId = editableSteps[selected]?.id ?? null;
  const blocks = useMemo(() => activeStepId ? blocksByStep[activeStepId] ?? [] : [], [activeStepId, blocksByStep]);
  const setBlocks = useCallback((update: SetStateAction<CanvasBlock[]>) => {
    if (!activeStepId) return;
    setBlocksByStep((current) => {
      const currentBlocks = current[activeStepId] ?? [];
      const nextBlocks = typeof update === "function" ? update(currentBlocks) : update;
      return { ...current, [activeStepId]: nextBlocks };
    });
  }, [activeStepId]);
  const blocksCacheKey = activeStepId ? "izquiz:blocks:" + activeStepId : null;

  function addBlock(item: string, insertAt?: number) {
    const block = { id: nextBlockId.current++, item, content: item === "Texto" ? "Texto de exemplo" : item === "Alerta" ? "Atenção!" : item };
    setBlocks((current) => {
      if (insertAt === undefined || insertAt < 0 || insertAt > current.length) return [...current, block];
      const next = [...current];
      next.splice(insertAt, 0, block);
      return next;
    });
    setSelectedBlockId(block.id);
    notify(item + " adicionado ao passo");
  }

  function dropComponent(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverCanvas(false);
    const item = event.dataTransfer.getData("text/plain") || draggedItem;
    const insertAt = dropIndicator ? blocks.findIndex((block) => block.id === dropIndicator.targetId) + (dropIndicator.position === "after" ? 1 : 0) : undefined;
    if (item) addBlock(item, insertAt);
    setDropIndicator(null);
    setDraggedItem(null);
  }

  function updateDropIndicator(event: React.DragEvent<HTMLDivElement>, targetId: number) {
    const isSupported = event.dataTransfer.types.includes("application/x-izquiz-block") || event.dataTransfer.types.includes("text/plain");
    if (!isSupported) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setDropIndicator({ targetId, position: event.clientY < rect.top + rect.height / 2 ? "before" : "after" });
    setDragOverCanvas(true);
  }

  function dropOnBlock(event: React.DragEvent<HTMLDivElement>, targetId: number) {
    const movingBlock = event.dataTransfer.types.includes("application/x-izquiz-block");
    if (movingBlock) {
      event.preventDefault();
      event.stopPropagation();
      const sourceId = Number(event.dataTransfer.getData("application/x-izquiz-block"));
      const sourceIndex = blocks.findIndex((block) => block.id === sourceId);
      const targetIndex = blocks.findIndex((block) => block.id === targetId);
      if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== targetIndex) {
        const insertAt = targetIndex + (dropIndicator?.position === "after" ? 1 : 0);
        setBlocks((current) => {
          const next = [...current];
          const [moved] = next.splice(sourceIndex, 1);
          const adjustedIndex = sourceIndex < insertAt ? insertAt - 1 : insertAt;
          next.splice(Math.max(0, Math.min(adjustedIndex, next.length)), 0, moved);
          return next;
        });
      }
      setDropIndicator(null);
      setMovingBlockId(null);
      return;
    }
    dropComponent(event);
  }

  function updateBlockContent(content: string) {
    if (selectedBlockId === null) return;
    setBlocks((current) => current.map((block) => block.id === selectedBlockId ? { ...block, content } : block));
  }

  function updateBlockStyle(patch: Partial<CanvasBlock>) {
    if (selectedBlockId === null) return;
    setBlocks((current) => current.map((block) => block.id === selectedBlockId ? { ...block, ...patch } : block));
  }
  const onTextStyleChange = updateBlockStyle;

  function removeSelectedBlock() {
    if (selectedBlockId === null) return;
    setBlocks((current) => current.filter((block) => block.id !== selectedBlockId));
    setSelectedBlockId(null);
    setEditingBlockId(null);
  }

  function duplicateSelectedBlock() {
    const block = blocks.find((item) => item.id === selectedBlockId);
    if (!block) return;
    const copy = { ...block, id: nextBlockId.current++ };
    setBlocks((current) => [...current, copy]);
    setSelectedBlockId(copy.id);
    notify("Elemento duplicado");
  }

  async function deleteStep() {
    if (!stepToDelete || editableSteps.length <= 1) return;
    setDeletingStep(true);
    if (supabase && funnelId) {
      const loadedSteps = await supabase.from("funnel_steps").select("id, position").eq("funnel_id", funnelId).order("position");
      const target = loadedSteps.data?.[stepToDelete.index];
      if (loadedSteps.error || !target) {
        notify("Não foi possível localizar esta etapa");
        setDeletingStep(false);
        return;
      }
      const removed = await supabase.from("funnel_steps").delete().eq("id", target.id);
      if (removed.error) {
        notify("Não foi possível excluir esta etapa");
        setDeletingStep(false);
        return;
      }
      const remaining = loadedSteps.data.filter((step) => step.id !== target.id);
      await Promise.all(remaining.map((step, position) => supabase.from("funnel_steps").update({ position }).eq("id", step.id)));
    }
    const nextSteps = editableSteps.filter((_, index) => index !== stepToDelete.index);
    setEditableSteps(nextSteps);
    setSelected((current) => Math.min(current, nextSteps.length - 1));
    setSelectedBlockId(null);
    setEditingBlockId(null);
    setStepToDelete(null);
    setDeletingStep(false);
    notify("Etapa excluída");
  }

  async function addStep() {
    const title = `Pergunta ${editableSteps.filter((step) => step.kind === "PERGUNTA").length + 1}`;
    let createdStep: Step = { title, kind: "PERGUNTA" };
    if (supabase && funnelId) {
      const result = await supabase.from("funnel_steps").insert({ funnel_id: funnelId, position: editableSteps.length, title, step_type: "question" }).select("id, title, step_type").single();
      if (result.error || !result.data) {
        notify("Não foi possível adicionar a etapa");
        return;
      }
      createdStep = { id: result.data.id, title: result.data.title, kind: "PERGUNTA" };
    }
    setEditableSteps((current) => [...current, createdStep]);
    setSelected(editableSteps.length);
    setSelectedBlockId(null);
    setEditingBlockId(null);
    notify("Nova etapa adicionada");
  }

  async function renameStep(name: string) {
    if (!stepToRename || !name.trim()) return;
    setRenamingStep(true);
    const step = editableSteps[stepToRename.index];
    if (supabase && step?.id) {
      const result = await supabase.from("funnel_steps").update({ title: name.trim() }).eq("id", step.id);
      if (result.error) { notify("Não foi possível renomear a etapa"); setRenamingStep(false); return; }
    }
    setEditableSteps((current) => current.map((item, index) => index === stepToRename.index ? { ...item, title: name.trim() } : item));
    setStepToRename(null);
    setRenamingStep(false);
    notify("Etapa renomeada");
  }

  async function duplicateStep(index: number) {
    const source = editableSteps[index];
    if (!source) return;
    const title = `${source.title} (cópia)`;
    let copy: Step = { title, kind: source.kind };
    const sourceBlocks = source.id ? (blocksByStep[source.id] ?? []) : [];
    if (supabase && funnelId) {
      const created = await supabase.from("funnel_steps").insert({ funnel_id: funnelId, position: editableSteps.length, title, step_type: source.kind === "INTRO" ? "intro" : source.kind === "RESULTADO" ? "result" : "question" }).select("id, title, step_type").single();
      if (created.error || !created.data) { notify("Não foi possível duplicar a etapa"); return; }
      copy = { id: created.data.id, title: created.data.title, kind: source.kind };
      if (sourceBlocks.length) {
        await supabase.from("step_blocks").insert(sourceBlocks.map((block, position) => { const settings = Object.fromEntries(Object.entries(block).filter(([key]) => key !== "id" && key !== "item" && key !== "content")); return { step_id: copy.id, position, block_type: block.item, content: { content: block.content, ...settings } }; }));
      }
    }
    const copiedBlocks = sourceBlocks.map((block) => ({ ...block, id: nextBlockId.current++ }));
    setEditableSteps((current) => [...current, copy]);
    if (copy.id) setBlocksByStep((current) => ({ ...current, [copy.id as string]: copiedBlocks }));
    setSelected(editableSteps.length);
    setSelectedBlockId(null);
    setEditingBlockId(null);
    notify("Etapa duplicada");
  }

  async function moveStep(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editableSteps.length) return;
    const nextSteps = [...editableSteps]; [nextSteps[index], nextSteps[targetIndex]] = [nextSteps[targetIndex], nextSteps[index]];
    setEditableSteps(nextSteps); setSelected(targetIndex); setSelectedBlockId(null); setEditingBlockId(null);
    if (supabase && funnelId) {
      const updates = nextSteps.filter((step) => step.id).map((step, position) => supabase.from("funnel_steps").update({ position }).eq("id", step.id as string));
      const results = await Promise.all(updates);
      if (results.some((result) => result.error)) { notify("A ordem foi alterada localmente, mas não foi possível salvar no servidor"); return; }
    }
    notify(direction === "up" ? "Etapa movida para cima" : "Etapa movida para baixo");
  }

  async function reorderSteps(fromIndex: number, targetIndex: number) {
    if (fromIndex < 0 || targetIndex < 0 || fromIndex >= editableSteps.length || targetIndex >= editableSteps.length || fromIndex === targetIndex) return;
    const nextSteps = [...editableSteps];
    const [movedStep] = nextSteps.splice(fromIndex, 1);
    if (!movedStep) return;
    nextSteps.splice(targetIndex, 0, movedStep);
    setEditableSteps(nextSteps);
    setSelected(targetIndex);
    setSelectedBlockId(null);
    setEditingBlockId(null);
    if (supabase && funnelId) {
      const updates = nextSteps.filter((step) => step.id).map((step, position) => supabase.from("funnel_steps").update({ position }).eq("id", step.id as string));
      const results = await Promise.all(updates);
      if (results.some((result) => result.error)) { notify("A ordem foi alterada localmente, mas não foi possível salvar no servidor"); return; }
    }
    notify("Etapa reordenada");
  }

  function handleStepAction(action: "preview" | "rename" | "duplicate" | "save-model", index: number) {
    const step = editableSteps[index];
    if (!step) return;
    if (action === "preview") { window.open(`${window.location.origin}/quiz/${funnelId ?? "preview"}`, "_blank"); return; }
    if (action === "rename") { setStepToRename({ index, title: step.title }); return; }
    if (action === "duplicate") { void duplicateStep(index); return; }
    const template = { title: step.title, kind: step.kind, blocks: step.id ? blocksByStep[step.id] ?? [] : [] };
    window.localStorage.setItem("izquiz:step-template", JSON.stringify(template));
    notify("Modelo da etapa salvo");
  }

  function startMovingBlock(event: React.DragEvent<HTMLElement>, id: number) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-izquiz-block", String(id));
    setMovingBlockId(id);
  }

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;

  function renderBlock(block: CanvasBlock) {
    const extractedBlock = BlockRenderer({ block, isEditing: editingBlockId === block.id, onChange: updateBlockContent, onStopEditing: () => setEditingBlockId(null), onNotify: notify });
    if (extractedBlock) return extractedBlock;
    if (block.item === "Alerta") return <AlertBlock block={block} />;
    if (block.item === "Argumentos") return <ArgumentsBlock block={block} onNotify={notify} onBlockChange={updateBlockStyle} />;
    if (block.item === "Vídeo") {
      const embedSource = block.videoEmbed?.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
      return embedSource ? <div className="canvas-video"><iframe src={embedSource} title="Prévia do vídeo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div> : <div className="canvas-media-placeholder"><BlockIcon item="Vídeo" /><strong>Insira um código de incorporação de vídeo</strong></div>;
    }
    if (block.item === "Opções") return <OptionsBlock block={block} onNotify={notify} />;
    if (block.item === "FAQ") return <FaqBlock block={block} />;
    if (block.item === "Carrossel") return <CarouselBlock block={block} />;
    if (block.item === "Depoimentos") return <TestimonialsBlock block={block} />;
    if (block.item === "Antes/Depois") return <BeforeAfterBlock block={block} />;
    if (block.item === "Áudio") return <AudioBlock block={block} />;
    if (block.item === "Espaço") return <SpacerBlock block={block} />;
    if (block.item === "Loading") return <LoadingBlock block={block} />;
    if (block.item === "Timer") return <TimerBlock block={block} />;
    if (block.item === "Delay") return <DelayBlock block={block} />;
    if (block.item === "Notificação") return <NotificationBlock key={`notification-${block.id}-${block.notificationDuration ?? 5}`} block={block} />;
    if (block.item === "Script") return <ScriptBlock block={block} />;
    if (block.item === "Nível") return <LevelBlock block={block} />;
    if (block.item === "Peso") return <WeightBlock block={block} onChange={(patch) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, ...patch } : item))} />;
    if (block.item === "Altura") return <HeightBlock block={block} onChange={(patch) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, ...patch } : item))} />;
    if (block.item === "Tendência") return <TrendBlock block={block} />;
    if (block.item === "Evolutivo") return <EvolutionBlock block={block} />;
    if (["IMC", "Idade"].includes(block.item)) return <DataBlock block={block} />;
    if (block.item === "Gamificação") return <GamificationBlock block={block} />;
    if (block.item === "Mapa Corporal") return <BodyMapBlock block={block} />;
    if (block.item === "Planos") return <PlansBlock block={block} />;
    if (block.item === "Formulário") return <FormBlock block={block} onNotify={notify} />;
    if (block.item === "Área de Texto") return <TextareaBlock block={block} onNotify={notify} />;
    return <div className="canvas-generic-block"><BlockIcon item={block.item} /><strong>{block.content}</strong></div>;
  }

  useEffect(() => {
    let active = true;
    if (blocksLoaded || !supabase || !funnelId || !activeStepId) {
      return () => { active = false; };
    }
    async function loadBlocks() {
      const client = supabase;
      if (!client) return;
      const blockResult = await client.from("step_blocks").select("position, block_type, content").eq("step_id", activeStepId).order("position");
      if (!active) return;
      if (blockResult.error) {
        notify("Não foi possível carregar os componentes");
      } else {
        const loadedBlocks = (blockResult.data ?? []).map((row, index) => {
          const payload = (row.content ?? {}) as Record<string, unknown>;
          return { id: index + 1, item: row.block_type, content: typeof payload.content === "string" ? payload.content : row.block_type, ...payload } as CanvasBlock;
        });
        let cachedBlocks: CanvasBlock[] = [];
        if (blocksCacheKey) {
          try { cachedBlocks = JSON.parse(window.localStorage.getItem(blocksCacheKey) ?? "[]") as CanvasBlock[]; } catch { cachedBlocks = []; }
        }
        const sourceBlocks = loadedBlocks.length > 0 ? loadedBlocks : cachedBlocks;
        setBlocks((current) => loadedBlocks.length > 0 ? loadedBlocks : current.length > 0 ? current : sourceBlocks);
        nextBlockId.current = Math.max(nextBlockId.current, sourceBlocks.length + 1);
      }
      setBlocksLoaded(true);
    }
    void loadBlocks();
    return () => { active = false; };
  }, [supabase, funnelId, activeStepId, notify, blocksCacheKey, setBlocks, blocksLoaded]);

  const persistBlocks = useCallback((snapshot: CanvasBlock[] = blocks, stepId: string | null = activeStepId) => {
    if (!supabase || !funnelId || !stepId || !blocksLoaded) return Promise.resolve();
    const cacheKey = stepId === activeStepId ? blocksCacheKey : `izquiz:blocks:${stepId}`;
    if (cacheKey) window.localStorage.setItem(cacheKey, JSON.stringify(snapshot));
    const save = async () => {
      const deleted = await supabase.from("step_blocks").delete().eq("step_id", stepId);
      if (deleted.error) { notify(`Erro ao salvar componentes: ${deleted.error.message}`); return; }
      if (snapshot.length === 0) return;
      const rows = snapshot.map((block, position) => { const settings = Object.fromEntries(Object.entries(block).filter(([key]) => key !== "id" && key !== "item" && key !== "content")); return { step_id: stepId, position, block_type: block.item, content: { content: block.content, ...settings } }; });
      const inserted = await supabase.from("step_blocks").insert(rows);
      if (inserted.error) notify(`Erro ao salvar componentes: ${inserted.error.message}`);
    };
    persistQueue.current = persistQueue.current.then(save, save);
    return persistQueue.current;
  }, [blocks, activeStepId, blocksLoaded, blocksCacheKey, supabase, funnelId, notify]);

  useEffect(() => {
    if (!blocksLoaded || !supabase || !funnelId || !activeStepId) return;
    const saveTimer = window.setTimeout(() => { void persistBlocks(); }, 250);
    return () => { window.clearTimeout(saveTimer); };
  }, [blocks, blocksLoaded, supabase, funnelId, activeStepId, persistBlocks]);

  useEffect(() => {
    const publishHandler = () => {
      void persistBlocks().then(async () => {
        if (!supabase || !funnelId) { notify("Funil salvo localmente, mas não foi publicado no banco."); return; }
        const result = await supabase.from("funnels").update({ status: "published", published_at: new Date().toISOString() }).eq("id", funnelId);
        notify(result.error ? `Erro ao publicar o funil: ${result.error.message}` : "Funil publicado com sucesso!");
      });
    };
    window.addEventListener("izquiz:publish", publishHandler);
    return () => window.removeEventListener("izquiz:publish", publishHandler);
  }, [funnelId, notify, persistBlocks, supabase]);

  return <div className="editor-page">
    <div className="step-column">
      <button className="back-btn" aria-label="Voltar ao dashboard" onClick={onBack}>‹</button>
      {editableSteps.length === 0 ? <div className="step-list-skeleton" aria-label="Carregando etapas"><i /><i /><i /><i /><i /></div> : <StepList steps={editableSteps} selectedIndex={selected} onSelect={(index) => { setSelected(index); setSelectedBlockId(null); setEditingBlockId(null); }} onRequestDelete={(index, title) => setStepToDelete({ index, title })} onAction={handleStepAction} onMove={moveStep} onReorder={reorderSteps} onAdd={addStep} />}
    </div>
    <div className="component-column">
      <div className="component-search">⌕　Buscar componente...</div>
      {components.map((group) => <div className="component-group" key={group.group}><div className="group-title">{group.group}<span>⌃</span></div><div className="component-grid">{group.items.map((item) => { const locked = lockedComponents.has(item); return <button key={group.group + "-" + item} type="button" disabled={locked} draggable={!locked} onDragStart={(event) => { if (locked) return; event.dataTransfer.setData("text/plain", item); event.dataTransfer.effectAllowed = "copy"; setDraggedItem(item); }} onDragEnd={() => setDraggedItem(null)} onClick={() => { if (locked) { notify(`${item}: componente em desenvolvimento`); return; } addBlock(item); }} className={`${draggedItem === item ? "component-dragging" : ""} ${locked ? "component-locked" : ""}`}><BlockIcon item={item} /><span>{item}</span>{locked && <span className="component-lock" aria-label={`${item} bloqueado`} title="Componente em desenvolvimento"><LockIcon /></span>}</button>; })}</div></div>)}
    </div>
    <div className="canvas-wrap">
      <button className="templates-btn" onClick={() => notify("Galeria de modelos em breve")}>▣　Modelos</button>
      <div className={"canvas " + (dragOverCanvas ? "canvas-drop-active" : "")} onDragOver={(event) => { event.preventDefault(); if (event.target === event.currentTarget) setDropIndicator(null); setDragOverCanvas(true); }} onDragLeave={() => { setDragOverCanvas(false); setDropIndicator(null); }} onDrop={dropComponent}>
        <div className="canvas-progress" style={{ "--progress-width": `${funnelProgress}%` } as React.CSSProperties} aria-label={`Progresso da etapa: ${funnelProgress}%`} />
        {blocks.length === 0 ? <div className="canvas-empty-state"><div className="canvas-empty-icon">⌁</div><strong>{dragOverCanvas ? "Solte aqui!" : "Canvas vazio"}</strong><span>{dragOverCanvas ? "Solte para adicionar o componente" : "Arraste um componente da barra lateral para começar"}</span></div> : <div className="canvas-content">{blocks.map((block) => <div key={block.id} className={`canvas-block ${selectedBlockId === block.id ? "is-selected" : ""} ${movingBlockId === block.id ? "is-moving" : ""} ${dropIndicator?.targetId === block.id ? `drop-${dropIndicator.position}` : ""}`} draggable onDragStart={(event) => startMovingBlock(event, block.id)} onDragEnd={() => { setMovingBlockId(null); setDropIndicator(null); }} onClick={() => setSelectedBlockId(block.id)} onDoubleClick={() => { setSelectedBlockId(block.id); setEditingBlockId(block.id); }} onDragOver={(event) => updateDropIndicator(event, block.id)} onDrop={(event) => dropOnBlock(event, block.id)}>{renderBlock(block)}{selectedBlockId === block.id && <div className="canvas-block-actions"><button title="Editar elemento" aria-label="Editar elemento" onClick={(event) => { event.stopPropagation(); setEditingBlockId(block.id); }}><EditorActionIcon type="edit" /></button><button title="Arraste para mover o elemento" aria-label="Arraste para mover o elemento" draggable onDragStart={(event) => startMovingBlock(event, block.id)} onDragEnd={() => setMovingBlockId(null)}><EditorActionIcon type="move" /></button><button title="Duplicar elemento" aria-label="Duplicar elemento" onClick={(event) => { event.stopPropagation(); duplicateSelectedBlock(); }}><EditorActionIcon type="duplicate" /></button><button title="Excluir elemento" aria-label="Excluir elemento" onClick={(event) => { event.stopPropagation(); removeSelectedBlock(); }}><EditorActionIcon type="delete" /></button></div>}{editingBlockId === block.id && block.item === "Texto" && <div className="inline-editor-toolbar" onClick={(event) => event.stopPropagation()}><button title="Cor do texto" type="button">◉</button><button title="Emoji" type="button">☺</button><button title="Variáveis" type="button">{"{}"}</button><button title="Tamanho da fonte" type="button">T</button><select title="Tamanho da fonte" value={block.fontSize ?? 16} onChange={(event) => onTextStyleChange({ fontSize: Number(event.target.value) })}><option value="12">12px</option><option value="14">14px</option><option value="16">16px</option><option value="18">18px</option><option value="24">24px</option><option value="32">32px</option></select><button title="Negrito" type="button" className={block.bold ? "toolbar-active" : ""} onClick={() => onTextStyleChange({ bold: !block.bold })}><b>B</b></button><button title="Itálico" type="button" className={block.italic ? "toolbar-active" : ""} onClick={() => onTextStyleChange({ italic: !block.italic })}><i>I</i></button><button title="Sublinhado" type="button" className={block.underline ? "toolbar-active" : ""} onClick={() => onTextStyleChange({ underline: !block.underline })}><u>U</u></button><button title="Lista" type="button">☷</button><button title="Linha" type="button">—</button><button title="Alinhamento" type="button">≡</button></div>}</div>)}</div>}
      </div>
    </div>
    <Properties notify={notify} selectedBlock={selectedBlock} onStartEditing={() => selectedBlock && setEditingBlockId(selectedBlock.id)} onTextChange={updateBlockContent} onBlockChange={(patch) => { if (selectedBlockId === null) return; setBlocks((current) => current.map((block) => block.id === selectedBlockId ? { ...block, ...patch } : block)); }} />
    {stepToDelete && <ConfirmModal title="Excluir etapa?" description={`Tem certeza que deseja excluir “${stepToDelete.title}”? Todos os componentes desta etapa serão removidos.`} confirmLabel={deletingStep ? "Excluindo..." : "Excluir etapa"} onCancel={() => !deletingStep && setStepToDelete(null)} onConfirm={deleteStep} />}
    {stepToRename && <RenameStepModal step={stepToRename} busy={renamingStep} onCancel={() => !renamingStep && setStepToRename(null)} onRename={renameStep} />}
  </div>;
}

function VideoProperties({ notify, block, onBlockChange }: { notify: (message: string) => void; block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const platform = block.videoPlatform ?? "youtube";
  return <aside className="properties"><h2>Propriedades do Vídeo</h2><div className="properties-tabs"><button className="active" type="button">Configurações</button><button type="button" onClick={() => notify("Design do vídeo selecionado")}>Design</button></div><div className="property-section"><label>Plataforma</label><select value={platform} onChange={(event) => onBlockChange({ videoPlatform: event.target.value as CanvasBlock["videoPlatform"] })}><option value="muve">❖　Muve</option><option value="youtube">▶　YouTube</option><option value="vturb">▷　VTurb</option></select></div><div className="property-section"><label>Código de Incorporação</label><textarea value={block.videoEmbed ?? ""} placeholder={`<iframe src='https://${platform === "youtube" ? "youtube.com/embed/..." : platform === "muve" ? "muve.com/embed/..." : "vturb.com/embed/..."}'></iframe>`} onChange={(event) => onBlockChange({ videoEmbed: event.target.value })} /></div></aside>;
}

function SimplePropertiesRouter({ block, onBlockChange }: { block: CanvasBlock; onBlockChange: (patch: Partial<CanvasBlock>) => void }) { return <SimpleElementProperties kind={block.item as SimpleKind} block={block} onBlockChange={onBlockChange} />; }

function Properties({ notify, selectedBlock, onStartEditing, onTextChange, onBlockChange }: { notify: (message: string) => void; selectedBlock: CanvasBlock | null; onStartEditing: () => void; onTextChange: (content: string) => void; onBlockChange: (patch: Partial<CanvasBlock>) => void }) {
  const title = selectedBlock ? "Propriedades do " + selectedBlock.item : "Propriedades do Step";
  const button = selectedBlock?.item === "Botão";
  const image = selectedBlock?.item === "Imagem";
  const [showImagePicker, setShowImagePicker] = useState(false);
  if (selectedBlock?.item === "Vídeo") return <VideoProperties notify={notify} block={selectedBlock} onBlockChange={onBlockChange} />;
  if (selectedBlock?.item === "Botão") return <aside className="properties"><h2>Propriedades do Botão</h2><ButtonProperties block={selectedBlock} onTextChange={onTextChange} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Opções") return <aside className="properties"><h2>Propriedades das Opções</h2><OptionsProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Formulário") return <aside className="properties"><h2>Propriedades do Formulário</h2><FormProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Área de Texto") return <aside className="properties"><h2>Textarea</h2><TextareaProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Argumentos") return <aside className="properties"><h2>Propriedades dos Argumentos</h2><ArgumentsProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Alerta") return <aside className="properties"><h2>Propriedades do Alerta</h2><AlertProperties block={selectedBlock} onTextChange={onTextChange} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "FAQ") return <aside className="properties"><h2>FAQ</h2><FaqProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Carrossel") return <aside className="properties"><h2>Propriedades do Carrossel</h2><CarouselProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Depoimentos") return <aside className="properties"><h2>Propriedades dos Depoimentos</h2><TestimonialsProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Antes/Depois") return <aside className="properties"><h2>Propriedades do Antes/Depois</h2><BeforeAfterProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Áudio") return <aside className="properties"><h2>Propriedades do Áudio</h2><AudioProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
    if (selectedBlock?.item === "Loading") return <aside className="properties"><h2>Propriedades do Loading</h2><LoadingProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
    if (selectedBlock?.item === "Notificação") return <aside className="properties"><h2>Propriedades da Notificação</h2><NotificationProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Delay") return <aside className="properties"><h2>Propriedades do Delay</h2><DelayProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Nível") return <aside className="properties"><h2>Propriedades do Nível</h2><LevelProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Peso") return <aside className="properties"><h2>Propriedades do Peso</h2><WeightProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Altura") return <aside className="properties"><h2>Propriedades da Altura</h2><HeightProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Tendência") return <aside className="properties"><h2>Propriedades do Gráfico de Tendência</h2><TrendProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Evolutivo") return <aside className="properties"><h2>Propriedades do Gráfico Cartesiano</h2><EvolutionProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Gamificação") return <aside className="properties"><h2>Propriedades da Gamificação</h2><GamificationProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Planos") return <aside className="properties"><h2>Propriedades do Checkout</h2><PlansProperties block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock && ["Espaço", "Timer", "Script", "IMC", "Idade", "Mapa Corporal"].includes(selectedBlock.item)) return <aside className="properties"><h2>Propriedades do {selectedBlock.item}</h2><SimplePropertiesRouter block={selectedBlock} onBlockChange={onBlockChange} /></aside>;
  if (selectedBlock?.item === "Texto") return <aside className="properties"><h2>Propriedades do Texto</h2><div className="property-section"><label>Conteúdo do Texto</label><small>Editar o conteúdo do texto</small><input value={selectedBlock.content} onFocus={onStartEditing} onChange={(event) => onTextChange(event.target.value)} /></div></aside>;
  return <aside className="properties"><h2>{title}</h2>{selectedBlock?.item === "Texto" ? <><button className="properties-tab active">Configurações</button><div className="property-section"><label>Conteúdo do Texto</label><small>Editar o conteúdo do texto</small><input value={selectedBlock.content} onFocus={onStartEditing} onChange={(event) => onTextChange(event.target.value)} /></div></> : image ? <><div className="properties-tabs"><button className="active">Configurações</button><button onClick={() => notify("Design da imagem selecionado")}>Design</button></div><div className="property-section"><label>Selecionar Imagem</label><small>Escolha a imagem para exibir</small><button className="image-upload-control" onClick={() => setShowImagePicker(true)}>↥<span>Clique para fazer upload<br />ou arraste uma imagem aqui</span></button>{selectedBlock.imageUrl && <button className="remove-image-btn" onClick={() => onBlockChange({ imageUrl: undefined })}>♧ Remover imagem</button>}</div><div className="property-section"><label>Alinhamento Horizontal</label><div className="alignment-buttons"><button className={selectedBlock.imageAlign === "left" ? "active" : ""} onClick={() => onBlockChange({ imageAlign: "left" })}>≡</button><button className={!selectedBlock.imageAlign || selectedBlock.imageAlign === "center" ? "active" : ""} onClick={() => onBlockChange({ imageAlign: "center" })}>≡</button><button className={selectedBlock.imageAlign === "right" ? "active" : ""} onClick={() => onBlockChange({ imageAlign: "right" })}>≡</button></div></div><div className="property-section"><label>Largura</label><small>Largura da imagem em porcentagem</small><input type="range" min="20" max="100" value={selectedBlock.imageWidth ?? 100} onChange={(event) => onBlockChange({ imageWidth: Number(event.target.value) })} /></div><div className="property-section"><label>Altura</label><small>Altura da imagem em pixels</small><input type="range" min="100" max="700" value={selectedBlock.imageHeight ?? 220} onChange={(event) => onBlockChange({ imageHeight: Number(event.target.value) })} /></div></> : button ? <><div className="properties-tabs"><button className="active">Geral</button><button onClick={() => notify("Design do botão selecionado")}>Design</button><button onClick={() => notify("Teste A/B do botão selecionado")}>Teste A/B</button></div><div className="property-section"><label>Conteúdo do Botão</label><input value={selectedBlock.content} onChange={(event) => onTextChange(event.target.value)} /></div><div className="property-section"><label>Largura do Botão</label><input type="range" min="20" max="100" value={selectedBlock.width ?? 100} onChange={(event) => onBlockChange({ width: Number(event.target.value) })} /></div><div className="property-section"><label>Alinhamento</label><div className="alignment-buttons"><button className={selectedBlock.align === "left" ? "active" : ""} onClick={() => onBlockChange({ align: "left" })}>≡</button><button className={!selectedBlock.align || selectedBlock.align === "center" ? "active" : ""} onClick={() => onBlockChange({ align: "center" })}>≡</button><button className={selectedBlock.align === "right" ? "active" : ""} onClick={() => onBlockChange({ align: "right" })}>≡</button></div></div><div className="property-section"><label>Tipo de Navegação</label><select value={selectedBlock.navigation ?? "next"} onChange={(event) => onBlockChange({ navigation: event.target.value })}><option value="next">Navegar para próxima etapa</option><option value="url">Abrir um link</option><option value="anchor">Ir para um componente</option></select></div><div className="toggle-row"><div><label>Fixar no Rodapé</label><small>Manter o botão fixo no rodapé</small></div><button className={selectedBlock.sticky ? "toggle on" : "toggle"} onClick={() => onBlockChange({ sticky: !selectedBlock.sticky })} /></div><div className="toggle-row"><div><label>Botão de Âncora</label><small>Fazer o botão navegar para um componente específico da página</small></div><button className={selectedBlock.anchor ? "toggle on" : "toggle"} onClick={() => onBlockChange({ anchor: !selectedBlock.anchor })} /></div><div className="property-section"><label>Delay para aparecer</label><small>Tempo em segundos para o botão aparecer</small><input value={selectedBlock.delay ?? ""} placeholder="Exemplo: 5 segundos" onChange={(event) => onBlockChange({ delay: event.target.value })} /></div><div className="property-section"><label>Script ao Clicar</label><small>Código JavaScript executado quando o botão é clicado</small><textarea value={selectedBlock.script ?? "console.log('Botão clicado');"} onChange={(event) => onBlockChange({ script: event.target.value })} /></div></> : selectedBlock?.item === "Alerta" ? <><button className="properties-tab active">Configurações</button><div className="property-section"><label>Título</label><input value={selectedBlock.content} onChange={(event) => onTextChange(event.target.value)} /></div><div className="property-section"><label>Alinhamento Horizontal</label><div className="alignment-buttons"><button>≡</button><button className="active">≡</button><button>≡</button></div><label>Largura Personalizada</label><input type="range" defaultValue="100" /><label>Ícones</label><div className="alert-icon-grid"><button>△<span>Atenção</span></button><button className="active">ⓘ<span>Informação</span></button><button>☑<span>Sucesso</span></button><button>ⓘ<span>Erro</span></button><button>?</button><button>×<span>Fechar</span></button></div><button className="outline-btn">Remover ícone</button></div></> : <><p>Selecione ou arraste um componente para começar a editar.</p><div className="property-section"><label>Título do passo</label><small>Configurações gerais do step</small><input defaultValue="Passo 1" /></div><button className="upload-box" onClick={() => notify("Upload de imagem em breve")}>↥<br /><span>Clique para fazer upload<br />ou arraste uma imagem aqui</span></button></>}{showImagePicker && <ImagePickerModal onCancel={() => setShowImagePicker(false)} onSelect={(url) => { onBlockChange({ imageUrl: url }); setShowImagePicker(false); }} />}</aside>;}
function Analytics({ notify }: { notify: (message: string) => void }) { return <div className="analytics-page"><div className="analytics-filters"><button>◉　FE POR UM FIO　⌄</button><button>▣　01/11/2026 - 04/11/2026</button><button onClick={() => notify("Dados atualizados")}>⟳</button></div><div className="metric-grid">{[["◉", "Pageviews", "0", "Visitantes que acessaram seu funil"], ["♙", "Leads Adquiridos", "0", "Iniciaram alguma interação com o seu funil"], ["⌁", "% Interação", "0.0%", "Percentual de leads que interagiram"], ["✓", "Leads Qualificados", "0", "Completaram 50% do funil"], ["✓", "Fluxos Completos", "0", "Chegaram até a última etapa do funil"]].map((metric) => <div className="metric-card" key={metric[1]}><span>{metric[0]}　{metric[1]}</span><strong>{metric[2]}</strong><small>{metric[3]}</small></div>)}</div><div className="chart-card"><div className="empty-chart">Nenhum dado no período selecionado</div></div><div className="conversion-card"><h2>Análise de Conversão</h2><div className="inner-tabs"><button className="active">Funil</button><button>Eventos</button><button>Resumo</button></div></div></div>; }

function LegacyIntegrations({ notify }: { notify: (message: string) => void }) { return <div className="section-page integrations-page"><div className="subtabs"><button className="active">◉ Integrações</button><button>&lt;/&gt; Scripts</button><button>▣ Webhooks</button></div><h2>Integrações Disponíveis</h2><div className="integration-grid">{integrations.map((item, index) => <div className="integration-card" key={item}><div className={`integration-logo logo-${index}`}>{index === 0 ? "◉" : index === 2 ? "∞" : "✦"}</div><h3>{item}</h3><p>Adicione e gerencie essa integração para rastrear e otimizar suas campanhas de marketing.</p><button className={index === 2 ? "primary-btn" : "outline-btn"} onClick={() => notify(`${item}: configuração em breve`)}>{index === 2 ? "Detalhes" : "Integrar"}</button></div>)}</div></div>; }

function LegacyFlowView() { return <div className="flow-page"><div className="flow-chip">A/B　 Step inicial do Teste A/B</div><div className="flow-settings"><h3>Configurações do Fluxo</h3><div className="toggle-row"><label>Mostrar Métricas</label><button className="toggle on" /></div><button className="outline-btn">▣　Reorganizar Layout</button><small>Período de Análise</small><div className="date-box">▣　28/10/2026 - 04/11/2026</div></div><div className="flow-map">{steps.filter((s) => !s.break).map((step, i) => <div className="map-node" key={step.title}><strong>{step.title}</strong><span>☷　Pergunta</span><span>↗　{12 + i * 7} leads</span></div>)}</div><div className="zoom-controls">＋<br /><span>⌁</span><br />−</div></div>; }

function Results({ notify }: { notify: (message: string) => void }) { return <div className="results-page"><div className="subtabs"><button className="active">♧ Eventos</button><button>▤ Resumo</button><button>⌁ Analytics</button><span className="date-box">▣　01/11/2026 - 04/11/2026　⟳</span></div><div className="metric-grid">{[["◉", "Pageviews", "0"], ["♙", "Leads Adquiridos", "0"], ["⌁", "% Interação", "0.0%"], ["✓", "Leads Qualificados", "0"], ["✓", "Fluxos Completos", "0"]].map((metric) => <div className="metric-card" key={metric[1]}><span>{metric[0]}　{metric[1]}</span><strong>{metric[2]}</strong></div>)}</div><div className="results-toolbar"><button className="outline-btn" onClick={() => notify("Filtros avançados em breve")}>⌄ Filtros Avançados</button><button className="outline-btn" onClick={() => notify("Exportação em breve")}>⇩ Exportar CSV</button><button className="outline-btn" onClick={() => notify("Exportação em breve")}>▣ Exportar Excel</button></div><div className="empty-results">Não há dados disponíveis</div></div>; }

function ShareView({ notify }: { notify: (message: string) => void }) { const [tab, setTab] = useState<"share" | "embed">("share"); const link = typeof window === "undefined" ? "https://izquiz.app/fe-por-um-fio" : `${window.location.origin}/quiz/fe-por-um-fio`; async function copyLink() { try { await navigator.clipboard.writeText(link); notify("Link copiado"); } catch { notify("Não foi possível copiar o link"); } } return <div className="share-page"><div className="subtabs"><button className={tab === "share" ? "active" : ""} onClick={() => setTab("share")}><span className="share-icon">↗</span> Compartilhar</button><button className={tab === "embed" ? "active" : ""} onClick={() => setTab("embed")}><span className="share-icon">&lt;/&gt;</span> Incorporar</button></div>{tab === "share" ? <div className="share-content"><h2>Link do seu funil</h2><p>Copie o link direto e compartilhe onde quiser.</p><div className="share-link"><span className="share-link-icon">↗</span><span className="share-url">{link}</span><button onClick={copyLink}><span className="share-icon">▣</span> Copiar</button><button onClick={() => window.open(link, "_blank", "noopener,noreferrer")}><span className="share-icon">↗</span> Preview</button></div></div> : <div className="share-content"><h2>Incorporar funil</h2><p>Use este código para incorporar o funil em uma página.</p><textarea className="embed-code" readOnly value={`<iframe src="${link}" width="100%" height="800" frameborder="0"></iframe>`} /><button className="primary-btn" onClick={async () => { try { await navigator.clipboard.writeText(`<iframe src="${link}" width="100%" height="800" frameborder="0"></iframe>`); notify("Código copiado"); } catch { notify("Não foi possível copiar o código"); } }}>▣ Copiar código</button></div>}</div>; }

function Settings({ notify, supabase, funnelId }: { notify: (message: string) => void; supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>> | null; funnelId: string | null }) { const [tab, setTab] = useState<"design" | "domains">("design"); return <div className="settings-page"><div className="subtabs"><button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>♟ Design</button><button className={tab === "domains" ? "active" : ""} onClick={() => setTab("domains")}>⌄ Domínio</button><button>⌄ Teste AB</button><button>⌄ Gamificação</button></div>{tab === "domains" ? <DomainSettings supabase={supabase} funnelId={funnelId} notify={notify} /> : <div className="settings-form"><h2>Identidade do Browser</h2><p>Aparecem na aba do navegador.</p><label>Título do Site</label><input placeholder="Digite o título do seu quiz" /><label>Favicon</label><small>Recomendado: 32×32px. ICO, PNG ou SVG.</small><button className="upload-box" onClick={() => notify("Upload de favicon em breve")}>↥<br />Clique para fazer upload<br />ou arraste uma imagem aqui</button><hr /><h2>Visual do Quiz</h2><p>Aparecem dentro do quiz.</p><label>Logo</label><small>Recomendado: 180×45px. PNG ou SVG transparente.</small><button className="upload-box" onClick={() => notify("Upload de logo em breve")}>↥<br />Clique para fazer upload<br />ou arraste uma imagem aqui</button><label>Cor da Barra de Progresso</label><div className="color-input"><i className="blue" />rgba(59, 130, 246, 1)</div><label>Cor de Fundo do Quiz</label><div className="color-input"><i />rgba(255, 255, 255, 1)</div></div>}</div>; }
function ShareViewDynamic({ notify, funnelId }: { notify: (message: string) => void; funnelId: string | null }) { const [tab, setTab] = useState<"share" | "embed">("share"); const link = `${window.location.origin}/quiz/${funnelId ?? "fe-por-um-fio"}`; const embed = `<iframe src="${link}" width="100%" height="800" frameborder="0"></iframe>`; async function copy(value: string, message: string) { try { await navigator.clipboard.writeText(value); notify(message); } catch { notify("Não foi possível copiar"); } } return <div className="share-page"><div className="subtabs"><button className={tab === "share" ? "active" : ""} onClick={() => setTab("share")}>↗ Compartilhar</button><button className={tab === "embed" ? "active" : ""} onClick={() => setTab("embed")}>&lt;/&gt; Incorporar</button></div>{tab === "share" ? <div className="share-content"><h2>Link do seu funil</h2><p>Copie o link direto e compartilhe onde quiser.</p><div className="share-link"><span className="share-url">{link}</span><button onClick={() => copy(link, "Link copiado")}>▣ Copiar</button><button onClick={() => window.open(link, "_blank", "noopener,noreferrer")}>↗ Preview</button></div></div> : <div className="share-content"><h2>Incorporar funil</h2><p>Use este código para incorporar o funil em uma página.</p><textarea className="embed-code" readOnly value={embed} /><button className="primary-btn" onClick={() => copy(embed, "Código copiado")}>▣ Copiar código</button></div>}</div>; }
