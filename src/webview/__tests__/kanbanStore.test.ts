import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKanbanStore, useDisplayColumns, useModalTask, getBoardFingerprint } from '../stores/kanbanStore';
import type { KanbanBoard, KanbanColumn, KanbanTask } from '../types/kanban';

// mock vscode api
vi.mock('../hooks/useVSCodeApi', () => ({
  getVSCodeAPI: () => ({
    postMessage: vi.fn(),
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

const createMockBoard = (): KanbanBoard => ({
  title: 'Test Board',
  columns: [
    {
      id: 'col-1',
      title: 'To Do',
      tasks: [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ],
    },
    {
      id: 'col-2',
      title: 'Done',
      tasks: [
        { id: 'task-3', title: 'Task 3' },
      ],
    },
  ],
});

describe('kanbanStore', () => {
  beforeEach(() => {
    // reset store state before each test
    useKanbanStore.setState({
      board: null,
      isLoading: true,
      isDragging: false,
      dragPreview: null,
      openTaskId: null,
      newTaskColumnId: null,
    });
  });

  describe('getBoardFingerprint', () => {
    it('returns empty string for null board', () => {
      expect(getBoardFingerprint(null)).toBe('');
    });

    it('creates fingerprint from column ids and task ids', () => {
      const board = createMockBoard();
      const fingerprint = getBoardFingerprint(board);
      expect(fingerprint).toBe('col-1:[task-1,task-2]|col-2:[task-3]');
    });

    it('returns same fingerprint for identical boards', () => {
      const board1 = createMockBoard();
      const board2 = createMockBoard();
      expect(getBoardFingerprint(board1)).toBe(getBoardFingerprint(board2));
    });

    it('returns different fingerprint when task order changes', () => {
      const board1 = createMockBoard();
      const board2 = createMockBoard();
      // swap task order
      const temp = board2.columns[0].tasks[0];
      board2.columns[0].tasks[0] = board2.columns[0].tasks[1];
      board2.columns[0].tasks[1] = temp;
      expect(getBoardFingerprint(board1)).not.toBe(getBoardFingerprint(board2));
    });
  });

  describe('setBoard', () => {
    it('sets board and clears loading state', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      const state = useKanbanStore.getState();
      expect(state.board).toEqual(board);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('syncFromBackend', () => {
    it('updates board when not dragging', () => {
      // set initial board first
      const initialBoard = createMockBoard();
      useKanbanStore.getState().setBoard(initialBoard);

      // now sync with different board
      const newBoard = createMockBoard();
      newBoard.columns[0].tasks.push({ id: 'task-4', title: 'Task 4' });
      useKanbanStore.getState().syncFromBackend(newBoard);

      expect(useKanbanStore.getState().board).toEqual(newBoard);
    });

    it('ignores update when dragging', () => {
      const board1 = createMockBoard();
      useKanbanStore.getState().setBoard(board1);
      useKanbanStore.getState().startDrag('task-1');

      const board2 = createMockBoard();
      board2.title = 'Updated Board';
      useKanbanStore.getState().syncFromBackend(board2);

      // should still have original board
      expect(useKanbanStore.getState().board?.title).toBe('Test Board');
    });

    it('skips update when fingerprints match', () => {
      const board1 = createMockBoard();
      useKanbanStore.getState().setBoard(board1);

      // create identical board (different reference)
      const board2 = createMockBoard();

      // spy on setState
      const originalBoard = useKanbanStore.getState().board;
      useKanbanStore.getState().syncFromBackend(board2);

      // should be same reference (no update)
      expect(useKanbanStore.getState().board).toBe(originalBoard);
    });
  });

  describe('updateTask', () => {
    it('updates task in board state', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().updateTask('task-1', { title: 'Updated Task' });

      const updatedTask = useKanbanStore.getState().board?.columns[0].tasks[0];
      expect(updatedTask?.title).toBe('Updated Task');
    });

    it('preserves other task properties', () => {
      const board = createMockBoard();
      board.columns[0].tasks[0].priority = 'high';
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().updateTask('task-1', { title: 'Updated Task' });

      const updatedTask = useKanbanStore.getState().board?.columns[0].tasks[0];
      expect(updatedTask?.priority).toBe('high');
      expect(updatedTask?.title).toBe('Updated Task');
    });

    it('updates fingerprint after task update', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      // add a new task to change fingerprint
      const newBoard = createMockBoard();
      newBoard.columns[0].tasks.push({ id: 'task-4', title: 'Task 4' });

      useKanbanStore.getState().syncFromBackend(newBoard);

      // fingerprint should have changed, board should update
      expect(useKanbanStore.getState().board?.columns[0].tasks.length).toBe(3);
    });
  });

  describe('modal operations', () => {
    it('opens modal with task id', () => {
      useKanbanStore.getState().openModal('task-1');
      expect(useKanbanStore.getState().openTaskId).toBe('task-1');
    });

    it('closes modal', () => {
      useKanbanStore.getState().openModal('task-1');
      useKanbanStore.getState().closeModal();
      expect(useKanbanStore.getState().openTaskId).toBeNull();
    });

    it('modal persists through board updates', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);
      useKanbanStore.getState().openModal('task-1');

      // update task (simulating user interaction)
      useKanbanStore.getState().updateTask('task-1', { title: 'Updated' });

      // modal should still be open
      expect(useKanbanStore.getState().openTaskId).toBe('task-1');
    });

    it('modal persists through backend sync', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);
      useKanbanStore.getState().openModal('task-1');

      // sync from backend with same fingerprint
      const board2 = createMockBoard();
      useKanbanStore.getState().syncFromBackend(board2);

      // modal should still be open
      expect(useKanbanStore.getState().openTaskId).toBe('task-1');
    });
  });

  describe('drag operations', () => {
    it('startDrag sets isDragging and creates dragPreview', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);
      useKanbanStore.getState().startDrag('task-1');

      const state = useKanbanStore.getState();
      expect(state.isDragging).toBe(true);
      expect(state.dragPreview).toEqual(board.columns);
    });

    it('updateDragPreview updates preview columns', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);
      useKanbanStore.getState().startDrag('task-1');

      const newColumns: KanbanColumn[] = [
        { id: 'col-1', title: 'To Do', tasks: [{ id: 'task-2', title: 'Task 2' }] },
        { id: 'col-2', title: 'Done', tasks: [{ id: 'task-3', title: 'Task 3' }, { id: 'task-1', title: 'Task 1' }] },
      ];
      useKanbanStore.getState().updateDragPreview(newColumns);

      expect(useKanbanStore.getState().dragPreview).toEqual(newColumns);
    });

    it('endDrag clears isDragging and dragPreview', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);
      useKanbanStore.getState().startDrag('task-1');
      useKanbanStore.getState().endDrag();

      const state = useKanbanStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.dragPreview).toBeNull();
    });

    it('cancelDrag restores original columns', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);
      useKanbanStore.getState().startDrag('task-1');

      // modify preview
      const newColumns: KanbanColumn[] = [
        { id: 'col-1', title: 'To Do', tasks: [] },
        { id: 'col-2', title: 'Done', tasks: board.columns[0].tasks.concat(board.columns[1].tasks) },
      ];
      useKanbanStore.getState().updateDragPreview(newColumns);

      // cancel should restore original
      useKanbanStore.getState().cancelDrag();

      const state = useKanbanStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.dragPreview).toBeNull();
      // original board should be unchanged
      expect(state.board?.columns[0].tasks.length).toBe(2);
    });
  });

  describe('moveTask', () => {
    it('moves task between columns in board state', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().moveTask('task-1', 'col-1', 'col-2', 0);

      const state = useKanbanStore.getState();
      expect(state.board?.columns[0].tasks.length).toBe(1);
      expect(state.board?.columns[1].tasks.length).toBe(2);
      expect(state.board?.columns[1].tasks[0].id).toBe('task-1');
    });
  });

  describe('reorderTask', () => {
    it('reorders task within same column', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().reorderTask('col-1', 0, 1);

      const state = useKanbanStore.getState();
      expect(state.board?.columns[0].tasks[0].id).toBe('task-2');
      expect(state.board?.columns[0].tasks[1].id).toBe('task-1');
    });
  });

  describe('addTask', () => {
    it('adds new task to specified column', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().addTask('col-1', { title: 'New Task' });

      const state = useKanbanStore.getState();
      expect(state.board?.columns[0].tasks.length).toBe(3);
      expect(state.board?.columns[0].tasks[2].title).toBe('New Task');
    });

    it('generates unique id for new task', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().addTask('col-1', { title: 'New Task' });

      const state = useKanbanStore.getState();
      const newTask = state.board?.columns[0].tasks[2];
      expect(newTask?.id).toBeDefined();
      expect(newTask?.id).not.toBe('task-1');
      expect(newTask?.id).not.toBe('task-2');
    });

    it('adds task with all provided properties', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().addTask('col-1', {
        title: 'New Task',
        priority: 'high',
        workload: 'Hard',
        description: 'Test description',
      });

      const state = useKanbanStore.getState();
      const newTask = state.board?.columns[0].tasks[2];
      expect(newTask?.title).toBe('New Task');
      expect(newTask?.priority).toBe('high');
      expect(newTask?.workload).toBe('Hard');
      expect(newTask?.description).toBe('Test description');
    });

    it('does nothing if column not found', () => {
      const board = createMockBoard();
      useKanbanStore.getState().setBoard(board);

      useKanbanStore.getState().addTask('non-existent', { title: 'New Task' });

      const state = useKanbanStore.getState();
      expect(state.board?.columns[0].tasks.length).toBe(2);
      expect(state.board?.columns[1].tasks.length).toBe(1);
    });
  });

  describe('openModalForNewTask', () => {
    it('sets newTaskColumnId and opens modal with null taskId', () => {
      useKanbanStore.getState().openModalForNewTask('col-1');

      const state = useKanbanStore.getState();
      expect(state.newTaskColumnId).toBe('col-1');
      expect(state.openTaskId).toBeNull();
    });

    it('closeModal clears newTaskColumnId', () => {
      useKanbanStore.getState().openModalForNewTask('col-1');
      useKanbanStore.getState().closeModal();

      const state = useKanbanStore.getState();
      expect(state.newTaskColumnId).toBeNull();
    });
  });

  describe('selectors', () => {
    describe('useDisplayColumns', () => {
      it('returns board columns when not dragging', () => {
        const board = createMockBoard();
        useKanbanStore.setState({ board, isDragging: false, dragPreview: null });

        // manually test selector logic
        const state = useKanbanStore.getState();
        const columns = state.isDragging ? state.dragPreview : state.board?.columns;
        expect(columns).toEqual(board.columns);
      });

      it('returns dragPreview when dragging', () => {
        const board = createMockBoard();
        const preview: KanbanColumn[] = [{ id: 'preview', title: 'Preview', tasks: [] }];
        useKanbanStore.setState({ board, isDragging: true, dragPreview: preview });

        const state = useKanbanStore.getState();
        const columns = state.isDragging ? state.dragPreview : state.board?.columns;
        expect(columns).toEqual(preview);
      });
    });

    describe('useModalTask', () => {
      it('returns null when no task is open', () => {
        const board = createMockBoard();
        useKanbanStore.setState({ board, openTaskId: null });

        const state = useKanbanStore.getState();
        let task = null;
        if (state.openTaskId && state.board) {
          for (const col of state.board.columns) {
            const found = col.tasks.find(t => t.id === state.openTaskId);
            if (found) { task = found; break; }
          }
        }
        expect(task).toBeNull();
      });

      it('returns task when modal is open', () => {
        const board = createMockBoard();
        useKanbanStore.setState({ board, openTaskId: 'task-1' });

        const state = useKanbanStore.getState();
        let task = null;
        if (state.openTaskId && state.board) {
          for (const col of state.board.columns) {
            const found = col.tasks.find(t => t.id === state.openTaskId);
            if (found) { task = found; break; }
          }
        }
        expect(task).toEqual({ id: 'task-1', title: 'Task 1' });
      });

      it('returns updated task after updateTask', () => {
        const board = createMockBoard();
        useKanbanStore.setState({ board, openTaskId: 'task-1' });
        useKanbanStore.getState().updateTask('task-1', { title: 'Updated Task' });

        const state = useKanbanStore.getState();
        let task = null;
        if (state.openTaskId && state.board) {
          for (const col of state.board.columns) {
            const found = col.tasks.find(t => t.id === state.openTaskId);
            if (found) { task = found; break; }
          }
        }
        expect(task?.title).toBe('Updated Task');
      });
    });
  });
});
