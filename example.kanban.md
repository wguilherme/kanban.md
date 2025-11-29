# Testing Checklist - Markdown Kanban

## 📋 Task Format & Parsing

### Tags inline (hashtag): `#tag1 #tag2`

### Tags array format: `- tags: [tag1, tag2]`

### Tags com caracteres especiais: `#test@#$%`

### Tags com unicode: `#unicode-✓`

### Tags com números: `#numbers123`

### Múltiplas tags (5+) exibidas corretamente

### Tags aparecem como badges coloridos

### ✅ Priority

### Priority High (🔴)

### Priority Medium (🟡)

### Priority Low (🟢)

### Priority exibida visualmente no card

### Inline format: `**Priority:** High`

### Structured format: `- priority: high`

### ✅ Workload

### Workload Easy (🟢)

### Workload Normal (🟡)

### Workload Hard (🔴)

### Workload Extreme (🔴🔴)

### Workload exibida visualmente no card

### Inline format: `**Workload:** Hard`

### Structured format: `- workload: Hard`

### ✅ Due Date

### Due date format: `**Due:** 2024-12-31`

### Due date format: `- due: 2024-12-31`

### Due date exibida no card

### Due date em formato YYYY-MM-DD

### ✅ Steps/Subtasks

### Steps não completados: `- [ ] Step text`

### Steps completados: `- [x] Step text`

### Múltiplos steps em uma task

### Structured format com indentação correta

### Checkbox visual funciona

### Progresso visual (ex: 2/5 completos)

### ✅ Task Description

### Descrição multi-linha

### Markdown na descrição: **bold**

### Markdown na descrição: _italic_

### Bullet points na descrição

### Code block description: ` ```md ... ``` `

### Descrição longa (100+ chars)

### ✅ defaultExpanded

### Task com `defaultExpanded: true` abre automaticamente

### Task com `defaultExpanded: false` fica fechada

### Inline format: `**defaultExpanded:** true`

### Structured format: `- defaultExpanded: true`

### ✅ Modern Structured Format

### Todas propriedades com indentação `- property: value`

### Steps com indentação `- [ ] step`

### Code block description dentro do formato

### Parse correto de todas propriedades

### Sync bidirecional mantém o formato

### ✅ Classic Inline Format

### Properties com `**Property:** value`

### Tags com hashtags

### Descrição como texto normal

### Parse correto

### Sync bidirecional mantém o formato

## 🖱️ Drag & Drop

### ✅ Tags

### ✅ Mesma Coluna

### Arrastar para cima (reordenar)

### Arrastar para baixo (reordenar)

### Arrastar para primeira posição

### Arrastar para última posição

### Arrastar entre tasks (posição intermediária)

### Animação suave durante drag

### Estado persiste após soltar

### ✅ Entre Colunas

### Arrastar de "To Do" para "In Progress"

### Arrastar de "In Progress" para "Done"

### Arrastar de "Done" para "To Do"

### Arrastar para primeira posição em outra coluna

### Arrastar para última posição em outra coluna

### Arrastar entre tasks em outra coluna

### Estado persiste corretamente

### ✅ Visual Feedback

### Task fica com opacity 30% enquanto arrasta

### Task tem scale 95% enquanto arrasta

### Coluna destino tem ring border quando hover

### Coluna destino tem scale 1.02 quando hover

### Badge "Drop here" aparece quando hover

### Badge "Drop here" tem animate-pulse

### DragOverlay mostra preview da task

### Sem flickering durante drag

### Cursor muda para grab/grabbing

### ✅ Edge Cases

### Arrastar e soltar na mesma posição (nada acontece)

### Arrastar fora de colunas (cancela)

### Arrastar em coluna vazia (coloca como primeiro)

### Arrastar múltiplas vezes seguidas (sem bugs)

## 🎨 Theme & UI

### ✅ VSCode Theme Integration

### Dracula theme - cores roxas

### One Dark Pro - cores azuis

### Light themes - cores claras

### Todas cores usam variáveis CSS do VSCode

### Badges respeitam tema

### Borders respeitam tema

### Backgrounds respeitam tema

