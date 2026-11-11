This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## MCP do Izquiz

O endpoint MCP fica em `/mcp` e expõe ferramentas para administrar funis, etapas e métricas do workspace autorizado.

Para habilitá-lo no servidor, configure no ambiente de produção:

```env
IZQUIZ_MCP_TOKEN=token_privado_longo_e_aleatorio
IZQUIZ_MCP_USER_ID=uuid_do_usuario_dono
MCP_PUBLIC_URL=https://izquiz.stuffshub.com/mcp
```

Em produção, o GitHub Actions conecta à VPS por SSH, cria uma versão do secret do Supabase no Docker Swarm e publica a stack com `docker stack deploy`. O secret é montado em `/run/secrets/supabase_service_role_key`; a chave não vai para a imagem nem para o arquivo `.env.production`. Para desenvolvimento local, `SUPABASE_SERVICE_ROLE_KEY` pode continuar vindo do `.env.local`.

Configure os seguintes secrets em **Settings > Secrets and variables > Actions** no GitHub:

- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` e `VPS_DEPLOY_PATH` para acesso e pasta de deploy na VPS. `VPS_PORT` é opcional e assume `22`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- `IZQUIZ_MCP_TOKEN` e `IZQUIZ_MCP_USER_ID` são opcionais e servem apenas para o acesso de fallback do MCP.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` é opcional.
- `PORTAINER_API_KEY` e `PORTAINER_WEBHOOK_URL` não são usados por esse deploy.

Também é possível definir as variables `NEXT_PUBLIC_APP_DOMAIN` e `MCP_PUBLIC_URL`; por padrão, usam `izquiz.stuffshub.com` e `https://izquiz.stuffshub.com/mcp`.

Se a stack atual do Izquiz estiver conectada ao GitOps do Portainer, desative a atualização automática dela uma única vez para que ela não sobrescreva o deploy direto do Actions. Depois disso, o fluxo de publicação não depende de abrir o Portainer.

O `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposto ao navegador. O emissor OAuth é inferido de `NEXT_PUBLIC_SUPABASE_URL` como `/auth/v1`; `SUPABASE_AUTH_ISSUER` só precisa ser definido se o issuer for diferente. O endpoint aceita tokens OAuth emitidos pelo Supabase Auth e aplica as políticas RLS do usuário autenticado. O token privado e o `IZQUIZ_MCP_USER_ID` ficam disponíveis apenas como fallback para testes internos.

### Estado da integração com o ChatGPT

O endpoint publica `/.well-known/oauth-protected-resource` e a tela `/oauth/consent` para o OAuth 2.1 do Supabase Auth. No painel do Supabase, habilite `Authentication > OAuth Server`, use `https://izquiz.stuffshub.com` como Site URL, mantenha `/oauth/consent` como Authorization Path, habilite o registro dinâmico de clientes e confirme que o projeto usa chaves JWT assimétricas.

O ChatGPT poderá descobrir o provedor, solicitar login/consentimento usando a conta existente do Izquiz e chamar as ferramentas com o usuário correto, sem compartilhar uma chave de serviço.

Documentação oficial: [MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) e [autenticação de plugins](https://developers.openai.com/plugins/build/auth).
