import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
// The project does not yet have generated Supabase database types; these clients stay server-only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type McpContext = { supabase: SupabaseClient<any>; workspaceIds: string[] };

const MCP_PROTOCOL_VERSION = "2025-06-18";

function headers(extra: Record<string, string> = {}) {
  return { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, MCP-Protocol-Version", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", ...extra };
}

function response(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) { return new Response(JSON.stringify(body), { status, headers: headers(extraHeaders) }); }
function error(id: JsonRpcRequest["id"], code: number, message: string) { return response({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200); }
function result(id: JsonRpcRequest["id"], value: unknown) { return response({ jsonrpc: "2.0", id: id ?? null, result: value }); }

function toolText(value: unknown) { return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value }; }

function tools() {
  const securitySchemes = [{ type: "oauth2", scopes: ["openid", "email", "profile"] }];
  return [
    { name: "izquiz_list_funnels", description: "Lista os funis do workspace autorizado do Izquiz.", securitySchemes, inputSchema: { type: "object", properties: {} } },
    { name: "izquiz_get_funnel", description: "Lê um funil, suas etapas e blocos pelo ID ou slug.", securitySchemes, inputSchema: { type: "object", properties: { funnelId: { type: "string" }, slug: { type: "string" } } } },
    { name: "izquiz_create_funnel", description: "Cria um novo funil em rascunho.", securitySchemes, inputSchema: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, workspaceId: { type: "string" } } } },
    { name: "izquiz_update_funnel", description: "Altera nome, slug ou status de um funil. Publicar e arquivar são ações explícitas.", securitySchemes, inputSchema: { type: "object", required: ["funnelId"], properties: { funnelId: { type: "string" }, name: { type: "string" }, slug: { type: "string" }, status: { type: "string", enum: ["draft", "published", "archived"] } } } },
    { name: "izquiz_list_steps", description: "Lista as etapas de um funil na ordem atual.", securitySchemes, inputSchema: { type: "object", required: ["funnelId"], properties: { funnelId: { type: "string" } } } },
    { name: "izquiz_create_step", description: "Adiciona uma etapa ao final do funil.", securitySchemes, inputSchema: { type: "object", required: ["funnelId", "title"], properties: { funnelId: { type: "string" }, title: { type: "string" }, stepType: { type: "string", enum: ["intro", "question", "break", "form", "landing", "result"] } } } },
    { name: "izquiz_update_step", description: "Atualiza título, tipo ou configurações de uma etapa.", securitySchemes, inputSchema: { type: "object", required: ["stepId"], properties: { stepId: { type: "string" }, title: { type: "string" }, stepType: { type: "string" }, settings: { type: "object" } } } },
    { name: "izquiz_reorder_steps", description: "Reordena etapas usando uma lista de IDs na ordem desejada.", securitySchemes, inputSchema: { type: "object", required: ["funnelId", "stepIds"], properties: { funnelId: { type: "string" }, stepIds: { type: "array", items: { type: "string" } } } } },
    { name: "izquiz_list_metrics", description: "Retorna pessoas, eventos e taxa de conclusão de um funil.", securitySchemes, inputSchema: { type: "object", required: ["funnelId"], properties: { funnelId: { type: "string" } } } },
  ];
}

async function getContext(request: Request): Promise<McpContext | Response> {
  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const expected = process.env.IZQUIZ_MCP_TOKEN;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !bearer) return response({ error: "Não autorizado" }, 401, { "WWW-Authenticate": `Bearer resource_metadata=\"${process.env.MCP_PUBLIC_URL ?? "https://izquiz.stuffshub.com"}/.well-known/oauth-protected-resource\"` });

  let supabase: McpContext["supabase"];
  let userId: string | null = null;
  if (expected && bearer === expected) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    userId = process.env.IZQUIZ_MCP_USER_ID ?? null;
    if (!serviceKey || !userId) return response({ error: "Fallback MCP não configurado no servidor" }, 503);
    supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  } else {
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!publishableKey) return response({ error: "Chave pública do Supabase não configurada" }, 503);
    supabase = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false }, global: { headers: { Authorization: `Bearer ${bearer}` } } });
    const { data: userData, error: userError } = await supabase.auth.getUser(bearer);
    if (userError || !userData.user) return response({ error: "Token OAuth inválido ou expirado" }, 401, { "WWW-Authenticate": `Bearer resource_metadata=\"${process.env.MCP_PUBLIC_URL ?? "https://izquiz.stuffshub.com"}/.well-known/oauth-protected-resource\"` });
    userId = userData.user.id;
  }
  const memberships = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId);
  if (memberships.error) return response({ error: "Não foi possível validar o workspace" }, 500);
  const workspaceIds = (memberships.data ?? []).map((row) => row.workspace_id as string);
  if (!workspaceIds.length) return response({ error: "Usuário do MCP não possui workspace" }, 403);
  return { supabase, workspaceIds };
}

