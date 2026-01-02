import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { arrayMove } from '@dnd-kit/sortable';
import type { KanbanBoard, KanbanColumn, KanbanTask } from '../types/kanban';
import { getVSCodeAPI } from '../hooks/useVSCodeApi';

/**
 * Creates a fingerprint of the board structure for content comparison.
 * Used to detect if incoming board data is actually different from current state.
 */
export function getBoardFingerprint(board: KanbanBoard | null): string {
  if (!board) return '';
  return board.columns
    .map(col => `${col.id}:[${col.tasks.map(t => t.id).join(',')}]`)
    .join('|');
}

interface KanbanState {
  // state
  board: KanbanBoard | null;
  isLoading: boolean;
  isDragging: boolean;
  dragPreview: KanbanColumn[] | null;
  openTaskId: string | null;
  newTaskColumnId: string | null;

  // internal
  _fingerprint: string;

  // actions
  setBoard: (board: KanbanBoard) => void;
  syncFromBackend: (board: KanbanBoard) => void;

  // task operations
  updateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
  addTask: (columnId: string, taskData: Partial<KanbanTask>) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  reorderTask: (columnId: string, oldIndex: number, newIndex: number) => void;

  // drag operations
  startDrag: (taskId: string) => void;
  updateDragPreview: (columns: KanbanColumn[]) => void;
  endDrag: () => void;
  cancelDrag: () => void;

  // modal operations
  openModal: (taskId: string) => void;
  openModalForNewTask: (columnId: string) => void;
  closeModal: () => void;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  // initial state
  board: null,
  isLoading: true,
  isDragging: false,
  dragPreview: null,
  openTaskId: null,
  newTaskColumnId: null,
  _fingerprint: '',

  setBoard: (board) => {
    const fingerprint = getBoardFingerprint(board);
    set({
      board,
      isLoading: false,
      _fingerprint: fingerprint,
    });
  },

  syncFromBackend: (newBoard) => {
    const state = get();

    // ignore backend updates while dragging
    if (state.isDragging) return;

    // compare fingerprints to avoid unnecessary updates
    const newFingerprint = getBoardFingerprint(newBoard);
    if (newFingerprint === state._fingerprint) return;

    set({
      board: newBoard,
      isLoading: false,
      _fingerprint: newFingerprint,
    });
  },

