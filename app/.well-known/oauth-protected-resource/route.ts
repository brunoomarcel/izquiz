const defaultDomain = "https://izquiz.stuffshub.com";

export const dynamic = "force-dynamic";

export async function GET() {
  const resource = process.env.MCP_PUBLIC_URL ?? `${defaultDomain}/mcp`;
  const authorizationServer = process.env.SUPABASE_AUTH_ISSUER;
  if (!authorizationServer) {
    return Response.json({ error: "SUPABASE_AUTH_ISSUER não configurado" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ resource, authorization_servers: [authorizationServer], scopes_supported: ["openid", "email", "profile"], resource_documentation: `${defaultDomain}/mcp` }, { headers: { "Cache-Control": "no-store" } });
}
