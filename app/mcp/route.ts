import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
// The project does not yet have generated Supabase database types; these clients stay server-only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type McpContext = { supabase: SupabaseClient<any>; workspaceIds: string[] };

const MCP_PROTOCOL_VERSION = "2025-06-18";
const MCP_SERVER_VERSION = "0.2.0";
const STEP_TYPES = ["intro", "question", "break", "form", "landing", "result"] as const;

function getServiceRoleKey() {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (envKey) return envKey;
  try {
    const secretPath = process.env.SUPABASE_SERVICE_ROLE_KEY_FILE ?? "/run/secrets/supabase_service_role_key";
    return readFileSync(secretPath, "utf8").trim() || null;
  } catch {
    return null;
  }
}

function headers(extra: Record<string, string> = {}) {
  return { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, MCP-Protocol-Version", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", ...extra };
}

function response(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) { return new Response(JSON.stringify(body), { status, headers: headers(extraHeaders) }); }
function error(id: JsonRpcRequest["id"], code: number, message: string) { return response({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200); }
function result(id: JsonRpcRequest["id"], value: unknown) { return response({ jsonrpc: "2.0", id: id ?? null, result: value }); }

function toolText(value: Record<string, unknown>) { return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value }; }

const BLOCK_TYPES = ["Texto", "Argumentos", "Alerta", "FAQ", "Imagem", "Vídeo", "Carrossel", "Depoimentos", "Antes/Depois", "Áudio", "Botão", "Opções", "Espaço", "Loading", "Timer", "Delay", "Notificação", "Script", "Formulário", "Área de Texto", "Nível", "Peso", "Altura", "IMC", "Idade", "Tendência", "Evolutivo", "Gamificação", "Mapa Corporal", "Planos"] as const;

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeBlockType(value: unknown) {
  const requested = String(value ?? "").trim();
  const normalized = requested.toLocaleLowerCase("pt-BR") === "text" || requested.toLocaleLowerCase("pt-BR") === "texto" ? "Texto" : requested;
  if (!BLOCK_TYPES.includes(normalized as typeof BLOCK_TYPES[number])) throw new Error(`Tipo de bloco inválido: ${requested}. Tipos aceitos: ${BLOCK_TYPES.join(", ")}`);
  return normalized;
}

function normalizeStepType(value: unknown) {
  const requested = String(value ?? "question").trim();
  if (!STEP_TYPES.includes(requested as typeof STEP_TYPES[number])) throw new Error(`Tipo de etapa inválido: ${requested}. Tipos aceitos: ${STEP_TYPES.join(", ")}`);
  return requested;
}

function blockProperties(args: Record<string, unknown>, legacyDefault = false) {
  const properties = { ...recordValue(args.settings), ...recordValue(args.properties) };
  const text = typeof args.content === "string" ? args.content : typeof args.text === "string" ? args.text : undefined;
  const type = normalizeBlockType(args.item ?? args.blockType ?? args.block_type ?? args.type ?? "Texto");
  if (text !== undefined) properties.content = text;
  if (legacyDefault && properties.content === undefined) {
    if (type === "Texto") properties.content = "Texto de exemplo";
    else if (type === "Alerta") properties.content = "Atenção!";
    else if (type === "Botão") properties.content = "Próximo";
  }
  return { type, properties };
}

