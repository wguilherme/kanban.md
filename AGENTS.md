# Agents Code Instructions

## Base Prompt

Para qualquer feature, refactor ou alteração na base de código (exceto tarefas triviais/chores), seguir obrigatoriamente o processo definido em:

**[docs/agents/prompts/base.prompt.md](docs/agents/prompts/base.prompt.md)**

### Resumo do Processo (TDD)

1. Analisar se a feature/alteração faz sentido com a base atual
2. Escrever teste unitário primeiro (TDD) - deixar falhar
3. Implementar seguindo clean code, atomic design, estrutura existente
4. Rodar testes até passar
5. Atualizar README/documentação se necessário
6. Registrar no CHANGELOG (exceto triviais)
7. Revisão geral antes de submeter

---

## Arquitetura do Projeto

### Tech Stack

- **VS Code Extension:** TypeScript, VS Code Extension API
- **Webview:** React 19 + Vite + Tailwind CSS
- **Testes:** Vitest + Testing Library
- **Design:** Atomic Design para componentes
- **Build:** Vite (extension + webview separados)

### Estrutura de Diretórios

```text
markdown-kanban/
├── src/
│   ├── extension.ts              # Entry point da extensão VS Code
│   ├── kanbanWebviewPanel.ts     # Gerenciador do painel webview + comunicação
│   ├── kanbanTreeProvider.ts     # Sidebar tree view provider
│   ├── markdownParser.ts         # Parser bidirecional markdown ↔ board
│   ├── templates/
│   │   └── kanbanTemplate.ts     # Template padrão de novo board
│   └── webview/
│       ├── App.tsx               # Componente React root
│       ├── main.tsx              # Entry point do webview
│       ├── hooks/
│       │   ├── useVSCodeApi.ts   # Wrapper da API de mensagens VS Code
│       │   └── useKanbanBoard.ts # Hook principal de state management
│       ├── components/
│       │   ├── KanbanBoard/      # Board principal + drag-drop
│       │   │   ├── KanbanBoard.tsx
│       │   │   ├── Column.tsx
│       │   │   ├── SortableTask.tsx
│       │   │   └── TaskCard.tsx
│       │   ├── TaskModal.tsx     # Modal de detalhes da task
│       │   └── atoms/            # Componentes UI reutilizáveis
│       ├── types/
│       │   └── kanban.ts         # Definições TypeScript
│       └── __tests__/            # Testes unitários
├── vite.config.ts                # Build config da extension
├── vite.webview.config.ts        # Build config do webview
└── dist/
    ├── extension.js              # Extension compilada
    └── webview/                  # Webview compilado (React bundle)
```

---

## Integração Extension ↔ Webview ↔ Markdown

### Fluxo de Comunicação

```text
┌─────────────────────────────────────────────────────────────────┐
│                         VS Code                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  extension.ts   │◄──►│kanbanWebviewPanel│◄──►│MarkdownFile│ │
│  │  (activation)   │    │  (message hub)   │    │ (.kanban.md)│ │
│  └─────────────────┘    └────────┬─────────┘    └─────────────┘ │
│                                  │                               │
│                          postMessage()                           │
│                                  │                               │
│  ┌───────────────────────────────▼───────────────────────────┐  │
│  │                      WEBVIEW (iframe)                      │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐   │  │
│  │  │  useVSCodeApi   │◄──►│      useKanbanBoard         │   │  │
│  │  │ (message layer) │    │ (state + optimistic updates)│   │  │
│  │  └─────────────────┘    └──────────────┬──────────────┘   │  │
│  │                                        │                   │  │
│  │  ┌─────────────────────────────────────▼───────────────┐  │  │
│  │  │              KanbanBoard (React + dnd-kit)          │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │  │
│  │  │  │ Column  │  │ Column  │  │ Column  │              │  │  │
│  │  │  │┌───────┐│  │┌───────┐│  │┌───────┐│              │  │  │
│  │  │  ││Task   ││  ││Task   ││  ││Task   ││              │  │  │
│  │  │  │└───────┘│  │└───────┘│  │└───────┘│              │  │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Protocolo de Mensagens

**Extension → Webview:**

```typescript
{ type: 'updateBoard', board: KanbanBoard }
{ type: 'toggleTaskExpansion', taskId: string }
```

**Webview → Extension:**

```typescript
{
  type: "webviewReady";
}
{
  type: "moveTask", taskId, fromColumnId, toColumnId, newIndex;
}
{
  type: "updateTask", taskId, updates;
}
{
  type: "addTask", columnId, taskData;
}
{
  type: "deleteTask", taskId, columnId;
}
```

---

## Sistema Anti-Flickering (Queue + Fingerprint)

### O Problema

Durante drag & drop, múltiplas operações podem causar:

1. Race conditions entre saves
2. Backend enviando estado "antigo" enquanto webview já atualizou
3. Re-renders desnecessários causando flicker visual

### Solução: 3 Padrões Combinados

#### 1. Fingerprint Pattern

Cria uma "impressão digital" do estado do board para comparação rápida:

```typescript
// Em kanbanWebviewPanel.ts e useKanbanBoard.ts
function getBoardFingerprint(board: KanbanBoard): string {
  return board.columns
    .map((col) => `${col.id}:[${col.tasks.map((t) => t.id).join(",")}]`)
    .join("|");
}
```

**Uso:** Antes de enviar update, compara fingerprints. Se igual, pula o update.

#### 2. Promise Queue (Serialização de Saves)

```typescript
// Em kanbanWebviewPanel.ts
private _saveQueue: Promise<void> = Promise.resolve();
private _pendingOperations = 0;

