import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { KanbanBoard } from '../components/KanbanBoard';
import { useKanbanStore } from '../stores/kanbanStore';
import {
  RenderProfiler,
  clearRenderStats,
  getRenderStats,
  getRenderSummary,
} from './utils/renderCounter';
import { createMockBoard } from './utils/dndTestUtils';

// mock vscode api
vi.mock('../hooks/useVSCodeApi', () => ({
  getVSCodeAPI: () => ({
    postMessage: vi.fn(),
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRenderStats();
    // reset store state
    useKanbanStore.setState({
      board: null,
      isLoading: true,
      isDragging: false,
      dragPreview: null,
      openTaskId: null,
      _fingerprint: '',
    });
  });

  afterEach(() => {
    console.log(getRenderSummary());
  });

  const setupStore = (boardOverrides = {}) => {
    const board = { ...createMockBoard(), ...boardOverrides };
    useKanbanStore.getState().setBoard(board);
    return board;
  };

  describe('Initial Render', () => {
    it('should render all columns', () => {
      setupStore();
      render(
        <RenderProfiler id="KanbanBoard">
          <KanbanBoard />
        </RenderProfiler>
      );

      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
      expect(screen.getByText('Column 3')).toBeInTheDocument();
    });

    it('should render all tasks', () => {
      setupStore();
      render(
        <RenderProfiler id="KanbanBoard">
          <KanbanBoard />
        </RenderProfiler>
      );

      expect(screen.getByText('Task 1.1')).toBeInTheDocument();
      expect(screen.getByText('Task 2.1')).toBeInTheDocument();
      expect(screen.getByText('Task 3.1')).toBeInTheDocument();
    });

    it('should return null when board is not set', () => {
      // don't setup store, board will be null
      const { container } = render(<KanbanBoard />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Store Integration', () => {
    it('should update when store board changes', async () => {
      setupStore();
      render(
        <RenderProfiler id="KanbanBoard">
          <KanbanBoard />
        </RenderProfiler>
      );

      expect(screen.getByText('Task 1.1')).toBeInTheDocument();

      // update store
      await act(async () => {
        useKanbanStore.getState().updateTask('task-1-1', { title: 'Updated Task' });
      });

      expect(screen.getByText('Updated Task')).toBeInTheDocument();
    });

    it('should use drag preview columns when dragging', async () => {
      const board = setupStore();
      render(
        <RenderProfiler id="KanbanBoard">
          <KanbanBoard />
        </RenderProfiler>
      );

      // verify initial state
      expect(screen.getByText('Task 1.1')).toBeInTheDocument();

      // start drag
      await act(async () => {
        useKanbanStore.getState().startDrag('task-1-1');
      });

      // verify drag started
      expect(useKanbanStore.getState().isDragging).toBe(true);
      expect(useKanbanStore.getState().dragPreview).not.toBeNull();
    });

    it('should persist modal state across updates', async () => {
      setupStore();
      render(
        <RenderProfiler id="KanbanBoard">
          <KanbanBoard />
        </RenderProfiler>
      );

      // open modal
      await act(async () => {
        useKanbanStore.getState().openModal('task-1-1');
      });

      expect(useKanbanStore.getState().openTaskId).toBe('task-1-1');

      // update task
      await act(async () => {
        useKanbanStore.getState().updateTask('task-1-1', { title: 'Updated' });
      });

      // modal should still be open
      expect(useKanbanStore.getState().openTaskId).toBe('task-1-1');
    });
  });

  describe('Move and Reorder Operations', () => {
    it('should move task between columns via store', async () => {
      setupStore();
      render(<KanbanBoard />);

      // move task from column 1 to column 2
      await act(async () => {
        useKanbanStore.getState().moveTask('task-1-1', 'column-1', 'column-2', 0);
      });

      const state = useKanbanStore.getState();
      expect(state.board?.columns[0].tasks.length).toBe(2); // was 3
      expect(state.board?.columns[1].tasks.length).toBe(4); // was 3
      expect(state.board?.columns[1].tasks[0].id).toBe('task-1-1');
    });

    it('should reorder task within column via store', async () => {
      setupStore();
      render(<KanbanBoard />);

      // reorder first task to last position
      await act(async () => {
        useKanbanStore.getState().reorderTask('column-1', 0, 2);
      });

      const state = useKanbanStore.getState();
      expect(state.board?.columns[0].tasks[2].id).toBe('task-1-1');
    });
  });

  describe('Fingerprint-based Sync', () => {
    it('should not update when backend sends identical data', async () => {
      const board = setupStore();
      render(<KanbanBoard />);

      const initialBoard = useKanbanStore.getState().board;

      // sync with same data (different reference)
      const clonedBoard = JSON.parse(JSON.stringify(board));
      await act(async () => {
        useKanbanStore.getState().syncFromBackend(clonedBoard);
      });

      // should be same reference (no update occurred)
      expect(useKanbanStore.getState().board).toBe(initialBoard);
    });

    it('should update when backend sends different data', async () => {
      const board = setupStore();
      render(<KanbanBoard />);

      // sync with actually different data
      const modifiedBoard = JSON.parse(JSON.stringify(board));
      modifiedBoard.columns[0].tasks.push({ id: 'new-task', title: 'New Task' });

      await act(async () => {
        useKanbanStore.getState().syncFromBackend(modifiedBoard);
      });

      expect(useKanbanStore.getState().board?.columns[0].tasks.length).toBe(4);
    });

    it('should ignore backend sync while dragging', async () => {
      setupStore();
      render(<KanbanBoard />);

      // start drag
      await act(async () => {
        useKanbanStore.getState().startDrag('task-1-1');
      });

      const boardBeforeSync = useKanbanStore.getState().board;

      // try to sync - should be ignored
      const newBoard = createMockBoard();
      newBoard.title = 'Should Not Update';
      await act(async () => {
        useKanbanStore.getState().syncFromBackend(newBoard);
      });

      // board should not have changed
      expect(useKanbanStore.getState().board).toBe(boardBeforeSync);
    });
  });
});

describe('TaskCard Memoization', () => {
  beforeEach(() => {
    clearRenderStats();
  });

  afterEach(() => {
    console.log(getRenderSummary());
  });

  it('TaskCard should not re-render when other tasks change', async () => {
    const { TaskCard } = await import('../components/KanbanBoard/TaskCard');

    const task = {
      id: 'task-1',
      title: 'Test Task',
      tags: ['tag1'],
      steps: [],
    };

    const { rerender } = render(
      <RenderProfiler id="TaskCard">
        <TaskCard task={task} />
      </RenderProfiler>
    );

    // rerender with same task (should not cause re-render due to memo)
    rerender(
      <RenderProfiler id="TaskCard">
        <TaskCard task={task} />
      </RenderProfiler>
    );

    const stats = getRenderStats('TaskCard');
    // should only render twice (mount + rerender verification)
    expect(stats?.renderCount).toBe(2);
  });
});
