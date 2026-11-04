<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Regras do projeto izquiz

- Preserve o idioma da interface em português do Brasil.
- Antes de criar um novo elemento do funil, confira o `CHECKLIST.md` e atualize seu status.
- Cada elemento do funil deve ter um componente React exclusivo em `components/editor/`.
- Evite concentrar a renderização de elementos em `app/page.tsx`; use componentes e props bem definidos.
- Preserve o comportamento existente ao refatorar elementos já funcionais.
- Elementos novos devem suportar seleção no canvas, edição no painel de propriedades e persistência quando aplicável.
- Use os tipos compartilhados de `components/editor/types.ts` para os blocos do canvas.
- Após alterações, execute `npm.cmd run lint` e corrija erros antes de finalizar.
- Não coloque chaves, tokens ou valores de `.env.local` no código ou em arquivos versionáveis.
