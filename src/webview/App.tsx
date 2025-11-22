import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Find source column
    const sourceColumn = board.columns.find(col =>
      col.tasks.some(task => task.id === activeTaskId)
    );

    if (!sourceColumn) return;

    // Find target column
    const targetColumn = board.columns.find(col => col.id === overId) ||
      board.columns.find(col => col.tasks.some(task => task.id === overId));

    if (!targetColumn) return;

    const sourceIndex = sourceColumn.tasks.findIndex(t => t.id === activeTaskId);
    const task = sourceColumn.tasks[sourceIndex];

    // Calculate target index
    let targetIndex: number;

    if (overId === targetColumn.id) {
      // Dropped on empty column area
      targetIndex = targetColumn.tasks.length;
    } else {
      // Dropped on a task
      targetIndex = targetColumn.tasks.findIndex(t => t.id === overId);
    }

    // Same column - reorder using arrayMove
    if (sourceColumn.id === targetColumn.id) {
      if (sourceIndex === targetIndex) return;

      setBoard(prev => {
        if (!prev) return prev;

        const newColumns = prev.columns.map(col => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, sourceIndex, targetIndex)
            };
          }
          return col;
        });

        return { ...prev, columns: newColumns };
      });

      postMessage({
        type: 'moveTask',
        taskId: activeTaskId,
        fromColumnId: sourceColumn.id,
        toColumnId: targetColumn.id,
        newIndex: targetIndex
      });
    } else {
      // Different column - move task
      setBoard(prev => {
        if (!prev) return prev;

        const newColumns = prev.columns.map(col => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter(t => t.id !== activeTaskId)
            };
          }
          if (col.id === targetColumn.id) {
            const newTasks = [...col.tasks];
            newTasks.splice(targetIndex, 0, task);
            return {
              ...col,
              tasks: newTasks
            };
          }
          return col;
        });

        return { ...prev, columns: newColumns };
      });

      postMessage({
        type: 'moveTask',
        taskId: activeTaskId,
        fromColumnId: sourceColumn.id,
        toColumnId: targetColumn.id,
        newIndex: targetIndex
      });
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
      collisionDetection={closestCorners}
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
