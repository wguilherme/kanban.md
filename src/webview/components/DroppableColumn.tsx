import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanColumn, KanbanTask } from '../types/kanban';
import { DraggableTask } from './DraggableTask';

interface DroppableColumnProps {
  column: KanbanColumn;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
}

export function DroppableColumn({ column, onUpdateTask }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map(task => task.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-lg p-4 transition-all duration-200 ${
        isOver
          ? 'bg-vscode-list-hoverBg ring-2 ring-vscode-focusBorder shadow-lg scale-[1.02]'
          : 'bg-vscode-input-bg'
      }`}
    >
      <h2 className="text-lg font-semibold mb-4 text-vscode-foreground flex items-center gap-2">
        {column.title}
        {column.archived && ' [Archived]'}
        {isOver && (
          <span className="text-xs px-2 py-1 rounded bg-vscode-primary text-vscode-button-fg animate-pulse">
            Drop here
          </span>
        )}
      </h2>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className={`space-y-2 min-h-[100px] transition-all ${isOver ? 'opacity-90' : ''}`}>
          {column.tasks.map((task) => (
            <DraggableTask key={task.id} task={task} onUpdateTask={onUpdateTask} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