function tools() {
  const securitySchemes = [{ type: "oauth2", scopes: ["openid", "email", "profile"] }];
  const stepSchema = {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", minLength: 1 },
      stepType: { type: "string", enum: STEP_TYPES },
      settings: { type: "object", description: "Configurações JSON da etapa." },
      blocks: { type: "array", maxItems: 100, items: { type: "object", required: ["type"], properties: { type: { type: "string", enum: BLOCK_TYPES }, properties: { type: "object" } } } },
    },
  };
  const blockSchema = {
    type: "object",
    required: ["type"],
    properties: {
      type: { type: "string", enum: BLOCK_TYPES },
      properties: { type: "object", description: "Propriedades JSON do bloco, usando os nomes de campo do editor." },
      position: { type: "integer", minimum: 0, description: "Posição começando em zero." },
    },
  };
  return [
    { name: "izquiz_list_funnels", description: "Lista os funis do workspace autorizado do Izquiz.", securitySchemes, inputSchema: { type: "object", properties: {} } },
    { name: "izquiz_get_funnel", description: "Lê um funil, suas etapas e blocos pelo ID ou slug.", securitySchemes, inputSchema: { type: "object", properties: { funnelId: { type: "string" }, slug: { type: "string" } } } },
    { name: "izquiz_create_funnel", description: "Cria um novo funil em rascunho.", securitySchemes, inputSchema: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, workspaceId: { type: "string" } } } },
    {
      name: "izquiz_build_funnel",
      description: 'Monta um funil completo em uma chamada JSON: cria o funil, suas etapas e os blocos visuais de cada etapa. Cada bloco tem type e properties, iguais ao JSON usado pelo editor. Exemplo JSON: {"name":"Meu quiz","steps":[{"title":"Boas-vindas","stepType":"intro","blocks":[{"type":"Texto","properties":{"content":"Olá!"}},{"type":"Botão","properties":{"content":"Próximo","navigation":"next"}}]}]}. Cria como rascunho e devolve os IDs e dados persistidos.',
      securitySchemes,
      inputSchema: { type: "object", required: ["name", "steps"], properties: { name: { type: "string", minLength: 1 }, slug: { type: "string" }, workspaceId: { type: "string" }, settings: { type: "object" }, steps: { type: "array", minItems: 1, maxItems: 50, items: stepSchema } } },
    },
    { name: "izquiz_update_funnel", description: "Altera nome, slug ou status de um funil. Publicar e arquivar são ações explícitas.", securitySchemes, inputSchema: { type: "object", required: ["funnelId"], properties: { funnelId: { type: "string" }, name: { type: "string" }, slug: { type: "string" }, status: { type: "string", enum: ["draft", "published", "archived"] } } } },
    { name: "izquiz_delete_funnel", description: "Exclui permanentemente um funil autorizado e seu conteúdo associado. Use somente quando solicitado explicitamente.", securitySchemes, inputSchema: { type: "object", required: ["funnelId"], properties: { funnelId: { type: "string" } } } },
    { name: "izquiz_list_steps", description: "Lista as etapas de um funil na ordem atual.", securitySchemes, inputSchema: { type: "object", required: ["funnelId"], properties: { funnelId: { type: "string" } } } },
    { name: "izquiz_create_step", description: "Adiciona uma etapa ao final do funil.", securitySchemes, inputSchema: { type: "object", required: ["funnelId", "title"], properties: { funnelId: { type: "string" }, title: { type: "string" }, stepType: { type: "string", enum: STEP_TYPES } } } },
    { name: "izquiz_update_step", description: "Atualiza título, tipo ou configurações de uma etapa.", securitySchemes, inputSchema: { type: "object", required: ["stepId"], properties: { stepId: { type: "string" }, title: { type: "string" }, stepType: { type: "string", enum: STEP_TYPES }, settings: { type: "object" } } } },
    { name: "izquiz_delete_step", description: "Exclui permanentemente uma etapa autorizada e seus blocos. Use somente quando solicitado explicitamente.", securitySchemes, inputSchema: { type: "object", required: ["stepId"], properties: { stepId: { type: "string" } } } },
    { name: "izquiz_list_blocks", description: "Lista os blocos visuais salvos em uma etapa. Retorna cada bloco como {id, stepId, position, type, properties}; properties contém a configuração JSON usada pelo editor e pelo quiz publicado.", securitySchemes, inputSchema: { type: "object", required: ["stepId"], properties: { stepId: { type: "string" } } } },
    {
      name: "izquiz_create_block",
      description: "Cria um bloco no formato JSON {stepId, block:{type, properties, position?}}. properties guarda os campos do componente, por exemplo Texto {content:'...'}, Imagem {imageUrl:'https://...'} ou Botão {content:'Próximo',navigation:'next'}. Sem position, adiciona ao final. Aceita também os argumentos antigos item/content/settings.",
      securitySchemes,
      inputSchema: { type: "object", required: ["stepId"], properties: { stepId: { type: "string" }, block: blockSchema, item: { type: "string", enum: BLOCK_TYPES }, type: { type: "string", enum: BLOCK_TYPES }, blockType: { type: "string", enum: BLOCK_TYPES }, content: { type: "string" }, settings: { type: "object" } } },
    },
    {
      name: "izquiz_create_step_block",
      description: "Alias compatível com izquiz_create_block. Recebe block:{type,properties,position?} ou os argumentos antigos step_id/item/content/settings.",
      securitySchemes,
      inputSchema: { type: "object", anyOf: [{ required: ["stepId"] }, { required: ["step_id"] }], properties: { stepId: { type: "string" }, block: blockSchema, step_id: { type: "string" }, blockType: { type: "string", enum: BLOCK_TYPES }, block_type: { type: "string", enum: BLOCK_TYPES }, type: { type: "string", enum: BLOCK_TYPES }, item: { type: "string", enum: BLOCK_TYPES }, content: { type: "string" }, text: { type: "string" }, position: { type: "integer", minimum: 0 }, settings: { type: "object" } } },
    },
    {
      name: "izquiz_create_blocks",
      description: "Cria de 1 a 100 blocos numa etapa através de JSON, na ordem do array. Ideal para construir uma etapa completa de uma vez. Cada bloco é salvo no jsonb existente.",
      securitySchemes,
      inputSchema: { type: "object", required: ["stepId", "blocks"], properties: { stepId: { type: "string" }, blocks: { type: "array", minItems: 1, maxItems: 100, items: blockSchema } } },
    },
    {
      name: "izquiz_update_block",
      description: "Atualiza um bloco usando {blockId, patch:{type?,properties?}}. properties é mesclado com o JSON salvo. Aceita também item/content/settings antigos.",
      securitySchemes,
      inputSchema: { type: "object", required: ["blockId"], properties: { blockId: { type: "string" }, patch: { type: "object", properties: { type: { type: "string", enum: BLOCK_TYPES }, properties: { type: "object" } } }, item: { type: "string", enum: BLOCK_TYPES }, content: { type: "string" }, settings: { type: "object" } } },
    },
    {
      name: "izquiz_update_step_block",
      description: "Alias de izquiz_update_block. Atualiza as propriedades JSON do bloco identificado por blockId.",
      securitySchemes,
      inputSchema: { type: "object", required: ["blockId"], properties: { blockId: { type: "string" }, patch: { type: "object", properties: { type: { type: "string", enum: BLOCK_TYPES }, properties: { type: "object" } } }, properties: { type: "object" }, content: { type: "string" }, item: { type: "string", enum: BLOCK_TYPES } } },
    },
    { name: "izquiz_delete_block", description: "Remove um componente de uma etapa.", securitySchemes, inputSchema: { type: "object", required: ["blockId"], properties: { blockId: { type: "string" } } } },
    { name: "izquiz_delete_step_block", description: "Alias de izquiz_delete_block. Remove o bloco identificado por blockId.", securitySchemes, inputSchema: { type: "object", required: ["blockId"], properties: { blockId: { type: "string" } } } },
    { name: "izquiz_reorder_step_blocks", description: "Reordena todos os blocos visuais da etapa na ordem indicada. blockIds deve conter cada bloco da etapa exatamente uma vez.", securitySchemes, inputSchema: { type: "object", required: ["stepId", "blockIds"], properties: { stepId: { type: "string" }, blockIds: { type: "array", items: { type: "string" } } } } },
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
    const serviceKey = getServiceRoleKey();
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