### ✅ Badge Colors

### Badge default: usa badge-bg/fg do tema

### Badge success: usa testing-iconPassed (verde)

### Badge warning: usa notificationsWarningIcon (amarelo)

### Badge error: usa testing-iconFailed (vermelho)

### Badge info: usa notificationsInfoIcon (azul)

### ✅ "Drop Here" Button

### Background usa activityBarBadge-background (cor primária)

### No Dracula: roxo (#bd93f9)

### Texto usa button-foreground

### Borda arredondada

### Animate pulse

### ✅ Column Highlighting

### Background muda para list-hoverBg quando hover

### Ring border (2px) com focusBorder

### Shadow-lg aparece

### Scale 1.02 suave

### Transição de 200ms

### ✅ Task Cards

### Border padrão: input-border

### Border hover: button-bg

### Border dragging: focusBorder

### Background: vscode-background

### Padding consistente

### Border radius suave

## 🗂️ Sidebar

### ✅ Activity Bar

### Ícone do Kanban aparece na barra esquerda

### Ícone correto (list-tree)

### Título "Markdown Kanban"

### Clique abre sidebar

### ✅ TreeView

### Lista todos arquivos `.kanban.md` do workspace

### Arquivos aparecem ordenados

### Ícone de arquivo correto

### Clique abre o kanban board

### Auto-refresh quando arquivo criado

### Auto-refresh quando arquivo deletado

### Auto-refresh quando arquivo renomeado

### ✅ Botões da Sidebar

### Botão "➕ New Kanban Board" aparece

### Clique abre input para nome

### Nome válido cria arquivo `.kanban.md`

### Arquivo criado com template padrão

### Arquivo abre automaticamente

### Botão "Refresh" (🔄) aparece

### Clique no Refresh atualiza lista

### ✅ Context Menu

### Botão "Open Preview" (inline) em cada arquivo

### Clique abre kanban board

### Ícone correto (open-preview)

## 🔄 Real-time Sync

### ✅ Markdown → Kanban

### Editar tag no .md atualiza kanban

### Editar priority no .md atualiza kanban

### Adicionar task no .md aparece no kanban

### Deletar task no .md remove do kanban

### Mover task entre colunas no .md atualiza

### Editar título atualiza

### Editar descrição atualiza

### ✅ Kanban → Markdown

### Arrastar task atualiza .md

### Editar task no kanban atualiza .md

### Adicionar task no kanban atualiza .md

### Deletar task no kanban atualiza .md

### Mudanças salvam automaticamente

### Formato do .md preservado

## 🔍 Filter & Sort

### ✅ Tag Filtering

### Filter box aparece no topo

### Digitar tag filtra tasks

### Múltiplas tags separadas por vírgula: `tag1,tag2`

### Filtragem case-insensitive

### Tasks sem tags desaparecem ao filtrar

### Clear filter mostra todas tasks

### ✅ Sort Options

### Dropdown de sort aparece

### Sort by Task Name (A-Z)

### Sort by Due Date (mais próximo primeiro)

### Sort by Priority (High → Low)

### Sort by Workload (Extreme → Easy)

### "None" remove ordenação

### Sort persiste durante sessão

### ✅ Clear Filters

### Botão "Clear Filters" aparece

### Clique remove todos filtros

### Clique reseta sort para "None"

### Todas tasks voltam a aparecer

## 📁 Column Management

### ✅ Hide/Show Columns

### Botão "eye" icon no header da coluna

### Clique esconde coluna

### Coluna escondida não aparece

### Tasks da coluna escondida não aparecem

### Botão "Manage Columns" aparece

### Input para número da coluna

### Coluna volta a aparecer

### Tasks da coluna voltam

### ✅ Reorder Columns

### Arrastar header da coluna

### Coluna move de posição

### Tasks permanecem na coluna

### Ordem persiste no .md

### Visual feedback durante drag

### ✅ Archive Columns

### Coluna com `[Archived]` no título

### Parse correto do archived flag

### Visual indicator de archived

### Tasks de coluna archived aparecem

### Sync mantém flag [Archived]

## ⚙️ Commands & Settings

