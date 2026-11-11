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
SUPABASE_SERVICE_ROLE_KEY=chave_secreta_do_supabase
IZQUIZ_MCP_TOKEN=token_privado_longo_e_aleatorio
IZQUIZ_MCP_USER_ID=uuid_do_usuario_dono
MCP_PUBLIC_URL=https://izquiz.stuffshub.com/mcp
SUPABASE_AUTH_ISSUER=https://seu-projeto.supabase.co/auth/v1
```

O `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposto ao navegador. O endpoint aceita tokens OAuth emitidos pelo Supabase Auth e aplica as políticas RLS do usuário autenticado. O token privado e o `IZQUIZ_MCP_USER_ID` ficam disponíveis apenas como fallback para testes internos.

### Estado da integração com o ChatGPT

O endpoint agora publica `/.well-known/oauth-protected-resource` e a tela `/oauth/consent` para o OAuth 2.1 do Supabase Auth. No painel do Supabase, habilite `Authentication > OAuth Server`, use `https://izquiz.stuffshub.com` como Site URL, mantenha `/oauth/consent` como Authorization Path, habilite o registro dinâmico de clientes e confirme que o projeto usa chaves JWT assimétricas. Depois configure `SUPABASE_AUTH_ISSUER` com `https://<project-ref>.supabase.co/auth/v1`.

O ChatGPT poderá descobrir o provedor, solicitar login/consentimento usando a conta existente do Izquiz e chamar as ferramentas com o usuário correto, sem compartilhar uma chave de serviço.

Documentação oficial: [MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) e [autenticação de plugins](https://developers.openai.com/plugins/build/auth).