async function getFunnel(context: McpContext, funnelId: string) {
  const { data, error: queryError } = await context.supabase.from("funnels").select("id, workspace_id, name, slug, status, settings, published_at, created_at, updated_at").eq("id", funnelId).in("workspace_id", context.workspaceIds).maybeSingle();
  if (queryError) throw queryError;
  if (!data) throw new Error("Funil não encontrado ou não autorizado");
  return data;
}

async function callTool(name: string, args: Record<string, unknown>, context: McpContext) {
  if (name === "izquiz_list_funnels") {
    const { data, error: queryError } = await context.supabase.from("funnels").select("id, name, slug, status, published_at, updated_at").in("workspace_id", context.workspaceIds).order("created_at", { ascending: false });
    if (queryError) throw queryError;
    return toolText(data ?? []);
  }
  if (name === "izquiz_get_funnel") {
    let funnel = args.funnelId ? await getFunnel(context, String(args.funnelId)) : null;
    if (!funnel && args.slug) {
      const { data, error: queryError } = await context.supabase.from("funnels").select("id, workspace_id, name, slug, status, settings, published_at, created_at, updated_at").eq("slug", String(args.slug)).in("workspace_id", context.workspaceIds).maybeSingle();
      if (queryError) throw queryError;
      funnel = data;
    }
    if (!funnel) throw new Error("Informe funnelId ou slug");
    const { data: steps, error: stepsError } = await context.supabase.from("funnel_steps").select("id, position, title, step_type, settings, step_blocks(id, position, block_type, content)").eq("funnel_id", funnel.id).order("position");
    if (stepsError) throw stepsError;
    return toolText({ ...funnel, steps: steps ?? [] });
  }
  if (name === "izquiz_create_funnel") {
    const workspaceId = String(args.workspaceId ?? context.workspaceIds[0]);
    if (!context.workspaceIds.includes(workspaceId)) throw new Error("Workspace não autorizado");
    const nameValue = String(args.name).trim();
    const slug = String(args.slug ?? (nameValue.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `funil-${Date.now()}`));
    const { data, error: queryError } = await context.supabase.from("funnels").insert({ workspace_id: workspaceId, name: nameValue, slug, status: "draft" }).select("id, name, slug, status").single();
    if (queryError) throw queryError;
    return toolText(data);
  }
  if (name === "izquiz_update_funnel") {
    const funnel = await getFunnel(context, String(args.funnelId));
    const patch: Record<string, unknown> = {};
    if (typeof args.name === "string") patch.name = args.name.trim();
    if (typeof args.slug === "string") patch.slug = args.slug.trim();
    if (typeof args.status === "string") { patch.status = args.status; patch.published_at = args.status === "published" ? new Date().toISOString() : null; }
    if (!Object.keys(patch).length) throw new Error("Nenhuma alteração informada");
    const { data, error: queryError } = await context.supabase.from("funnels").update(patch).eq("id", funnel.id).eq("workspace_id", funnel.workspace_id).select("id, name, slug, status, published_at").single();
    if (queryError) throw queryError;
    return toolText(data);
  }
  if (name === "izquiz_list_steps") {
    await getFunnel(context, String(args.funnelId));
    const { data, error: queryError } = await context.supabase.from("funnel_steps").select("id, position, title, step_type, settings").eq("funnel_id", String(args.funnelId)).order("position");
    if (queryError) throw queryError;
    return toolText(data ?? []);
  }
  if (name === "izquiz_create_step") {
    const funnel = await getFunnel(context, String(args.funnelId));
    const { data: last } = await context.supabase.from("funnel_steps").select("position").eq("funnel_id", funnel.id).order("position", { ascending: false }).limit(1).maybeSingle();
    const { data, error: queryError } = await context.supabase.from("funnel_steps").insert({ funnel_id: funnel.id, position: (last?.position ?? -1) + 1, title: String(args.title), step_type: String(args.stepType ?? "question") }).select("id, position, title, step_type").single();
    if (queryError) throw queryError;
    return toolText(data);
  }
  if (name === "izquiz_update_step") {
    const { data: step, error: stepError } = await context.supabase.from("funnel_steps").select("id, funnel_id").eq("id", String(args.stepId)).maybeSingle();
    if (stepError) throw stepError;
    if (!step) throw new Error("Etapa não encontrada ou não autorizada");
    await getFunnel(context, step.funnel_id);
    const patch: Record<string, unknown> = {};
    if (typeof args.title === "string") patch.title = args.title;
    if (typeof args.stepType === "string") patch.step_type = args.stepType;
    if (args.settings && typeof args.settings === "object") patch.settings = args.settings;
    const { data, error: queryError } = await context.supabase.from("funnel_steps").update(patch).eq("id", String(args.stepId)).select("id, position, title, step_type, settings").single();
    if (queryError) throw queryError;
    return toolText(data);
  }
  if (name === "izquiz_reorder_steps") {
    const funnel = await getFunnel(context, String(args.funnelId));
    const stepIds = Array.isArray(args.stepIds) ? args.stepIds.map(String) : [];
    const { data: steps, error: stepsError } = await context.supabase.from("funnel_steps").select("id").eq("funnel_id", funnel.id);
    if (stepsError) throw stepsError;
    if (stepIds.length !== (steps ?? []).length || stepIds.some((id) => !(steps ?? []).some((step) => step.id === id))) throw new Error("A lista precisa conter todas as etapas do funil uma única vez");
    for (let index = 0; index < stepIds.length; index += 1) { const { error: updateError } = await context.supabase.from("funnel_steps").update({ position: 100000 + index }).eq("id", stepIds[index]); if (updateError) throw updateError; }
    for (let index = 0; index < stepIds.length; index += 1) { const { error: updateError } = await context.supabase.from("funnel_steps").update({ position: index }).eq("id", stepIds[index]); if (updateError) throw updateError; }
    return toolText({ funnelId: funnel.id, stepIds, message: "Etapas reordenadas" });
  }
  if (name === "izquiz_list_metrics") {
    const funnel = await getFunnel(context, String(args.funnelId));
    const [leads, events, completedEvents] = await Promise.all([
      context.supabase.from("leads").select("id", { count: "exact", head: true }).eq("funnel_id", funnel.id),
      context.supabase.from("funnel_events").select("id", { count: "exact", head: true }).eq("funnel_id", funnel.id),
      context.supabase.from("funnel_events").select("id", { count: "exact", head: true }).eq("funnel_id", funnel.id).eq("event_type", "completed"),
    ]);
    if (leads.error || events.error || completedEvents.error) throw leads.error ?? events.error ?? completedEvents.error;
    const people = leads.count ?? 0;
    const completed = completedEvents.count ?? 0;
    return toolText({ funnelId: funnel.id, people, events: events.count ?? 0, completed, completionRate: people ? `${Math.round((completed / people) * 100)}%` : "0%" });
  }
  throw new Error(`Ferramenta desconhecida: ${name}`);
}