  updateTask: (taskId, updates) => {
    const state = get();
    if (!state.board) return;

    const newColumns = state.board.columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));

    const newBoard = { ...state.board, columns: newColumns };
    const newFingerprint = getBoardFingerprint(newBoard);

    set({
      board: newBoard,
      _fingerprint: newFingerprint,
    });

    // post message to extension
    try {
      getVSCodeAPI().postMessage({
        type: 'updateTask',
        taskId,
        updates,
      });
    } catch {
      // ignore in test environment
    }
  },

  addTask: (columnId, taskData) => {
    const state = get();
    if (!state.board) return;

    const column = state.board.columns.find(c => c.id === columnId);
    if (!column) return;

    const newTask: KanbanTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title || 'New Task',
      ...taskData,
    };

    const newColumns = state.board.columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: [...col.tasks, newTask],
        };
      }
      return col;
    });

    const newBoard = { ...state.board, columns: newColumns };
    const newFingerprint = getBoardFingerprint(newBoard);

    set({
      board: newBoard,
      _fingerprint: newFingerprint,
    });

    // post message to extension
    try {
      getVSCodeAPI().postMessage({
        type: 'addTask',
        columnId,
        taskData: newTask,
      });
    } catch {
      // ignore in test environment
    }
  },

  moveTask: (taskId, fromColumnId, toColumnId, newIndex) => {
    const state = get();
    if (!state.board) return;

    const sourceColumn = state.board.columns.find(c => c.id === fromColumnId);
    if (!sourceColumn) return;

    const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = sourceColumn.tasks[taskIndex];

    const newColumns = state.board.columns.map(col => {
      if (col.id === fromColumnId) {
        return {
          ...col,
          tasks: col.tasks.filter(t => t.id !== taskId),
        };
      }
      if (col.id === toColumnId) {
        const newTasks = [...col.tasks];
        newTasks.splice(newIndex, 0, task);
        return {
          ...col,
          tasks: newTasks,
        };
      }
      return col;
    });

    const newBoard = { ...state.board, columns: newColumns };
    const newFingerprint = getBoardFingerprint(newBoard);

    set({
      board: newBoard,
      _fingerprint: newFingerprint,
    });

    // post message to extension
    try {
      getVSCodeAPI().postMessage({
        type: 'moveTask',
        taskId,
        fromColumnId,
        toColumnId,
        newIndex,
      });
    } catch {
      // ignore in test environment
    }
  },

  reorderTask: (columnId, oldIndex, newIndex) => {
    const state = get();
    if (!state.board) return;

    const column = state.board.columns.find(c => c.id === columnId);
    if (!column) return;

    const task = column.tasks[oldIndex];
    if (!task) return;

    const newColumns = state.board.columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: arrayMove(col.tasks, oldIndex, newIndex),
        };
      }
      return col;
    });

    const newBoard = { ...state.board, columns: newColumns };
    const newFingerprint = getBoardFingerprint(newBoard);

    set({
      board: newBoard,
      _fingerprint: newFingerprint,
    });

    // post message to extension
    try {
      getVSCodeAPI().postMessage({
        type: 'moveTask',
        taskId: task.id,
        fromColumnId: columnId,
        toColumnId: columnId,
        newIndex,
      });
    } catch {
      // ignore in test environment
    }
  },

  startDrag: (taskId) => {
    const state = get();
    if (!state.board) return;

    set({
      isDragging: true,
      dragPreview: structuredClone(state.board.columns),
    });
  },

  updateDragPreview: (columns) => {
    set({ dragPreview: columns });
  },

  endDrag: () => {
    set({
      isDragging: false,
      dragPreview: null,
    });
  },

  cancelDrag: () => {
    set({
      isDragging: false,
      dragPreview: null,
    });
  },

  openModal: (taskId) => {
    set({ openTaskId: taskId, newTaskColumnId: null });
    // notify extension that modal is open
    try {
      getVSCodeAPI().postMessage({ type: 'modalStateChange', isOpen: true });
    } catch {
      // ignore in test environment
    }
  },

  openModalForNewTask: (columnId) => {
    set({ openTaskId: null, newTaskColumnId: columnId });
    // notify extension that modal is open
    try {
      getVSCodeAPI().postMessage({ type: 'modalStateChange', isOpen: true });
    } catch {
      // ignore in test environment
    }
  },

  closeModal: () => {
    set({ openTaskId: null, newTaskColumnId: null });
    // notify extension that modal is closed - triggers deferred save
    try {
      getVSCodeAPI().postMessage({ type: 'modalStateChange', isOpen: false });
    } catch {
      // ignore in test environment
    }
  },
}));

// empty array constant to avoid creating new references
const EMPTY_COLUMNS: KanbanColumn[] = [];

// selectors with shallow equality to prevent unnecessary re-renders
export const useDisplayColumns = () =>
  useKanbanStore(
    (state) => (state.isDragging ? state.dragPreview : state.board?.columns) ?? EMPTY_COLUMNS,
    shallow
  );

export const useModalTask = () =>
  useKanbanStore((state) => {
    if (!state.openTaskId || !state.board) return null;
    for (const col of state.board.columns) {
      const task = col.tasks.find(t => t.id === state.openTaskId);
      if (task) return task;
    }
    return null;
  });

export const useIsDragging = () => useKanbanStore((state) => state.isDragging);
export const useIsModalOpen = () => useKanbanStore((state) => state.openTaskId !== null || state.newTaskColumnId !== null);
export const useIsLoading = () => useKanbanStore((state) => state.isLoading);
export const useBoard = () => useKanbanStore((state) => state.board);
export const useNewTaskColumnId = () => useKanbanStore((state) => state.newTaskColumnId);
