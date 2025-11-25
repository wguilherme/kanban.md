import { memo } from 'react';
import type { KanbanTask } from '../../types/kanban';

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
  isOverlay?: boolean;
}

function getPriorityIcon(priority?: string) {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '';
  }
}

function getWorkloadIcon(workload?: string) {
  switch (workload) {
    case 'Easy': return '🟢';
    case 'Normal': return '🟡';
    case 'Hard': return '🔴';
    case 'Extreme': return '🔴🔴';
    default: return '';
  }
}

function TaskCardComponent({ task, isDragging = false, isOverlay = false }: TaskCardProps) {
  const baseClasses = 'bg-vscode-background p-3 rounded border';

  const stateClasses = isOverlay
    ? 'border-vscode-button-bg shadow-lg opacity-95 scale-105'
    : isDragging
    ? 'opacity-40 border-vscode-focusBorder'
    : 'border-vscode-input-border';

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-vscode-foreground flex-1">{task.title}</h3>
        <div className="flex items-center gap-2">
          {task.priority && (
            <span className="text-sm">{getPriorityIcon(task.priority)}</span>
          )}
          {task.workload && (
            <span className="text-sm">{getWorkloadIcon(task.workload)}</span>
          )}
        </div>
      </div>

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
