import { useState, useCallback, useEffect, useRef } from 'react';
import { useVSCodeAPI, useVSCodeMessage } from './useVSCodeApi';
import type { KanbanBoard, KanbanTask, KanbanColumn } from '../types/kanban';
import { arrayMove } from '@dnd-kit/sortable';

interface UseKanbanBoardReturn {
  board: KanbanBoard | null;
  isLoading: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  reorderTask: (columnId: string, oldIndex: number, newIndex: number) => void;
  updateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
  findTaskById: (taskId: string) => KanbanTask | undefined;
  findColumnByTaskId: (taskId: string) => KanbanColumn | undefined;
}

export function useKanbanBoard(): UseKanbanBoardReturn {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const { postMessage } = useVSCodeAPI();

  // Use ref to track dragging state for message handler
  // This avoids recreating the callback when isDragging changes
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  // Notify extension that webview is ready
  useEffect(() => {
    postMessage({ type: 'webviewReady' });
  }, [postMessage]);

  // Listen for messages from the extension
  useVSCodeMessage(useCallback((message: any) => {
    switch (message.type) {
      case 'updateBoard':
        // Ignore backend updates while dragging to prevent flickering
        if (!isDraggingRef.current) {
          setBoard(message.board);
          setIsLoading(false);
        }
        break;
    }
  }, [])); // Empty deps - uses ref for isDragging

  const findTaskById = useCallback((taskId: string): KanbanTask | undefined => {
    if (!board) return undefined;
    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  }, [board]);

  const findColumnByTaskId = useCallback((taskId: string): KanbanColumn | undefined => {
    if (!board) return undefined;
    return board.columns.find(col => col.tasks.some(t => t.id === taskId));
  }, [board]);

  const moveTask = useCallback((
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number
  ) => {
    setBoard(prev => {
      if (!prev) return prev;

      const sourceColumn = prev.columns.find(c => c.id === fromColumnId);
      if (!sourceColumn) return prev;

      const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;

      const task = sourceColumn.tasks[taskIndex];

      const newColumns = prev.columns.map(col => {
        if (col.id === fromColumnId) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== taskId)
          };
        }
        if (col.id === toColumnId) {
          const newTasks = [...col.tasks];
          newTasks.splice(newIndex, 0, task);
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
      taskId,
      fromColumnId,
      toColumnId,
      newIndex
    });
  }, [postMessage]);

  const reorderTask = useCallback((
    columnId: string,
    oldIndex: number,
    newIndex: number
  ) => {
    setBoard(prev => {
      if (!prev) return prev;

      const column = prev.columns.find(c => c.id === columnId);
      if (!column) return prev;

      const task = column.tasks[oldIndex];
      if (!task) return prev;

      const newColumns = prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: arrayMove(col.tasks, oldIndex, newIndex)
          };
        }
        return col;
      });

      return { ...prev, columns: newColumns };
    });

    const column = board?.columns.find(c => c.id === columnId);
    const task = column?.tasks[oldIndex];
    if (task) {
      postMessage({
        type: 'moveTask',
        taskId: task.id,
        fromColumnId: columnId,
        toColumnId: columnId,
        newIndex
      });
    }
  }, [board, postMessage]);

  const updateTask = useCallback((taskId: string, updates: Partial<KanbanTask>) => {
    setBoard(prev => {
      if (!prev) return prev;

      const newColumns = prev.columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }));

      return { ...prev, columns: newColumns };
    });

    postMessage({
      type: 'updateTask',
      taskId,
      updates
    });
  }, [postMessage]);

  return {
    board,
    isLoading,
    isDragging,
    setIsDragging,
    moveTask,
    reorderTask,
    updateTask,
    findTaskById,
    findColumnByTaskId,
  };
}
