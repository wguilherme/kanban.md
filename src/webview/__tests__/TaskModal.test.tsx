import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskModal } from '../components/TaskModal';
import type { KanbanTask } from '../types/kanban';

describe('TaskModal', () => {
  const baseTask: KanbanTask = {
    id: '1',
    title: 'Test Task',
  };

  const defaultProps = {
    task: baseTask,
    onClose: vi.fn(),
    onToggleStep: vi.fn(),
    onUpdateTask: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Priority cycling', () => {
    it('cycles priority from undefined to low when clicked', () => {
      const onUpdateTask = vi.fn();
      render(<TaskModal {...defaultProps} onUpdateTask={onUpdateTask} />);

      const priorityButton = screen.getByRole('button', { name: /set priority/i });
      fireEvent.click(priorityButton);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { priority: 'low' });
    });

    it('cycles priority from low to medium when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, priority: 'low' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const priorityBadge = screen.getByText(/low/i);
      fireEvent.click(priorityBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { priority: 'medium' });
    });

    it('cycles priority from medium to high when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, priority: 'medium' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const priorityBadge = screen.getByText(/medium/i);
      fireEvent.click(priorityBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { priority: 'high' });
    });

    it('cycles priority from high to undefined when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, priority: 'high' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const priorityBadge = screen.getByText(/high/i);
      fireEvent.click(priorityBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { priority: undefined });
    });
  });

  describe('Workload cycling', () => {
    it('cycles workload from undefined to Easy when clicked', () => {
      const onUpdateTask = vi.fn();
      render(<TaskModal {...defaultProps} onUpdateTask={onUpdateTask} />);

      const workloadButton = screen.getByRole('button', { name: /set workload/i });
      fireEvent.click(workloadButton);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { workload: 'Easy' });
    });

    it('cycles workload from Easy to Normal when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, workload: 'Easy' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const workloadBadge = screen.getByText(/easy/i);
      fireEvent.click(workloadBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { workload: 'Normal' });
    });

    it('cycles workload from Normal to Hard when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, workload: 'Normal' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const workloadBadge = screen.getByText(/normal/i);
      fireEvent.click(workloadBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { workload: 'Hard' });
    });

    it('cycles workload from Hard to Extreme when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, workload: 'Hard' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const workloadBadge = screen.getByText(/hard/i);
      fireEvent.click(workloadBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { workload: 'Extreme' });
    });

    it('cycles workload from Extreme to undefined when clicked', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, workload: 'Extreme' as const };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const workloadBadge = screen.getByText(/extreme/i);
      fireEvent.click(workloadBadge);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { workload: undefined });
    });
  });

  describe('Steps management', () => {
    it('toggles step completion when checkbox clicked', () => {
      const onToggleStep = vi.fn();
      const task = {
        ...baseTask,
        steps: [
          { text: 'Step 1', completed: false },
          { text: 'Step 2', completed: true },
        ],
      };
      render(<TaskModal {...defaultProps} task={task} onToggleStep={onToggleStep} />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(onToggleStep).toHaveBeenCalledWith(0);
    });

    it('adds new step when add button clicked', () => {
      const onUpdateTask = vi.fn();
      const task = {
        ...baseTask,
        steps: [{ text: 'Step 1', completed: false }],
      };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      fireEvent.click(addButton);

      expect(onUpdateTask).toHaveBeenCalledWith('1', {
        steps: [
          { text: 'Step 1', completed: false },
          { text: '', completed: false },
        ],
      });
    });

    it('removes step when delete button clicked', () => {
      const onUpdateTask = vi.fn();
      const task = {
        ...baseTask,
        steps: [
          { text: 'Step 1', completed: false },
          { text: 'Step 2', completed: true },
        ],
      };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const deleteButtons = screen.getAllByRole('button', { name: /remove step/i });
      fireEvent.click(deleteButtons[0]);

      expect(onUpdateTask).toHaveBeenCalledWith('1', {
        steps: [{ text: 'Step 2', completed: true }],
      });
    });

    it('updates step text on blur', () => {
      const onUpdateTask = vi.fn();
      const task = {
        ...baseTask,
        steps: [{ text: 'Step 1', completed: false }],
      };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const input = screen.getByDisplayValue('Step 1');
      fireEvent.change(input, { target: { value: 'Updated Step' } });
      fireEvent.blur(input);

      expect(onUpdateTask).toHaveBeenCalledWith('1', {
        steps: [{ text: 'Updated Step', completed: false }],
      });
    });
  });

  describe('Description editing', () => {
    it('updates description on blur', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, description: 'Original description' };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const textarea = screen.getByDisplayValue('Original description');
      fireEvent.change(textarea, { target: { value: 'Updated description' } });
      fireEvent.blur(textarea);

      expect(onUpdateTask).toHaveBeenCalledWith('1', { description: 'Updated description' });
    });

    it('shows placeholder when no description', () => {
      render(<TaskModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/add description/i);
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Due date editing', () => {
    it('updates due date on change', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, dueDate: '2024-12-31' };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const dateInput = screen.getByDisplayValue('2024-12-31');
      fireEvent.change(dateInput, { target: { value: '2025-01-15' } });

      expect(onUpdateTask).toHaveBeenCalledWith('1', { dueDate: '2025-01-15' });
    });

    it('clears due date when cleared', () => {
      const onUpdateTask = vi.fn();
      const task = { ...baseTask, dueDate: '2024-12-31' };
      render(<TaskModal {...defaultProps} task={task} onUpdateTask={onUpdateTask} />);

      const dateInput = screen.getByDisplayValue('2024-12-31');
      fireEvent.change(dateInput, { target: { value: '' } });

      expect(onUpdateTask).toHaveBeenCalledWith('1', { dueDate: undefined });
    });
  });

  describe('Modal should NOT close after interactions', () => {
    it('should NOT call onClose when toggling step checkbox', () => {
      const onClose = vi.fn();
      const task = {
        ...baseTask,
        steps: [{ text: 'Step 1', completed: false }],
      };
      render(<TaskModal {...defaultProps} task={task} onClose={onClose} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking add step button', () => {
      const onClose = vi.fn();
      render(<TaskModal {...defaultProps} onClose={onClose} />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      fireEvent.click(addButton);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking priority badge', () => {
      const onClose = vi.fn();
      const task = { ...baseTask, priority: 'low' as const };
      render(<TaskModal {...defaultProps} task={task} onClose={onClose} />);

      const priorityBadge = screen.getByText(/low/i);
      fireEvent.click(priorityBadge);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking workload badge', () => {
      const onClose = vi.fn();
      const task = { ...baseTask, workload: 'Easy' as const };
      render(<TaskModal {...defaultProps} task={task} onClose={onClose} />);

      const workloadBadge = screen.getByText(/easy/i);
      fireEvent.click(workloadBadge);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when removing a step', () => {
      const onClose = vi.fn();
      const task = {
        ...baseTask,
        steps: [{ text: 'Step 1', completed: false }],
      };
      render(<TaskModal {...defaultProps} task={task} onClose={onClose} />);

      const removeButton = screen.getByRole('button', { name: /remove step/i });
      fireEvent.click(removeButton);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when changing due date', () => {
      const onClose = vi.fn();
      const task = { ...baseTask, dueDate: '2024-12-31' };
      render(<TaskModal {...defaultProps} task={task} onClose={onClose} />);

      const dateInput = screen.getByDisplayValue('2024-12-31');
      fireEvent.change(dateInput, { target: { value: '2025-01-15' } });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking inside modal content', () => {
      const onClose = vi.fn();
      render(<TaskModal {...defaultProps} onClose={onClose} />);

      // click on the modal title
      const title = screen.getByText('Test Task');
      fireEvent.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