async function getAuthorizedStep(context: McpContext, stepId: string) {
  const { data: step, error: stepError } = await context.supabase.from("funnel_steps").select("id, funnel_id").eq("id", stepId).maybeSingle();
  if (stepError) throw stepError;
  if (!step) throw new Error("Etapa não encontrada ou não autorizada");
  await getFunnel(context, step.funnel_id);
  return step;
}

async function callTool(name: string, args: Record<string, unknown>, context: McpContext) {
  if (name === "izquiz_list_funnels") {
    const { data, error: queryError } = await context.supabase.from("funnels").select("id, name, slug, status, published_at, updated_at").in("workspace_id", context.workspaceIds).order("created_at", { ascending: false });
    if (queryError) throw queryError;
    return toolText({ funnels: data ?? [] });
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
    return toolText({ ...funnel, steps: (steps ?? []).map((step) => ({ id: step.id, position: step.position, title: step.title, stepType: step.step_type, settings: step.settings, blocks: (step.step_blocks ?? []).map((block) => ({ id: block.id, position: block.position, type: block.block_type, properties: block.content })) })) });
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
  if (name === "izquiz_build_funnel") {
    const nameValue = String(args.name ?? "").trim();
    if (!nameValue) throw new Error("Informe o nome do funil");
    if (!Array.isArray(args.steps) || args.steps.length < 1 || args.steps.length > 50) throw new Error("Informe de 1 a 50 etapas");
    const workspaceId = String(args.workspaceId ?? context.workspaceIds[0]);
    if (!context.workspaceIds.includes(workspaceId)) throw new Error("Workspace não autorizado");
    const requestedSteps = args.steps.map((entry, index) => {
      const step = recordValue(entry);
      const title = String(step.title ?? "").trim();
      if (!title) throw new Error(`A etapa ${index + 1} precisa de um título`);
      const blocks = step.blocks === undefined ? [] : step.blocks;
      if (!Array.isArray(blocks) || blocks.length > 100) throw new Error(`A etapa ${index + 1} pode ter no máximo 100 blocos`);
      return { title, step_type: normalizeStepType(step.stepType ?? step.step_type), settings: recordValue(step.settings), blocks: blocks.map((value) => {
        const block = recordValue(value);
        const { type, properties } = blockProperties({ type: block.type ?? block.blockType, properties: block.properties });
        return { block_type: type, content: properties };
      }) };
    });
    const totalBlocks = requestedSteps.reduce((total, step) => total + step.blocks.length, 0);
    if (totalBlocks > 500) throw new Error("O funil pode conter no máximo 500 blocos por criação");
    const slug = String(args.slug ?? (nameValue.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `funil-${Date.now()}`)).trim();
    const { data: funnel, error: funnelError } = await context.supabase.from("funnels").insert({ workspace_id: workspaceId, name: nameValue, slug, status: "draft", settings: recordValue(args.settings) }).select("id, workspace_id, name, slug, status, settings, created_at").single();
    if (funnelError) throw funnelError;
    try {
      const createdSteps = [];
      for (let index = 0; index < requestedSteps.length; index += 1) {
        const requested = requestedSteps[index];
        const { data: step, error: stepError } = await context.supabase.from("funnel_steps").insert({ funnel_id: funnel.id, position: index, title: requested.title, step_type: requested.step_type, settings: requested.settings }).select("id, position, title, step_type, settings").single();
        if (stepError) throw stepError;
        let createdBlocks: Array<{ id: string; position: number; block_type: string; content: unknown }> = [];
        if (requested.blocks.length) {
          const rows = requested.blocks.map((block, blockIndex) => ({ step_id: step.id, position: blockIndex, block_type: block.block_type, content: block.content }));
          const { data, error: blocksError } = await context.supabase.from("step_blocks").insert(rows).select("id, position, block_type, content");
          if (blocksError) throw blocksError;
          createdBlocks = data ?? [];
        }
        createdSteps.push({ id: step.id, position: step.position, title: step.title, stepType: step.step_type, settings: step.settings, blocks: createdBlocks.map((block) => ({ id: block.id, position: block.position, type: block.block_type, properties: block.content })) });
      }
      return toolText({ funnel: { ...funnel, steps: createdSteps } });
    } catch (buildError) {
      const { error: rollbackError } = await context.supabase.from("funnels").delete().eq("id", funnel.id).eq("workspace_id", workspaceId);
      if (rollbackError) throw new Error(`Falha ao montar o funil: ${buildError instanceof Error ? buildError.message : "erro desconhecido"}. A limpeza automática também falhou; funil parcial ${funnel.id}: ${rollbackError.message}`);
      throw buildError;
    }
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
  if (name === "izquiz_delete_funnel") {
    const funnel = await getFunnel(context, String(args.funnelId ?? ""));
    const { error: deleteError } = await context.supabase.from("funnels").delete().eq("id", funnel.id).eq("workspace_id", funnel.workspace_id);
    if (deleteError) throw deleteError;
    return toolText({ deleted: true, funnelId: funnel.id });
  }
  if (name === "izquiz_list_steps") {
    await getFunnel(context, String(args.funnelId));
    const { data, error: queryError } = await context.supabase.from("funnel_steps").select("id, position, title, step_type, settings").eq("funnel_id", String(args.funnelId)).order("position");
    if (queryError) throw queryError;
    return toolText({ steps: data ?? [] });
  }
  if (name === "izquiz_list_blocks") {
    const step = await getAuthorizedStep(context, String(args.stepId));
    const { data, error: queryError } = await context.supabase.from("step_blocks").select("id, step_id, position, block_type, content").eq("step_id", step.id).order("position");
    if (queryError) throw queryError;
    return toolText({ stepId: step.id, blocks: (data ?? []).map((row) => ({ id: row.id, stepId: row.step_id, position: row.position, type: row.block_type, properties: row.content })) });
  }
  if (name === "izquiz_create_block" || name === "izquiz_create_step_block" || name === "izquiz_create_blocks") {
    const stepId = String(args.stepId ?? args.step_id ?? "").trim();
    if (!stepId) throw new Error("Informe stepId");
    const step = await getAuthorizedStep(context, stepId);
    if (name === "izquiz_create_blocks") {
      if (!Array.isArray(args.blocks) || args.blocks.length < 1 || args.blocks.length > 100) throw new Error("Informe de 1 a 100 blocos no array blocks");
      const entries = args.blocks.map((entry) => {
        const value = recordValue(entry);
        const { type, properties } = blockProperties({ type: value.type, properties: value.properties });
        return { step_id: step.id, block_type: type, content: properties };
      });
      const { data: last, error: lastError } = await context.supabase.from("step_blocks").select("position").eq("step_id", step.id).order("position", { ascending: false }).limit(1).maybeSingle();
      if (lastError) throw lastError;
      const startPosition = (last?.position ?? -1) + 1;
      const rows = entries.map((entry, index) => ({ ...entry, position: startPosition + index }));
      const { data, error: insertError } = await context.supabase.from("step_blocks").insert(rows).select("id, step_id, position, block_type, content");
      if (insertError) throw insertError;
      return toolText({ stepId: step.id, created: (data ?? []).map((row) => ({ id: row.id, stepId: row.step_id, position: row.position, type: row.block_type, properties: row.content })) });
    }
    const inputBlock = recordValue(args.block);
    const mergedArgs = { ...args, ...inputBlock, properties: inputBlock.properties ?? args.properties };
    const { type: item, properties: payload } = blockProperties(mergedArgs, true);
    let position: number;
    const requestedPositionValue = inputBlock.position ?? args.position;
    const hasRequestedPosition = requestedPositionValue !== undefined && requestedPositionValue !== null;
    if (hasRequestedPosition) {
      const requestedPosition = typeof requestedPositionValue === "number" ? requestedPositionValue : Number(requestedPositionValue);
      if (!Number.isSafeInteger(requestedPosition) || requestedPosition < 0) throw new Error("position precisa ser um inteiro igual ou maior que zero");
      const { data: blocks, error: listError } = await context.supabase.from("step_blocks").select("id, position").eq("step_id", step.id).order("position", { ascending: true });
      if (listError) throw listError;
      const orderedBlocks = blocks ?? [];
      position = Math.min(requestedPosition, orderedBlocks.length);
      if (position < orderedBlocks.length) {
        const maxPosition = orderedBlocks.reduce((max, block) => Math.max(max, Number(block.position) || 0), -1);
        const temporaryBase = maxPosition + orderedBlocks.length + 100;
        for (let index = 0; index < orderedBlocks.length; index += 1) {
          const { error: moveError } = await context.supabase.from("step_blocks").update({ position: temporaryBase + index }).eq("id", orderedBlocks[index].id);
          if (moveError) throw moveError;
        }
        for (let index = 0; index < orderedBlocks.length; index += 1) {
          const targetPosition = index < position ? index : index + 1;
          const { error: moveError } = await context.supabase.from("step_blocks").update({ position: targetPosition }).eq("id", orderedBlocks[index].id);
          if (moveError) throw moveError;
        }
      } else {
        position = orderedBlocks.length ? Number(orderedBlocks[orderedBlocks.length - 1].position) + 1 : 0;
      }
    } else {
      const { data: last, error: lastError } = await context.supabase.from("step_blocks").select("position").eq("step_id", step.id).order("position", { ascending: false }).limit(1).maybeSingle();
      if (lastError) throw lastError;
      position = (last?.position ?? -1) + 1;
    }
    const { data, error: queryError } = await context.supabase.from("step_blocks").insert({ step_id: step.id, position, block_type: item, content: payload }).select("id, step_id, position, block_type, content").single();
    if (queryError) throw queryError;
    return toolText({ block: { id: data.id, stepId: data.step_id, position: data.position, type: data.block_type, properties: data.content } });
  }
  if (name === "izquiz_update_block" || name === "izquiz_update_step_block") {
    const blockId = String(args.blockId ?? args.stepBlockId ?? "").trim();
    if (!blockId) throw new Error("Informe blockId");
    const { data: existing, error: blockError } = await context.supabase.from("step_blocks").select("id, step_id, block_type, content").eq("id", blockId).maybeSingle();
    if (blockError) throw blockError;
    if (!existing) throw new Error("Componente não encontrado ou não autorizado");
    await getAuthorizedStep(context, existing.step_id);
    const previous = existing.content && typeof existing.content === "object" && !Array.isArray(existing.content) ? existing.content as Record<string, unknown> : {};
    const requestedPatch = recordValue(args.patch);
    const properties = { ...previous, ...recordValue(args.settings), ...recordValue(requestedPatch.properties), ...recordValue(args.properties), ...(typeof args.content === "string" ? { content: args.content } : {}) };
    const patch: Record<string, unknown> = { content: properties };
    const requestedType = requestedPatch.type ?? args.item;
    if (typeof requestedType === "string" && requestedType.trim()) patch.block_type = normalizeBlockType(requestedType);
    const { data, error: queryError } = await context.supabase.from("step_blocks").update(patch).eq("id", existing.id).select("id, step_id, position, block_type, content").single();
    if (queryError) throw queryError;
    return toolText({ block: { id: data.id, stepId: data.step_id, position: data.position, type: data.block_type, properties: data.content } });
  }
  if (name === "izquiz_delete_block" || name === "izquiz_delete_step_block") {
    const blockId = String(args.blockId ?? args.stepBlockId ?? "").trim();
    if (!blockId) throw new Error("Informe blockId");
    const { data: existing, error: blockError } = await context.supabase.from("step_blocks").select("id, step_id").eq("id", blockId).maybeSingle();
    if (blockError) throw blockError;
    if (!existing) throw new Error("Componente não encontrado ou não autorizado");
    await getAuthorizedStep(context, existing.step_id);
    const { error: deleteError } = await context.supabase.from("step_blocks").delete().eq("id", existing.id);
    if (deleteError) throw deleteError;
    return toolText({ deleted: true, blockId: existing.id });
  }
  if (name === "izquiz_reorder_step_blocks") {
    const step = await getAuthorizedStep(context, String(args.stepId ?? ""));
    const blockIds = Array.isArray(args.blockIds) ? args.blockIds.map(String) : [];
    const { data: blocks, error: blocksError } = await context.supabase.from("step_blocks").select("id, position").eq("step_id", step.id).order("position");
    if (blocksError) throw blocksError;
    const current = blocks ?? [];
    if (blockIds.length !== current.length || new Set(blockIds).size !== current.length || blockIds.some((id) => !current.some((block) => block.id === id))) {
      throw new Error("blockIds precisa conter todos os blocos desta etapa exatamente uma vez");
    }
    const highestPosition = current.reduce((max, block) => Math.max(max, Number(block.position) || 0), -1);
    const temporaryBase = highestPosition + current.length + 100;
    for (let index = 0; index < blockIds.length; index += 1) {
      const { error: moveError } = await context.supabase.from("step_blocks").update({ position: temporaryBase + index }).eq("id", blockIds[index]);
      if (moveError) throw moveError;
    }
    for (let index = 0; index < blockIds.length; index += 1) {
      const { error: moveError } = await context.supabase.from("step_blocks").update({ position: index }).eq("id", blockIds[index]);
      if (moveError) throw moveError;
    }
    return toolText({ stepId: step.id, blockIds, message: "Blocos reordenados" });
  }
  if (name === "izquiz_create_step") {
    const funnel = await getFunnel(context, String(args.funnelId));
    const { data: last } = await context.supabase.from("funnel_steps").select("position").eq("funnel_id", funnel.id).order("position", { ascending: false }).limit(1).maybeSingle();
    const { data, error: queryError } = await context.supabase.from("funnel_steps").insert({ funnel_id: funnel.id, position: (last?.position ?? -1) + 1, title: String(args.title), step_type: normalizeStepType(args.stepType) }).select("id, position, title, step_type").single();
    if (queryError) throw queryError;
    return toolText(data);
  }
  if (name === "izquiz_delete_step") {
    const step = await getAuthorizedStep(context, String(args.stepId ?? ""));
    const { error: deleteError } = await context.supabase.from("funnel_steps").delete().eq("id", step.id);
    if (deleteError) throw deleteError;
    return toolText({ deleted: true, stepId: step.id });
  }
  if (name === "izquiz_update_step") {
    const { data: step, error: stepError } = await context.supabase.from("funnel_steps").select("id, funnel_id").eq("id", String(args.stepId)).maybeSingle();
    if (stepError) throw stepError;
    if (!step) throw new Error("Etapa não encontrada ou não autorizada");
    await getFunnel(context, step.funnel_id);
    const patch: Record<string, unknown> = {};
    if (typeof args.title === "string") patch.title = args.title;
    if (typeof args.stepType === "string") patch.step_type = normalizeStepType(args.stepType);
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
  if (body.method === "initialize") return result(body.id, { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: "izquiz-mcp", version: MCP_SERVER_VERSION } });
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
export async function GET() { return response({ name: "izquiz-mcp", version: MCP_SERVER_VERSION, endpoint: "/mcp", message: "Use POST para o transporte MCP Streamable HTTP.", tools: tools().map((tool) => tool.name) }, 200); }
export async function POST(request: Request) { try { return await handle(request); } catch { return response({ error: "Requisição MCP inválida" }, 400); } }
export async function DELETE() { return response({ message: "Sessões stateless não precisam ser encerradas." }, 200); }
