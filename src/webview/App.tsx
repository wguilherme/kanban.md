import { useKanbanBoard } from './hooks/useKanbanBoard';
import { KanbanBoard } from './components/KanbanBoard';

function App() {
  const {
    board,
    isLoading,
    setIsDragging,
    moveTask,
    reorderTask,
    updateTask,
  } = useKanbanBoard();

  if (isLoading || !board) {
    return (
      <div className="flex items-center justify-center h-screen bg-vscode-background">
        <p className="text-vscode-foreground">
          Loading Kanban board...
        </p>
      </div>
    );
  }

  return (
    <KanbanBoard
      board={board}
      onMoveTask={moveTask}
      onReorderTask={reorderTask}
      onUpdateTask={updateTask}
      onDragStateChange={setIsDragging}
    />
  );
}

export default App;
