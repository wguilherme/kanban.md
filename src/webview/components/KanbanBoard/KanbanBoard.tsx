import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { KanbanBoard as KanbanBoardType, KanbanTask } from '../../types/kanban';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  board: KanbanBoardType;
  onMoveTask: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  onReorderTask: (columnId: string, oldIndex: number, newIndex: number) => void;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
  onDragStateChange: (isDragging: boolean) => void;
}

export function KanbanBoard({
  board,
  onMoveTask,
  onReorderTask,
  onUpdateTask,
  onDragStateChange,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  // Track the current over column during drag for visual feedback
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Use refs to store the latest board state for event handlers
  const boardRef = useRef(board);
  boardRef.current = board;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTask = useCallback((taskId: string): KanbanTask | undefined => {
    for (const column of boardRef.current.columns) {
      const task = column.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  }, []);

  const findColumnByTaskId = useCallback((taskId: string) => {
    return boardRef.current.columns.find(col =>
      col.tasks.some(t => t.id === taskId)
    );
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = findTask(active.id as string);
    setActiveTask(task || null);
    onDragStateChange(true);
  }, [findTask, onDragStateChange]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Check if over a column directly or a task in a column
      const column = boardRef.current.columns.find(c => c.id === over.id) ||
        boardRef.current.columns.find(c => c.tasks.some(t => t.id === over.id));
      setOverColumnId(column?.id || null);
    } else {
      setOverColumnId(null);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverColumnId(null);

    // Delay the drag state change to prevent backend update flash
    setTimeout(() => onDragStateChange(false), 200);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = findColumnByTaskId(activeTaskId);
    if (!sourceColumn) return;

    // Determine target column
    const targetColumn = boardRef.current.columns.find(c => c.id === overId) ||
      boardRef.current.columns.find(c => c.tasks.some(t => t.id === overId));

    if (!targetColumn) return;

    const sourceIndex = sourceColumn.tasks.findIndex(t => t.id === activeTaskId);

    // Calculate target index
    let targetIndex: number;
    if (overId === targetColumn.id) {
      // Dropped on column area - add to end
      targetIndex = targetColumn.tasks.length;
    } else {
      // Dropped on a task
      targetIndex = targetColumn.tasks.findIndex(t => t.id === overId);
    }

    // Same column - reorder
    if (sourceColumn.id === targetColumn.id) {
      if (sourceIndex !== targetIndex) {
        onReorderTask(sourceColumn.id, sourceIndex, targetIndex);
      }
    } else {
      // Different column - move
      onMoveTask(activeTaskId, sourceColumn.id, targetColumn.id, targetIndex);
    }
  }, [findColumnByTaskId, onMoveTask, onReorderTask, onDragStateChange]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setOverColumnId(null);
    setTimeout(() => onDragStateChange(false), 200);
  }, [onDragStateChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-screen flex flex-col bg-vscode-background text-vscode-foreground">
        <header className="p-4 border-b border-vscode-input-border">
          <h1 className="text-2xl font-bold">{board.title || 'Kanban Board'}</h1>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <div className="flex gap-4">
            {board.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onUpdateTask={onUpdateTask}
              />
            ))}
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask ? (
          <TaskCard task={activeTask} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
