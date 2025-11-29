import { useCallback } from 'react';
import { TaskModal } from './TaskModal';
import { useModalTask, useKanbanStore } from '../stores/kanbanStore';

/**
 * Container that connects TaskModal to the Zustand store.
 * Uses selectors to ensure modal only re-renders when relevant data changes.
 */
export function TaskModalContainer() {
  const task = useModalTask();
  const closeModal = useKanbanStore((s) => s.closeModal);
  const updateTask = useKanbanStore((s) => s.updateTask);

  const handleToggleStep = useCallback((stepIndex: number) => {
    if (!task?.steps) return;
    const updatedSteps = task.steps.map((step, idx) =>
      idx === stepIndex ? { ...step, completed: !step.completed } : step
    );
    updateTask(task.id, { steps: updatedSteps });
  }, [task, updateTask]);

  if (!task) return null;

  return (
    <TaskModal
      task={task}
      onClose={closeModal}
      onToggleStep={handleToggleStep}
      onUpdateTask={updateTask}
    />
  );
}
