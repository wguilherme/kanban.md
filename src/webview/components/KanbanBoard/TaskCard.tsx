import { memo } from 'react';
import type { KanbanTask } from '../../types/kanban';

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
  isOverlay?: boolean;
}

function getPriorityBorderClass(priority: string) {
  switch (priority) {
    case 'high': return 'border-l-4 border-l-vscode-error';
    case 'medium': return 'border-l-4 border-l-vscode-warning';
    case 'low': return 'border-l-4 border-l-vscode-success';
    default: return '';
  }
}

function TaskCardComponent({ task, isDragging = false, isOverlay = false }: TaskCardProps) {
  const baseClasses = 'bg-vscode-background p-3 rounded border';

  const priorityClasses = task.priority ? getPriorityBorderClass(task.priority) : '';

  const stateClasses = isOverlay
    ? 'border-vscode-button-bg shadow-lg opacity-95 scale-105'
    : isDragging
    ? 'opacity-40 border-vscode-focusBorder'
    : 'border-vscode-input-border';

  return (
    <div className={`${baseClasses} ${stateClasses} ${priorityClasses}`}>
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

      {task.steps && task.steps.length > 0 && (
        <div className="mt-2 text-xs text-vscode-foreground opacity-60">
          {task.steps.filter(s => s.completed).length}/{task.steps.length} steps completed
        </div>
      )}
    </div>
  );
}

// Memoize to prevent re-renders when parent state changes
export const TaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.workload === nextProps.task.workload &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isOverlay === nextProps.isOverlay &&
    JSON.stringify(prevProps.task.tags) === JSON.stringify(nextProps.task.tags) &&
    JSON.stringify(prevProps.task.steps) === JSON.stringify(nextProps.task.steps)
  );
});