async function handle(request: Request) {
  const body = await request.json() as JsonRpcRequest;
  if (body.method === "initialize") return result(body.id, { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: "izquiz-mcp", version: "0.1.0" } });
  if (body.method === "notifications/initialized") return new Response(null, { status: 202, headers: headers() });
  if (body.method === "ping") return result(body.id, {});
  const context = await getContext(request);
  if (context instanceof Response) return context;
  if (body.method === "tools/list") return result(body.id, { tools: tools() });
  if (body.method === "tools/call") {
    const params = body.params ?? {};
    try { return result(body.id, await callTool(String(params.name), (params.arguments ?? {}) as Record<string, unknown>, context)); } catch (toolError) { return result(body.id, { content: [{ type: "text", text: toolError instanceof Error ? toolError.message : "Erro ao executar ferramenta" }], isError: true }); }
  }
  return error(body.id, -32601, "Método MCP não suportado");
}

export async function OPTIONS() { return new Response(null, { status: 204, headers: headers() }); }
export async function GET() { return response({ name: "izquiz-mcp", endpoint: "/mcp", message: "Use POST para o transporte MCP Streamable HTTP." }, 200); }
export async function POST(request: Request) { try { return await handle(request); } catch { return response({ error: "Requisição MCP inválida" }, 400); } }
export async function DELETE() { return response({ message: "Sessões stateless não precisam ser encerradas." }, 200); }
