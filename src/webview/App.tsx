import { useIsLoading, useBoard } from './stores/kanbanStore';
import { useStoreSetup } from './hooks/useStoreSetup';
import { KanbanBoard } from './components/KanbanBoard';

function App() {
  // setup store and message listener
  useStoreSetup();

  const isLoading = useIsLoading();
  const board = useBoard();

  if (isLoading || !board) {
    return (
      <div className="flex items-center justify-center h-screen bg-vscode-background">
        <p className="text-vscode-foreground">
          Loading Kanban board...
        </p>
      </div>
    );
  }

  return <KanbanBoard />;
}

export default App;
