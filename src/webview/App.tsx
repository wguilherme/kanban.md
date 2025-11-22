import { useState, useCallback } from 'react';
import { useVSCodeAPI, useVSCodeMessage } from './hooks/useVSCodeApi';
import type { KanbanBoard } from './types/kanban';

function App() {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  useVSCodeAPI(); // Initialize VSCode API

  // Listen for messages from the extension
  useVSCodeMessage(useCallback((message: any) => {
    switch (message.type) {
      case 'updateBoard':
        setBoard(message.board);
        break;
    }
  }, []));

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-vscode-foreground">
          Please open a Markdown Kanban file
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-vscode-background text-vscode-foreground">
      <header className="p-4 border-b border-vscode-input-border">
        <h1 className="text-2xl font-bold">{board.title || 'Kanban Board'}</h1>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="flex gap-4">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-vscode-input-bg rounded-lg p-4"
            >
              <h2 className="text-lg font-semibold mb-4">
                {column.title}
                {column.archived && ' [Archived]'}
              </h2>

              <div className="space-y-2">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-vscode-background p-3 rounded border border-vscode-input-border hover:border-vscode-button-bg transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium">{task.title}</h3>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded bg-vscode-button-bg"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
