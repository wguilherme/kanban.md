import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask } from '../types/kanban';
import { TaskModal } from './TaskModal';

interface DraggableTaskProps {
  task: KanbanTask;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
}

export function DraggableTask({ task, onUpdateTask }: DraggableTaskProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: task.id,
    transition: {
      duration: 200,
      easing: 'ease',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on drag handle area
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    setIsModalOpen(true);
  };

  const handleToggleStep = (stepIndex: number) => {
    if (!task.steps) return;

    const updatedSteps = task.steps.map((step, idx) =>
      idx === stepIndex ? { ...step, completed: !step.completed } : step
    );

    onUpdateTask(task.id, { steps: updatedSteps });
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '';
    }
  };

  const getWorkloadIcon = (workload?: string) => {
    switch (workload) {
      case 'Easy': return '🟢';
      case 'Normal': return '🟡';
      case 'Hard': return '🔴';
      case 'Extreme': return '🔴🔴';
      default: return '';
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={handleCardClick}
        className={`bg-vscode-background p-3 rounded border transition-all cursor-pointer ${
          isDragging
            ? 'opacity-30 scale-95 border-vscode-focusBorder'
            : isOver
            ? 'border-vscode-button-bg scale-105'
            : 'border-vscode-input-border hover:border-vscode-button-bg'
        }`}
      >
        {/* Header - draggable */}
        <div {...listeners} data-drag-handle className="cursor-grab active:cursor-grabbing">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-vscode-foreground flex-1">{task.title}</h3>
            <div className="flex items-center gap-2">
              {task.priority && (
                <span className="text-sm">
                  {getPriorityIcon(task.priority)}
                </span>
              )}
              {task.workload && (
                <span className="text-sm">{getWorkloadIcon(task.workload)}</span>
              )}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded bg-vscode-badge-bg text-vscode-badge-fg"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Step count preview */}
        {task.steps && task.steps.length > 0 && (
          <div className="mt-2 text-xs text-vscode-foreground opacity-60">
            {task.steps.filter(s => s.completed).length}/{task.steps.length} steps completed
          </div>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          task={task}
          onClose={() => setIsModalOpen(false)}
          onToggleStep={handleToggleStep}
        />
      )}
    </>
  );
}