private performAction(action: () => void) {
  action(); // executa imediatamente
  this._pendingOperations++;
  this._isSavingFromWebview = true;

  // encadeia na fila
  this._saveQueue = this._saveQueue.then(async () => {
    await this._doSave();
    this._pendingOperations--;

    if (this._pendingOperations === 0) {
      setTimeout(() => {
        if (this._pendingOperations === 0) {
          this._isSavingFromWebview = false;
        }
      }, 100);
    }
  });
}
```

**Efeito:** Drag 5 cards rapidamente → saves executam em sequência, sem race condition.

#### 3. Optimistic Updates + Guard Flag

```typescript
// Em useKanbanBoard.ts
const moveTask = useCallback((taskId, fromColumnId, toColumnId, newIndex) => {
  // 1. Atualiza React state IMEDIATAMENTE
  setBoard(prev => {
    const newBoard = /* reordena */;
    boardFingerprintRef.current = getBoardFingerprint(newBoard);
    return newBoard;
  });

  // 2. Envia para backend (save async)
  postMessage({ type: 'moveTask', ... });
}, []);

// Em extension.ts - bloqueia reload durante save
if (KanbanWebviewPanel.currentPanel.isSavingFromWebview()) {
  return; // NÃO recarrega do arquivo
}
```

### Fluxo Completo Durante Drag

```text
1. Mouse down → isDraggingRef = true
2. Mouse move → setColumns() local (preview)
3. Mouse up → handleDragEnd()
4. → setBoard() optimistic + atualiza fingerprint
5. → postMessage('moveTask')
6. → Extension: performAction() + _isSavingFromWebview = true
7. → Save encadeado na queue
8. → File saved → VS Code dispara onDidChangeTextDocument
9. → Listener vê isSavingFromWebview=true → SKIP reload
10. → Extension envia 'updateBoard' confirmação
11. → Webview compara fingerprint → IGUAL → skip setState
12. → SEM FLICKER!
```

---

## Markdown Parser Bidirecional

**Arquivo:** `src/markdownParser.ts`

### Parse: Markdown → Board

```typescript
static parseMarkdown(content: string): KanbanBoard
```

**Regras de parsing:**

- `# Title` → board.title
- `## Column` ou `## Column [Archived]` → columns
- `### Task` ou `- Task` → tasks
- `- property: value` → propriedades da task (indentado)
- `- [ ] step` → steps/subtasks (indentado)
- `#tag1 #tag2` → tags inline
- code block md → description

### Generate: Board → Markdown

```typescript
static generateMarkdown(board: KanbanBoard, taskHeaderFormat: 'title' | 'list'): string
```

**Configuração:** `markdown-kanban.taskHeader` define se usa `### Task` ou `- Task`

### Tipos

```typescript
interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  priority?: "low" | "medium" | "high";
  workload?: "Easy" | "Normal" | "Hard" | "Extreme";
  dueDate?: string;
  defaultExpanded?: boolean;
  steps?: Array<{ text: string; completed: boolean }>;
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
  archived?: boolean;
}

interface KanbanBoard {
  title: string;
  columns: KanbanColumn[];
}
```

---

## Otimizações de Performance

| Técnica            | Local                               | Propósito                          |
| ------------------ | ----------------------------------- | ---------------------------------- |
| Fingerprint        | kanbanWebviewPanel + useKanbanBoard | Evita updates redundantes          |
| Promise Queue      | kanbanWebviewPanel                  | Serializa saves concorrentes       |
| Optimistic Updates | useKanbanBoard                      | Feedback instantâneo               |
| React.memo         | TaskCard, Column                    | Previne re-renders cascata         |
| useMemo            | KanbanBoard (taskIds)               | Evita recálculo do SortableContext |
| Local Drag State   | KanbanBoard                         | Preview sem latência do backend    |
| Guard Flag         | extension.ts                        | Previne reload duplo               |

---

## Convenções de Código

- Clean code > comentários excessivos
- Comentários sempre concisos, uma linha, lowercase
- Componentização seguindo atomic design
- Testes unitários para novos componentes/features
- Sem emojis no código (apenas se usuário solicitar)
- Variáveis de tema VS Code para cores (nunca hardcoded)

---

## Scripts Úteis

```bash
npm run build          # Build extension + webview
npm run watch          # Watch mode (dev)
npm run test:unit      # Rodar testes unitários
npm run test:unit:watch # Testes em watch mode
npm run check-types    # Type checking
npm run lint           # ESLint
```
