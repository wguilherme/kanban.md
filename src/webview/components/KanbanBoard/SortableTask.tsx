import { memo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask } from '../../types/kanban';
import { TaskCard } from './TaskCard';
import { TaskModal } from '../TaskModal';

interface SortableTaskProps {
  task: KanbanTask;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
}

function SortableTaskComponent({ task, onUpdateTask }: SortableTaskProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if dragging
    if (isDragging) return;
    setIsModalOpen(true);
  };

  const handleToggleStep = (stepIndex: number) => {
    if (!task.steps) return;
    const updatedSteps = task.steps.map((step, idx) =>
      idx === stepIndex ? { ...step, completed: !step.completed } : step
    );
    onUpdateTask(task.id, { steps: updatedSteps });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="cursor-grab active:cursor-grabbing"
      >
        <TaskCard task={task} isDragging={isDragging} />
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

export const SortableTask = memo(SortableTaskComponent);
