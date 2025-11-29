import { useEffect } from 'react';
import type { KanbanTask } from '../types/kanban';

interface TaskModalProps {
  task: KanbanTask;
  onClose: () => void;
  onToggleStep: (stepIndex: number) => void;
}

export function TaskModal({ task, onClose, onToggleStep }: TaskModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getPriorityBadge = (priority?: string) => {
    const styles = {
      high: 'border border-vscode-error text-vscode-error',
      medium: 'border border-vscode-warning text-vscode-warning',
      low: 'border border-vscode-success text-vscode-success',
    };
    const labels = {
      high: '↑ High',
      medium: '→ Medium',
      low: '↓ Low',
    };

    if (!priority) return null;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const getWorkloadBadge = (workload?: string) => {
    const styles = {
      Easy: 'border border-vscode-success text-vscode-success',
      Normal: 'border border-vscode-warning text-vscode-warning',
      Hard: 'border border-vscode-error text-vscode-error',
      Extreme: 'border-2 border-vscode-error text-vscode-error font-bold',
    };
    const labels = {
      Easy: '◇ Easy',
      Normal: '◈ Normal',
      Hard: '◆ Hard',
      Extreme: '◆◆ Extreme',
    };

    if (!workload) return null;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${styles[workload as keyof typeof styles]}`}>
        {labels[workload as keyof typeof labels]}
      </span>
    );
  };

  const completedSteps = task.steps?.filter(s => s.completed).length || 0;
  const totalSteps = task.steps?.length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-vscode-background border border-vscode-input-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-vscode-input-border">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-vscode-foreground flex-1">
              {task.title}
            </h2>
            <button
              onClick={onClose}
              className="text-vscode-foreground hover:text-vscode-button-fg transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {getPriorityBadge(task.priority)}
            {getWorkloadBadge(task.workload)}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-vscode-badge-bg text-vscode-badge-fg">
                📅 Due: {task.dueDate}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded bg-vscode-badge-bg text-vscode-badge-fg"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold text-vscode-foreground mb-2">
                Description
              </h3>
              <div className="text-sm text-vscode-foreground whitespace-pre-wrap bg-vscode-input-bg p-3 rounded">
                {task.description}
              </div>
            </div>
          )}

          {/* Steps */}
          {task.steps && task.steps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-vscode-foreground">
                  Subtasks
                </h3>
                <span className="text-xs text-vscode-foreground">
                  {completedSteps}/{totalSteps} completed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-vscode-input-bg rounded-full h-2 mb-4">
                <div
                  className="bg-vscode-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Steps List */}
              <div className="space-y-2">
                {task.steps.map((step, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-2 rounded hover:bg-vscode-list-hoverBg cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={() => onToggleStep(idx)}
                      className="mt-1 cursor-pointer w-4 h-4"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        step.completed
                          ? 'line-through text-vscode-foreground opacity-60'
                          : 'text-vscode-foreground'
                      }`}
                    >
                      {step.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!task.description && (!task.steps || task.steps.length === 0) && (
            <div className="text-center py-8 text-vscode-foreground opacity-60">
              <p className="text-sm">No additional details for this task.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-vscode-input-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hoverBg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
