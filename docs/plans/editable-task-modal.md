# Plano: TaskModal Editável

## Contexto

Atualmente o TaskModal exibe os detalhes da task em modo read-only. Precisamos permitir edição de:
- Priority (low/medium/high)
- Workload (Easy/Normal/Hard/Extreme)
- Steps/Subtasks (toggle, adicionar, remover, editar texto)
- Description
- Due date

## Arquitetura Atual

```
App.tsx
  └── useKanbanBoard() → { updateTask, board, ... }
        └── postMessage({ type: 'updateTask', taskId, updates })

KanbanBoard.tsx
  └── Column.tsx
        └── SortableTask.tsx
              ├── TaskCard.tsx (visual no board)
              └── TaskModal.tsx (detalhes - ATUALMENTE READ-ONLY)
                    └── onToggleStep(stepIndex) → updateTask()
```

O `onToggleStep` já funciona! Basta expandir esse pattern para os outros campos.

## Proposta de UI

### Priority Badge (Clicável - Cicla valores)
```
Clique no badge → cicla: none → low → medium → high → none
```

### Workload Badge (Clicável - Cicla valores)
```
Clique no badge → cicla: none → Easy → Normal → Hard → Extreme → none
```

### Steps/Subtasks
- [x] Toggle checkbox (já funciona)
- [ ] Botão "+" para adicionar novo step
- [ ] Botão "x" para remover step
- [ ] Editar texto do step inline (click to edit)

### Description
- Textarea editável
- Auto-save on blur

### Due Date
- Input type="date"
- Auto-save on change

## Componentes a Criar/Modificar

### 1. TaskModal.tsx (modificar)
- Receber `onUpdateTask` como prop
- Tornar badges clicáveis com ciclo de valores
- Adicionar UI para editar steps
- Adicionar textarea para description
- Adicionar input date para due date

### 2. SortableTask.tsx (modificar)
- Passar `onUpdateTask` para TaskModal

### 3. Testes Unitários
- `TaskModal.test.tsx` - testar interações de edição

## Fluxo de Dados

```
1. User clica no badge de Priority
2. TaskModal calcula próximo valor no ciclo
3. TaskModal chama onUpdateTask(taskId, { priority: newValue })
4. SortableTask repassa para useKanbanBoard.updateTask()
5. useKanbanBoard:
   - Atualiza state local (optimistic)
   - postMessage para extension
6. Extension:
   - Atualiza board em memória
   - Salva no arquivo markdown
7. Arquivo atualizado → Sync bidirecional
```

## Implementação (Ordem)

### Fase 1: Badges Clicáveis (TDD)
1. Escrever teste para ciclo de priority
2. Escrever teste para ciclo de workload
3. Implementar ciclo no TaskModal
4. Passar onUpdateTask de SortableTask para TaskModal

### Fase 2: Steps Editáveis (TDD)
1. Escrever teste para adicionar step
2. Escrever teste para remover step
3. Escrever teste para editar texto do step
4. Implementar UI de steps editáveis

### Fase 3: Description e Due Date (TDD)
1. Escrever teste para editar description
2. Escrever teste para editar due date
3. Implementar textarea e input date

## Considerações de UX

- **Feedback visual**: Badges devem ter hover state indicando que são clicáveis
- **Cursor**: `cursor-pointer` nos elementos editáveis
- **Transições**: Suaves ao mudar valores
- **Auto-save**: Sem botão de save, salva automaticamente
- **Undo**: Não implementar neste momento (pode ser futuro)

## Estimativa

- Fase 1: ~30 min
- Fase 2: ~45 min
- Fase 3: ~30 min
- Total: ~2h
