import { useEffect, useState } from 'react';
import type { VSCodeAPI } from '../types/kanban';

declare global {
  interface Window {
    acquireVsCodeApi: () => VSCodeAPI;
  }
}

let vscodeApi: VSCodeAPI | undefined;

export function getVSCodeAPI(): VSCodeAPI {
  if (typeof window === 'undefined') {
    throw new Error('VSCode API is only available in webview context');
  }
  if (!vscodeApi) {
    vscodeApi = window.acquireVsCodeApi();
  }
  return vscodeApi;
}

export function useVSCodeAPI() {
  const [api] = useState(() => getVSCodeAPI());

  const postMessage = (message: any) => {
    api.postMessage(message);
  };

  const getState = () => {
    return api.getState();
  };

  const setState = (state: any) => {
    api.setState(state);
  };

  return {
    postMessage,
    getState,
    setState,
  };
}

export function useVSCodeMessage<T = any>(
  callback: (message: T) => void
) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;
      callback(message);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [callback]);
}