### ✅ Commands

### Command: "Markdown Kanban: Kanban"

### Command: "Enable/Disable File Switcher"

### Command: "New Kanban Board"

### Command: "Refresh"

### Todos comandos aparecem no Command Palette

### Category "Markdown Kanban" correta

### ✅ File Switcher

### Toggle funciona

### Enabled: troca arquivo ao clicar task

### Disabled: não troca arquivo

### Setting persiste

### ✅ Task Header Format

### Setting: `markdown-kanban.taskHeader`

### Opção "title": usa `### Task`

### Opção "list": usa `- Task`

### Novo arquivo criado usa setting

### Parse funciona para ambos

### Sync mantém formato escolhido

## 🧪 Edge Cases & Validation

### ✅ Empty States

### Board sem colunas: mensagem adequada

### Coluna sem tasks: área vazia funcional

### Task sem tags: nenhum badge aparece

### Task sem priority: sem indicator

### Task sem descrição: só título

### ✅ Long Content

### Título muito longo (100+ chars)

### Descrição muito longa (1000+ chars)

### 50+ tags em uma task

### 50+ tasks em uma coluna

### 10+ colunas

### Scroll funciona corretamente

### ✅ Special Characters

### Tags com @, #, $, %, ✓

### Título com emojis 🎯🚀

### Descrição com Markdown complexo

### Título com caracteres unicode

### Tags com hífens e underscores

### ✅ Error Handling

### Arquivo .md inválido

### Syntax errors no markdown

### Arquivo vazio

### Arquivo muito grande (10MB+)

### Permissões de arquivo

### ✅ Performance

### 100+ tasks sem lag

### Drag & drop suave

### Scroll suave

### Sem memory leaks

### Build size razoável (~250KB)

## 🎯 Integration Tests

### ✅ VSCode Integration

### Extension ativa ao abrir .md

### Extension ativa ao comando

### Webview abre corretamente

### CSP não bloqueia recursos

### Assets carregam (CSS, JS, fonts)

### Console sem erros

### ✅ File System

### Leitura de arquivos funciona

### Escrita de arquivos funciona

### Watch de arquivos funciona

### Auto-save funciona

### Múltiplos arquivos abertos

### ✅ State Management

### Estado local atualiza

### Backend recebe mensagens

### Sync funciona

### Sem race conditions

### Sem state conflicts

## 📊 Resumo por Categoria

### Backend/Parser (src/markdownParser.ts)

### Parse tags inline ✅ IMPLEMENTADO

### Parse tags array ✅ JÁ EXISTIA

### Parse priority ✅ JÁ EXISTIA

### Parse workload ✅ JÁ EXISTIA

### Parse due date ✅ JÁ EXISTIA

### Parse steps ✅ JÁ EXISTIA

### Parse defaultExpanded ✅ JÁ EXISTIA

### Parse description ✅ JÁ EXISTIA

### Generate markdown ✅ JÁ EXISTIA

### Frontend/React (src/webview/)

### Drag & drop ✅ IMPLEMENTADO

### Theme colors ✅ IMPLEMENTADO

### Tag badges ✅ JÁ EXISTIA

### Visual feedback ✅ IMPLEMENTADO

### DragOverlay ✅ IMPLEMENTADO

### Extension (src/)

### Sidebar TreeView ✅ JÁ EXISTIA

### New board command ✅ JÁ EXISTIA

### Webview panel ✅ JÁ EXISTIA

### File watcher ✅ JÁ EXISTIA

### Commands ✅ JÁ EXISTIA

## 🐛 Known Issues to Test

### Flickering durante drag → CORRIGIDO

### Tags inline não funcionavam → CORRIGIDO

### Cores hardcoded → CORRIGIDO

### Primeiro/último item bug → CORRIGIDO

## ✅ Tested & Working

### Task Format: ~40 items

### Drag & Drop: ~25 items

### Theme & UI: ~25 items

### Sidebar: ~15 items

### Sync: ~15 items

### Filter & Sort: ~15 items

### Column Management: ~10 items

### Commands: ~10 items

### Edge Cases: ~20 items
