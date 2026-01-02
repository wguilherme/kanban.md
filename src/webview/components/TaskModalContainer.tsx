import { useCallback, useState } from 'react';
import { TaskModal } from './TaskModal';
import { useModalTask, useKanbanStore, useNewTaskColumnId } from '../stores/kanbanStore';
import type { KanbanTask } from '../types/kanban';

/**
 * Container that connects TaskModal to the Zustand store.
 * Uses selectors to ensure modal only re-renders when relevant data changes.
 * Handles both editing existing tasks and creating new tasks.
 */
export function TaskModalContainer() {
  const task = useModalTask();
  const newTaskColumnId = useNewTaskColumnId();
  const closeModal = useKanbanStore((s) => s.closeModal);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const addTask = useKanbanStore((s) => s.addTask);

  // local state for new task being created
  const [newTaskData, setNewTaskData] = useState<Partial<KanbanTask>>({
    title: '',
    description: '',
    steps: [],
  });

  const handleToggleStep = useCallback((stepIndex: number) => {
    if (task?.steps) {
      // editing existing task
      const updatedSteps = task.steps.map((step, idx) =>
        idx === stepIndex ? { ...step, completed: !step.completed } : step
      );
      updateTask(task.id, { steps: updatedSteps });
    } else if (newTaskData.steps) {
      // creating new task
      const updatedSteps = newTaskData.steps.map((step, idx) =>
        idx === stepIndex ? { ...step, completed: !step.completed } : step
      );
      setNewTaskData(prev => ({ ...prev, steps: updatedSteps }));
    }
  }, [task, updateTask, newTaskData.steps]);

  const handleUpdateNewTask = useCallback((_taskId: string, updates: Partial<KanbanTask>) => {
    setNewTaskData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleCreateTask = useCallback(() => {
    if (!newTaskColumnId || !newTaskData.title?.trim()) return;
    addTask(newTaskColumnId, newTaskData);
    setNewTaskData({ title: '', description: '', steps: [] });
    closeModal();
  }, [newTaskColumnId, newTaskData, addTask, closeModal]);

  const handleClose = useCallback(() => {
    setNewTaskData({ title: '', description: '', steps: [] });
    closeModal();
  }, [closeModal]);

  // creating new task
  if (newTaskColumnId) {
    const tempTask: KanbanTask = {
      id: 'new-task-temp',
      title: newTaskData.title || '',
      description: newTaskData.description,
      priority: newTaskData.priority,
      workload: newTaskData.workload,
      dueDate: newTaskData.dueDate,
      tags: newTaskData.tags,
      steps: newTaskData.steps,
    };

    return (
      <TaskModal
        task={tempTask}
        onClose={handleClose}
        onToggleStep={handleToggleStep}
        onUpdateTask={handleUpdateNewTask}
        isCreateMode
        onCreateTask={handleCreateTask}
      />
    );
  }

  // editing existing task
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
