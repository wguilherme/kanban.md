import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useVSCodeAPI, useVSCodeMessage } from './hooks/useVSCodeApi';
import type { KanbanBoard, KanbanTask } from './types/kanban';
import { DroppableColumn } from './components/DroppableColumn';

function App() {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const { postMessage } = useVSCodeAPI();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Notify extension that webview is ready
  useEffect(() => {
    console.log('Webview ready, sending ready message');
    postMessage({ type: 'webviewReady' });
  }, [postMessage]);

  // Listen for messages from the extension
  useVSCodeMessage(useCallback((message: any) => {
    console.log('Received message:', message);
    switch (message.type) {
      case 'updateBoard':
        console.log('Updating board with:', message.board);
        setBoard(message.board);
        break;
    }
  }, []));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board?.columns
      .flatMap(col => col.tasks)
      .find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source column and task
    const sourceColumn = board.columns.find(col =>
      col.tasks.some(task => task.id === activeId)
    );
    if (!sourceColumn) return;

    const taskIndex = sourceColumn.tasks.findIndex(task => task.id === activeId);
    if (taskIndex === -1) return;

    // Check if dropped on a column
    const targetColumn = board.columns.find(col => col.id === overId);

    if (targetColumn) {
      // Dropped on a different column
      postMessage({
        type: 'moveTask',
        taskId: activeId,
        fromColumnId: sourceColumn.id,
        toColumnId: targetColumn.id,
        newIndex: targetColumn.tasks.length,
      });
    } else {
      // Dropped on another task - find the target column
      const targetTask = board.columns
        .flatMap(col => col.tasks)
        .find(t => t.id === overId);

      if (targetTask) {
        const targetCol = board.columns.find(col =>
          col.tasks.some(t => t.id === overId)
        );
        if (targetCol) {
          const newIndex = targetCol.tasks.findIndex(t => t.id === overId);
          postMessage({
            type: 'moveTask',
            taskId: activeId,
            fromColumnId: sourceColumn.id,
            toColumnId: targetCol.id,
            newIndex: newIndex,
          });
        }
      }
    }
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-vscode-foreground">
          Please open a Markdown Kanban file
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-vscode-background text-vscode-foreground">
        <header className="p-4 border-b border-vscode-input-border">
          <h1 className="text-2xl font-bold">{board.title || 'Kanban Board'}</h1>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <div className="flex gap-4">
            {board.columns.map((column) => (
              <DroppableColumn key={column.id} column={column} />
            ))}
          </div>
        </main>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-vscode-background p-3 rounded border border-vscode-button-bg shadow-lg opacity-90">
            <h3 className="font-medium text-vscode-foreground">{activeTask.title}</h3>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
