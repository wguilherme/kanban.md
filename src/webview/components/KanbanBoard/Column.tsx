import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanColumn, KanbanTask } from '../../types/kanban';
import { SortableTask } from './SortableTask';

interface ColumnProps {
  column: KanbanColumn;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
}

function ColumnComponent({ column, onUpdateTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Memoize task IDs to prevent SortableContext from re-computing
  const taskIds = useMemo(
    () => column.tasks.map(task => task.id),
    [column.tasks]
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-lg p-4 transition-colors duration-150 ${
        isOver
          ? 'bg-vscode-list-hoverBg ring-2 ring-vscode-focusBorder'
          : 'bg-vscode-input-bg'
      }`}
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
        <div className="space-y-2 min-h-[100px]">
          {column.tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onUpdateTask={onUpdateTask}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export const Column = memo(ColumnComponent);
