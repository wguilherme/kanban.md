import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask } from '../types/kanban';

interface DraggableTaskProps {
  task: KanbanTask;
}

export function DraggableTask({ task }: DraggableTaskProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-vscode-background p-3 rounded border transition-all cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-30 scale-95 border-vscode-focusBorder'
          : isOver
          ? 'border-vscode-button-bg scale-105'
          : 'border-vscode-input-border hover:border-vscode-button-bg'
      }`}
    >
      <h3 className="font-medium text-vscode-foreground">{task.title}</h3>
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
  );
}
