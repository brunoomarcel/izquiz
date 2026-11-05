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
- [~] Botão — configurações e navegação funcionando; abas Design/Teste A/B ainda aguardam referência visual.
  - [x] Receber referência visual da aba Geral do DeskFunnel.
  - [ ] Receber referências das abas Design e Teste A/B.
- [x] Opções — alternativas, seleção, estilo e ação da resposta.
  - [x] Analisar referência visual e painel de propriedades.
  - [x] Criar `OptionsBlock` com lista de opções e ações básicas.
  - [x] Criar painel de configurações com layout, direção, animação e múltipla escolha.
  - [x] Adicionar imagem e navegação por opção.
  - [x] Implementar aba Design completa.
- [~] Formulário — campos, labels, validação e armazenamento das respostas; Design ainda aguarda referência visual.
  - [x] Criar `FormBlock` com título, campos Nome/E-mail e botão Enviar.
  - [x] Criar painel de propriedades com campos editáveis, tipos, placeholders e obrigatoriedade.
  - [x] Implementar alinhamento, largura, texto do botão e ação após envio.
  - [ ] Implementar aba Design completa.
- [~] Área de Texto — placeholder, tamanho e envio da resposta; Design ainda aguarda referência visual.
  - [x] Criar `TextareaBlock` com label, placeholder, ajuda e botão.
  - [x] Criar painel de propriedades com obrigatoriedade, largura, alinhamento e navegação.
  - [ ] Implementar aba Design completa.
- [~] Vídeo — plataformas, incorporação e pré-visualização básica funcionando; Design ainda aguarda referência visual.
- [x] Argumentos — conteúdo, imagens, quantidade de itens, layout e design.
  - [x] Receber referências do canvas, configurações, edição, seletor de imagem e Design.
  - [x] Implementar componente e persistência.
- [x] Alerta — título, ícone, alinhamento, largura e Design.
  - [x] Receber referências do canvas, Configurações e Design.
  - [x] Implementar componente e persistência.
- [x] FAQ — perguntas, respostas expandidas e edição.
  - [x] Receber referências do canvas, Configurações e Design.
  - [x] Implementar componente e persistência.
- [x] Depoimentos — texto, autor, imagem, avaliação e navegação.
  - [x] Receber referências do canvas, Configurações e Design.
  - [x] Implementar componente, edição de itens, autoplay, paginação e persistência.
- [x] Áudio — estilo WhatsApp, waveform, avatar, upload, duração e autoplay.
- [x] Carrossel — imagens, navegação e intervalo.
  - [x] Receber referências do canvas, Configurações e Design.
  - [x] Implementar componente, navegação, autoplay, edição de itens e persistência.
- [x] Antes/Depois — título opcional, imagens, divisor interativo, rótulos e Design.
- [x] Loading — padrão com barra/progresso e Multi-Step com estados, duração, loop, navegação e sobreposição fullscreen escura/desfocada.
- [x] Timer e Delay — configuração e prévia no editor; Delay com tempo em segundos, aviso e card informativo.
- [x] Notificação e Script — largura alinhada aos demais elementos, conteúdo, tipo/trigger, posições Padrão/Topo/Centro/Rodapé, duração com barra regressiva e remoção ao finalizar, Design e prévia segura.
- [x] Elementos de Dados — Nível com componente próprio, título, subtítulo, largura, alinhamento, porcentagem, indicador, legendas e Design; demais dados com valor, unidade e barra.
- [x] Gamificação e Mapa Corporal — pontuação, meta e prévia visual.
- [x] Planos — título, cards de planos e prévia de seleção.

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
- [x] Adicionar cadeado visual aos componentes ainda não implementados.
- [x] Corrigir conflito de CSS que impedia o layout de Argumentos de alternar entre 1, 2, 3 e 4 colunas.

Legenda: `[x]` completo, `[~]` parcialmente implementado, `[ ]` pendente.

## Varredura da paleta

- [x] Funcionais: Texto, Imagem, Botão básico, Vídeo básico, Opções, Formulário, Área de Texto, Argumentos, Alerta, FAQ, Carrossel e Depoimentos.
- [~] Parciais: Botão (Design/Teste A/B), Vídeo (Design), Formulário (Design), Área de Texto (Design).
- [ ] Bloqueados com cadeado: nenhum dos elementos simples restantes; os componentes liberados usam configuração genérica até receber referência visual específica.

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
- [ ] Referências visuais específicas ainda necessárias: Botão — Design/Teste A/B; Vídeo — Design; Formulário — Design; Área de Texto — Design; Dados, Gamificação, Mapa Corporal e Planos.
- [x] Menu de propriedades do Botão — aba Geral.
- [ ] Menu de propriedades do Botão — abas Design e Teste A/B.
- [ ] Menu de propriedades de Opções.
- [x] Menu de propriedades de Opções — configurações e editor de imagens.
