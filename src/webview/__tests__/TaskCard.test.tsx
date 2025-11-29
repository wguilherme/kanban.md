import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from '../components/KanbanBoard/TaskCard';
import type { KanbanTask } from '../types/kanban';

describe('TaskCard', () => {
  describe('Priority display (left border)', () => {
    it('renders high priority with red left border', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        priority: 'high',
      };

      const { container } = render(<TaskCard task={task} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-4');
      expect(card.className).toContain('border-l-vscode-error');
    });

    it('renders medium priority with yellow left border', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        priority: 'medium',
      };

      const { container } = render(<TaskCard task={task} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-4');
      expect(card.className).toContain('border-l-vscode-warning');
    });

    it('renders low priority with green left border', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        priority: 'low',
      };

      const { container } = render(<TaskCard task={task} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-4');
      expect(card.className).toContain('border-l-vscode-success');
    });

    it('renders no left border when priority is undefined', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
      };

      const { container } = render(<TaskCard task={task} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('border-l-4');
    });
  });

  describe('Tags display', () => {
    it('renders tags as badges', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        tags: ['frontend', 'urgent', 'bug'],
      };

      render(<TaskCard task={task} />);
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('bug')).toBeInTheDocument();
    });

    it('renders no tags when empty array', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        tags: [],
      };

      const { container } = render(<TaskCard task={task} />);
      expect(container.querySelectorAll('.bg-vscode-badge-bg')).toHaveLength(0);
    });

    it('renders no tags when undefined', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
      };

      const { container } = render(<TaskCard task={task} />);
      expect(container.querySelectorAll('.bg-vscode-badge-bg')).toHaveLength(0);
    });
  });

  describe('Steps display', () => {
    it('renders steps progress', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        steps: [
          { text: 'Step 1', completed: true },
          { text: 'Step 2', completed: false },
          { text: 'Step 3', completed: true },
        ],
      };

      render(<TaskCard task={task} />);
      expect(screen.getByText('2/3 steps completed')).toBeInTheDocument();
    });

    it('renders all steps completed', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        steps: [
          { text: 'Step 1', completed: true },
          { text: 'Step 2', completed: true },
        ],
      };

      render(<TaskCard task={task} />);
      expect(screen.getByText('2/2 steps completed')).toBeInTheDocument();
    });

    it('renders no steps progress when empty', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Test Task',
        steps: [],
      };

      render(<TaskCard task={task} />);
      expect(screen.queryByText(/steps completed/)).not.toBeInTheDocument();
    });
  });

  describe('Combined properties', () => {
    it('renders task with all properties', () => {
      const task: KanbanTask = {
        id: '1',
        title: 'Complete Task',
        priority: 'high',
        workload: 'Hard',
        tags: ['frontend', 'urgent'],
        steps: [
          { text: 'Step 1', completed: true },
          { text: 'Step 2', completed: false },
        ],
      };

      const { container } = render(<TaskCard task={task} />);

      expect(screen.getByText('Complete Task')).toBeInTheDocument();
      // Priority shows as left border, not text
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-vscode-error');
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('1/2 steps completed')).toBeInTheDocument();
    });
  });
});
