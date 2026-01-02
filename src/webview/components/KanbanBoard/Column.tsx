import { memo, useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanColumn, KanbanTask } from '../../types/kanban';
import { SortableTask } from './SortableTask';
import { useKanbanStore } from '../../stores/kanbanStore';

interface ColumnProps {
  column: KanbanColumn;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
}

function ColumnComponent({ column, onUpdateTask }: ColumnProps) {
  const [isHovered, setIsHovered] = useState(false);
  const openModalForNewTask = useKanbanStore((s) => s.openModalForNewTask);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Memoize task IDs to prevent SortableContext from re-computing
  const taskIds = useMemo(
    () => column.tasks.map(task => task.id),
    [column.tasks]
  );

  const handleAddClick = () => {
    openModalForNewTask(column.id);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-lg p-4 transition-colors duration-150 flex flex-col ${
        isOver
          ? 'bg-vscode-list-hoverBg ring-2 ring-vscode-focusBorder'
          : 'bg-vscode-input-bg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-vscode-foreground">
          {column.title}
          {column.archived && (
            <span className="ml-2 text-xs opacity-60">[Archived]</span>
          )}
        </h2>
        <span className="text-sm text-vscode-foreground opacity-60">
          {column.tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px] flex-1">
          {column.tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onUpdateTask={onUpdateTask}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add task button - always visible at bottom, more prominent on hover */}
      <button
        onClick={handleAddClick}
        className={`mt-3 w-full py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition-all duration-150 ${
          isHovered
            ? 'bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hoverBg'
            : 'text-vscode-foreground opacity-50 hover:opacity-100 hover:bg-vscode-list-hoverBg'
        }`}
      >
        <span className="text-lg leading-none">+</span>
        <span>Add card</span>
      </button>
    </div>
  );
}

export const Column = memo(ColumnComponent);
