import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { KanbanTask } from '../types/kanban';
import { useKanbanStore } from '../stores/kanbanStore';

// mock SortableTask without dnd-kit complexity
vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable');
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
  };
});

// mock vscode api
vi.mock('../hooks/useVSCodeApi', () => ({
  getVSCodeAPI: () => ({
    postMessage: vi.fn(),
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

// import after mock
import { SortableTask } from '../components/KanbanBoard/SortableTask';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext>
    <SortableContext items={['1']}>
      {children}
    </SortableContext>
  </DndContext>
);

// helper to check if modal is open via store
function ModalChecker() {
  const openTaskId = useKanbanStore((s) => s.openTaskId);
  return <div data-testid="modal-checker" data-open={openTaskId || ''} />;
}

const isModalOpenViaStore = () => {
  const checker = screen.queryByTestId('modal-checker');
  return checker?.getAttribute('data-open') !== '';
};

describe('SortableTask modal behavior', () => {
  const baseTask: KanbanTask = {
    id: '1',
    title: 'Test Task',
    steps: [
      { text: 'Step 1', completed: false },
    ],
  };

  beforeEach(() => {
    // reset store state before each test
    useKanbanStore.setState({
      board: null,
      isLoading: true,
      isDragging: false,
      dragPreview: null,
      openTaskId: null,
    });
  });

  // wrapper with ModalChecker to verify modal state
  const wrapperWithChecker = ({ children }: { children: React.ReactNode }) => (
    <DndContext>
      <SortableContext items={['1']}>
        {children}
        <ModalChecker />
      </SortableContext>
    </DndContext>
  );

  it('should open modal when task card is clicked', () => {
    const onUpdateTask = vi.fn();
    render(
      <SortableTask task={baseTask} onUpdateTask={onUpdateTask} />,
      { wrapper: wrapperWithChecker }
    );

    // modal should not be open initially
    expect(isModalOpenViaStore()).toBe(false);

    // click on the task card
    const taskCard = screen.getByText('Test Task');
    fireEvent.click(taskCard);

    // modal should be open
    expect(isModalOpenViaStore()).toBe(true);
  });

  it('should keep modal open after task update (re-render)', async () => {
    const onUpdateTask = vi.fn();
    const { rerender } = render(
      <>
        <SortableTask task={baseTask} onUpdateTask={onUpdateTask} />
        <ModalChecker />
      </>,
      { wrapper }
    );

    // open modal
    const taskCard = screen.getByText('Test Task');
    fireEvent.click(taskCard);

    // verify modal is open
    expect(isModalOpenViaStore()).toBe(true);

    // simulate task update (as if parent component updated)
    const updatedTask = {
      ...baseTask,
      steps: [{ text: 'Step 1', completed: true }],
    };
    rerender(
      <>
        <SortableTask task={updatedTask} onUpdateTask={onUpdateTask} />
        <ModalChecker />
      </>
    );

    // modal should still be open because state is in store
    expect(isModalOpenViaStore()).toBe(true);
  });

  it('should persist modal state across multiple re-renders', () => {
    const onUpdateTask = vi.fn();
    const { rerender } = render(
      <>
        <SortableTask task={baseTask} onUpdateTask={onUpdateTask} />
        <ModalChecker />
      </>,
      { wrapper }
    );

    // open modal
    fireEvent.click(screen.getByText('Test Task'));
    expect(isModalOpenViaStore()).toBe(true);

    // simulate multiple task updates
    for (let i = 0; i < 3; i++) {
      const updatedTask = {
        ...baseTask,
        priority: ['low', 'medium', 'high'][i] as 'low' | 'medium' | 'high',
      };
      rerender(
        <>
          <SortableTask task={updatedTask} onUpdateTask={onUpdateTask} />
          <ModalChecker />
        </>
      );
      // modal should still be open after each re-render
      expect(isModalOpenViaStore()).toBe(true);
    }
  });
});
