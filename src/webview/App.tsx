import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and target columns
    const activeColumn = board.columns.find(col =>
      col.tasks.some(task => task.id === activeId)
    );
    const overColumn = board.columns.find(col => col.id === overId) ||
      board.columns.find(col => col.tasks.some(task => task.id === overId));

    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return; // Same column, let sortable handle it

    // Optimistically update local state for smooth UX
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard;

      const newColumns = prevBoard.columns.map(col => ({ ...col, tasks: [...col.tasks] }));
      const sourceCol = newColumns.find(col => col.id === activeColumn.id);
      const targetCol = newColumns.find(col => col.id === overColumn.id);

      if (!sourceCol || !targetCol) return prevBoard;

      const taskIndex = sourceCol.tasks.findIndex(task => task.id === activeId);
      if (taskIndex === -1) return prevBoard;

      const [task] = sourceCol.tasks.splice(taskIndex, 1);

      // Find insertion index
      let insertIndex = targetCol.tasks.length;
      if (overId !== overColumn.id) {
        insertIndex = targetCol.tasks.findIndex(t => t.id === overId);
        if (insertIndex === -1) insertIndex = targetCol.tasks.length;
      }

      targetCol.tasks.splice(insertIndex, 0, task);

      return { ...prevBoard, columns: newColumns };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Use the current board state (which was updated by onDragOver)
    setBoard(currentBoard => {
      if (!currentBoard) return currentBoard;

      // Find source column and task in current state
      const sourceColumn = currentBoard.columns.find(col =>
        col.tasks.some(task => task.id === activeId)
      );
      if (!sourceColumn) return currentBoard;

      // Check if dropped on a column or task
      const targetColumn = currentBoard.columns.find(col => col.id === overId) ||
        currentBoard.columns.find(col => col.tasks.some(task => task.id === overId));

      if (!targetColumn) return currentBoard;

      // Find the final index
      let newIndex = targetColumn.tasks.findIndex(t => t.id === activeId);
      if (newIndex === -1) newIndex = targetColumn.tasks.length;

      // Send to backend
      postMessage({
        type: 'moveTask',
        taskId: activeId,
        fromColumnId: sourceColumn.id,
        toColumnId: targetColumn.id,
        newIndex: newIndex,
      });

      return currentBoard;
    });
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
      onDragOver={handleDragOver}
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
