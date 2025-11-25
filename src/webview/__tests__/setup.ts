import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock VSCode API
const mockVSCodeAPI = {
  postMessage: vi.fn(),
  getState: vi.fn(() => ({})),
  setState: vi.fn(),
};

// @ts-ignore
global.acquireVsCodeApi = vi.fn(() => mockVSCodeAPI);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver as a proper class
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    // Store callback if needed for tests
  }
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock PointerEvent for dnd-kit
class MockPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId || 0;
    this.pointerType = props.pointerType || 'mouse';
  }
}

// @ts-ignore
global.PointerEvent = MockPointerEvent;

// Export mock for tests
export { mockVSCodeAPI };
