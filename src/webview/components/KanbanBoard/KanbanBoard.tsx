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
import type { KanbanTask, KanbanColumn } from '../../types/kanban';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModalContainer } from '../TaskModalContainer';
import {
  useKanbanStore,
  useDisplayColumns,
  useBoard,
} from '../../stores/kanbanStore';

export function KanbanBoard() {
  const board = useBoard();
  const columns = useDisplayColumns();
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  // store actions
  const startDrag = useKanbanStore((s) => s.startDrag);
  const updateDragPreview = useKanbanStore((s) => s.updateDragPreview);
  const endDrag = useKanbanStore((s) => s.endDrag);
  const cancelDrag = useKanbanStore((s) => s.cancelDrag);
  const moveTask = useKanbanStore((s) => s.moveTask);
  const reorderTask = useKanbanStore((s) => s.reorderTask);
  const updateTask = useKanbanStore((s) => s.updateTask);

  // track original position before drag
  const dragStartState = useRef<{
    taskId: string;
    sourceColumnId: string;
    sourceIndex: number;
  } | null>(null);

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

    const currentColumns = useKanbanStore.getState().board?.columns || [];
    const task = findTask(taskId, currentColumns);
    const sourceColumn = findColumnByTaskId(taskId, currentColumns);

    if (task && sourceColumn) {
      setActiveTask(task);
      dragStartState.current = {
        taskId,
        sourceColumnId: sourceColumn.id,
        sourceIndex: sourceColumn.tasks.findIndex(t => t.id === taskId),
      };
      startDrag(taskId);
    }
  }, [findTask, findColumnByTaskId, startDrag]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentColumns = useKanbanStore.getState().dragPreview || [];
    const activeColumn = findColumnByTaskId(activeId, currentColumns);

    // determine if over a column or a task
    const overColumn = currentColumns.find(c => c.id === overId) ||
      findColumnByTaskId(overId, currentColumns);

    if (!activeColumn || !overColumn) return;

    // if in the same column, handle reordering
    if (activeColumn.id === overColumn.id) {
      const oldIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
      const newIndex = activeColumn.tasks.findIndex(t => t.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        const newColumns = currentColumns.map(col => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, oldIndex, newIndex),
            };
          }
          return col;
        });
        updateDragPreview(newColumns);
      }
      return;
    }

    // moving to a different column
    const activeIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
    const task = activeColumn.tasks[activeIndex];

    if (!task) return;

    // calculate target index
    let targetIndex: number;
    if (overId === overColumn.id) {
      targetIndex = overColumn.tasks.length;
    } else {
      targetIndex = overColumn.tasks.findIndex(t => t.id === overId);
      if (targetIndex === -1) targetIndex = overColumn.tasks.length;
    }

    // move task between columns in preview
    const newColumns = currentColumns.map(col => {
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
    updateDragPreview(newColumns);
  }, [findColumnByTaskId, updateDragPreview]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const startState = dragStartState.current;

    setActiveTask(null);
    dragStartState.current = null;

    if (!over || !startState) {
      endDrag();
      return;
    }

    const activeTaskId = active.id as string;
    const currentColumns = useKanbanStore.getState().dragPreview || [];
    const targetColumn = findColumnByTaskId(activeTaskId, currentColumns);

    if (!targetColumn) {
      endDrag();
      return;
    }

    const targetIndex = targetColumn.tasks.findIndex(t => t.id === activeTaskId);

    // check if position actually changed
    const sameColumn = startState.sourceColumnId === targetColumn.id;
    const sameIndex = startState.sourceIndex === targetIndex;

    // end drag first to clear isDragging flag
    endDrag();

    if (sameColumn && sameIndex) {
      // no change, nothing to persist
      return;
    }

    if (sameColumn) {
      // reordered within same column
      reorderTask(targetColumn.id, startState.sourceIndex, targetIndex);
    } else {
      // moved to different column
      moveTask(activeTaskId, startState.sourceColumnId, targetColumn.id, targetIndex);
    }
  }, [findColumnByTaskId, moveTask, reorderTask, endDrag]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    dragStartState.current = null;
    cancelDrag();
  }, [cancelDrag]);

  if (!board) return null;

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
                onUpdateTask={updateTask}
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

      {/* Task Modal - rendered outside DndContext to prevent interference */}
      <TaskModalContainer />
    </DndContext>
  );
}
