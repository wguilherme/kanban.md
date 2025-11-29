import { useEffect } from 'react';
import { useKanbanStore } from '../stores/kanbanStore';
import { getVSCodeAPI } from './useVSCodeApi';

/**
 * Sets up the store with VS Code message listener.
 * Should be called once at the app root.
 */
export function useStoreSetup() {
  const syncFromBackend = useKanbanStore((s) => s.syncFromBackend);

  useEffect(() => {
    // notify extension that webview is ready
    try {
      getVSCodeAPI().postMessage({ type: 'webviewReady' });
    } catch {
      // ignore in test environment
    }

    // listen for messages from extension
    const handler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'updateBoard':
          syncFromBackend(message.board);
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [syncFromBackend]);
}
