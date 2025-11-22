import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanColumn } from '../types/kanban';
import { DraggableTask } from './DraggableTask';

interface DroppableColumnProps {
  column: KanbanColumn;
}

export function DroppableColumn({ column }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map(task => task.id);

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-vscode-input-bg rounded-lg p-4"
    >
      <h2 className="text-lg font-semibold mb-4 text-vscode-foreground">
        {column.title}
        {column.archived && ' [Archived]'}
      </h2>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {column.tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
