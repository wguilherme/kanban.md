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
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { KanbanBoard as KanbanBoardType, KanbanTask, KanbanColumn } from '../../types/kanban';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

/**
 * Creates a fingerprint of the columns structure for content comparison.
 * This avoids unnecessary state updates when props change but content is identical.
 */
function getColumnsFingerprint(columns: KanbanColumn[]): string {
  return columns
    .map(col => `${col.id}:[${col.tasks.map(t => t.id).join(',')}]`)
    .join('|');
}

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

  // Local columns state for optimistic updates during drag
  // This allows the UI to show real-time preview of where items will land
  const [columns, setColumns] = useState<KanbanColumn[]>(board.columns);

  // Track the original position before drag started (for calling callbacks on drop)
  const dragStartState = useRef<{
    taskId: string;
    sourceColumnId: string;
    sourceIndex: number;
  } | null>(null);

  // Sync local state with props when board changes (but not during drag)
  // IMPORTANT: Compare by content (fingerprint), not by reference, to avoid
  // unnecessary re-renders when props update but data is identical
  const isDraggingRef = useRef(false);
  const boardFingerprint = getColumnsFingerprint(board.columns);
  const localFingerprint = getColumnsFingerprint(columns);
  if (!isDraggingRef.current && boardFingerprint !== localFingerprint) {
    setColumns(board.columns);
  }

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

  const findTask = useCallback((taskId: string, cols: KanbanColumn[]): KanbanTask | undefined => {
    for (const column of cols) {
      const task = column.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  }, []);

  const findColumnByTaskId = useCallback((taskId: string, cols: KanbanColumn[]) => {
    return cols.find(col => col.tasks.some(t => t.id === taskId));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;

    setColumns(currentColumns => {
      const task = findTask(taskId, currentColumns);
      const sourceColumn = findColumnByTaskId(taskId, currentColumns);

      if (task && sourceColumn) {
        setActiveTask(task);
        dragStartState.current = {
          taskId,
          sourceColumnId: sourceColumn.id,
          sourceIndex: sourceColumn.tasks.findIndex(t => t.id === taskId),
        };
      }

      return currentColumns;
    });

    isDraggingRef.current = true;
    onDragStateChange(true);
  }, [findTask, findColumnByTaskId, onDragStateChange]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setColumns(currentColumns => {
      const activeColumn = findColumnByTaskId(activeId, currentColumns);

      // Determine if over a column or a task
      const overColumn = currentColumns.find(c => c.id === overId) ||
        findColumnByTaskId(overId, currentColumns);

      if (!activeColumn || !overColumn) return currentColumns;

      // If in the same column, let sortable handle reordering
      if (activeColumn.id === overColumn.id) {
        const oldIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
        const newIndex = activeColumn.tasks.findIndex(t => t.id === overId);

        if (oldIndex !== newIndex && newIndex !== -1) {
          return currentColumns.map(col => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                tasks: arrayMove(col.tasks, oldIndex, newIndex),
              };
            }
            return col;
          });
        }
        return currentColumns;
      }

      // Moving to a different column - this is the key for cross-column preview!
      const activeIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
      const task = activeColumn.tasks[activeIndex];

      if (!task) return currentColumns;

      // Calculate target index
      let targetIndex: number;
      if (overId === overColumn.id) {
        // Dropped on column itself - add to end
        targetIndex = overColumn.tasks.length;
      } else {
        // Dropped on a task - insert at that position
        targetIndex = overColumn.tasks.findIndex(t => t.id === overId);
        if (targetIndex === -1) targetIndex = overColumn.tasks.length;
      }

      // Move task between columns
      return currentColumns.map(col => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== activeId),
          };
        }
        if (col.id === overColumn.id) {
          const newTasks = [...col.tasks];
          newTasks.splice(targetIndex, 0, task);
          return {
            ...col,
            tasks: newTasks,
          };
        }
        return col;
      });
    });
  }, [findColumnByTaskId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const startState = dragStartState.current;

    setActiveTask(null);
    isDraggingRef.current = false;
    dragStartState.current = null;

    // Delay the drag state change to prevent backend update flash
    setTimeout(() => onDragStateChange(false), 200);

    if (!over || !startState) return;

    const activeTaskId = active.id as string;

    // Get the final position from local columns state
    setColumns(currentColumns => {
      const targetColumn = findColumnByTaskId(activeTaskId, currentColumns);
      if (!targetColumn) return currentColumns;

      const targetIndex = targetColumn.tasks.findIndex(t => t.id === activeTaskId);

      // Check if position actually changed
      const sameColumn = startState.sourceColumnId === targetColumn.id;
      const sameIndex = startState.sourceIndex === targetIndex;

      if (sameColumn && sameIndex) {
        // No change, nothing to persist
        return currentColumns;
      }

      if (sameColumn) {
        // Reordered within same column
        onReorderTask(targetColumn.id, startState.sourceIndex, targetIndex);
      } else {
        // Moved to different column
        onMoveTask(activeTaskId, startState.sourceColumnId, targetColumn.id, targetIndex);
      }

      return currentColumns;
    });
  }, [findColumnByTaskId, onMoveTask, onReorderTask, onDragStateChange]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    isDraggingRef.current = false;
    dragStartState.current = null;

    // Reset columns to board state on cancel
    setColumns(board.columns);

    setTimeout(() => onDragStateChange(false), 200);
  }, [board.columns, onDragStateChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
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
            {columns.map((column) => (
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
