# Checklist do izquiz

## Arquitetura

- [x] Separar Texto em componente próprio (`TextBlock`).
- [x] Separar Imagem em componente próprio (`ImageBlock`).
- [x] Separar Botão em componente próprio (`ButtonBlock`).
- [x] Criar `BlockRenderer` para os elementos extraídos.
- [ ] Extrair os demais elementos de `app/page.tsx` para `components/editor/`.
- [ ] Manter tipos de cada elemento bem definidos em `components/editor/types.ts`.

## Elementos do funil

- [x] Texto — edição inline, tamanho, negrito, itálico e sublinhado.
- [x] Imagem — seleção, alinhamento, largura e altura.
- [ ] Botão — revisar visual, abas Geral/Design/Teste A/B e navegação.
  - [x] Receber referência visual da aba Geral do DeskFunnel.
  - [ ] Receber referências das abas Design e Teste A/B.
- [ ] Opções — alternativas, seleção, estilo e ação da resposta.
  - [x] Analisar referência visual e painel de propriedades.
  - [x] Criar `OptionsBlock` com lista de opções e ações básicas.
  - [x] Criar painel de configurações com layout, direção, animação e múltipla escolha.
  - [x] Adicionar imagem e navegação por opção.
  - [ ] Implementar aba Design completa.
- [ ] Formulário — campos, labels, validação e armazenamento das respostas.
  - [x] Criar `FormBlock` com título, campos Nome/E-mail e botão Enviar.
  - [x] Criar painel de propriedades com campos editáveis, tipos, placeholders e obrigatoriedade.
  - [x] Implementar alinhamento, largura, texto do botão e ação após envio.
  - [ ] Implementar aba Design completa.
- [ ] Área de Texto — placeholder, tamanho e armazenamento da resposta.
  - [x] Criar `TextareaBlock` com label, placeholder, ajuda e botão.
  - [x] Criar painel de propriedades com obrigatoriedade, largura, alinhamento e navegação.
  - [ ] Implementar aba Design completa.
- [ ] Vídeo — plataformas, incorporação e pré-visualização.
- [ ] Argumentos — conteúdo, imagens e quantidade de itens.
- [ ] Alerta — título, ícone, alinhamento e largura.
- [ ] FAQ — perguntas, respostas expandidas e edição.
- [ ] Depoimentos — texto, autor e imagem.
- [ ] Áudio — arquivo, controles e prévia.
- [ ] Carrossel — imagens, navegação e intervalo.
- [ ] Antes/Depois — imagens e controle deslizante.
- [ ] Loading, Timer e Delay — configuração e comportamento no quiz.
- [ ] Notificação e Script — conteúdo, disparo e segurança.
- [ ] Elementos de Dados — Nível, Peso, Altura, IMC, Idade, Tendência e Evolutivo.
- [ ] Gamificação e Mapa Corporal.
- [ ] Planos e Checkout.

## Editor

- [x] Adicionar elemento por clique ou arrastar e soltar.
- [x] Selecionar, mover, duplicar e excluir elemento.
- [x] Fechar menu de ações ao clicar fora ou pressionar `Esc`.
- [ ] Melhorar estados de hover, foco e seleção.
- [ ] Revisar responsividade do canvas.
- [ ] Implementar preview fiel do funil publicado.

## Ajustes de interface concluídos

- [x] Corrigir fechamento do menu de ações ao clicar fora ou pressionar `Esc`.
- [x] Substituir ícones Unicode problemáticos por SVGs funcionais.
- [x] Corrigir emojis/imagens das opções para fundo transparente.
- [x] Manter opção selecionada visualmente no canvas.
- [x] Ajustar painel lateral para terminar com o conteúdo, sem espaço vertical infinito.
- [x] Adicionar aba Design das Opções.
- [x] Ajustar o seletor de imagens com abas Arquivos, URL, Enviar e Emoji.

## Persistência e publicação

- [x] Cache local dos documentos do editor.
- [x] Carregamento de funis e etapas pelo Supabase.
- [ ] Persistir todas as propriedades específicas de cada elemento.
- [ ] Validar publicação e visualização pública do funil.
- [ ] Testar recuperação após recarregar a página.

## Validação

- [ ] Executar `npm.cmd run lint` sem warnings.
- [ ] Executar `npm.cmd run build`.
- [ ] Testar os elementos no navegador em desktop e mobile.
- [ ] Conferir os elementos com os prints de referência enviados.

## Referências recebidas

- [x] Lista de componentes do funil.
- [x] Menu de propriedades do Botão — aba Geral.
- [ ] Menu de propriedades do Botão — abas Design e Teste A/B.
- [ ] Menu de propriedades de Opções.
- [x] Menu de propriedades de Opções — configurações e editor de imagens.
