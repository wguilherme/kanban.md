import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask } from '../../types/kanban';
import { TaskCard } from './TaskCard';
import { useKanbanStore } from '../../stores/kanbanStore';

interface SortableTaskProps {
  task: KanbanTask;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
}

function SortableTaskComponent({ task, onUpdateTask }: SortableTaskProps) {
  const openModal = useKanbanStore((s) => s.openModal);

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

  const handleClick = () => {
    // don't open modal if dragging
    if (isDragging) return;
    openModal(task.id);
  };

  return (
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
  );
}

export const SortableTask = memo(SortableTaskComponent);
