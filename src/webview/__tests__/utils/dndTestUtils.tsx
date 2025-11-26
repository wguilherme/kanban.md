import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Simulates keyboard-based drag and drop using @dnd-kit's keyboard sensor
 *
 * @dnd-kit uses Space/Enter to start/end drag, and Arrow keys to move
 * This is the most reliable way to test dnd-kit in unit tests
 */
export async function simulateKeyboardDrag(
  sourceElement: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right',
  steps: number = 1
) {
  const user = userEvent.setup();

  // Focus the element
  await act(async () => {
    sourceElement.focus();
  });

  // Start drag with Space
  await act(async () => {
    await user.keyboard(' '); // Space to start drag
  });

  // Move in direction
  const keyMap = {
    up: '{ArrowUp}',
    down: '{ArrowDown}',
    left: '{ArrowLeft}',
    right: '{ArrowRight}',
  };

  for (let i = 0; i < steps; i++) {
    await act(async () => {
      await user.keyboard(keyMap[direction]);
    });
  }

  // End drag with Space
  await act(async () => {
    await user.keyboard(' '); // Space to end drag
  });
}

/**
 * Simulates canceling a drag operation
 */
export async function simulateDragCancel(sourceElement: HTMLElement) {
  const user = userEvent.setup();

  await act(async () => {
    sourceElement.focus();
  });

  await act(async () => {
    await user.keyboard(' '); // Start drag
  });

  await act(async () => {
    await user.keyboard('{Escape}'); // Cancel drag
  });
}

/**
 * Simulates pointer-based drag using fireEvent
 * Note: This is less reliable than keyboard simulation for dnd-kit
 */
export async function simulatePointerDrag(
  sourceElement: HTMLElement,
  targetElement: HTMLElement,
  options: { steps?: number } = {}
) {
  const { steps = 10 } = options;

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  // Start pointer down
  await act(async () => {
    fireEvent.pointerDown(sourceElement, {
      pointerId: 1,
      clientX: startX,
      clientY: startY,
      button: 0,
      buttons: 1,
    });
  });

  // Move pointer in steps
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;

    await act(async () => {
      fireEvent.pointerMove(document, {
        pointerId: 1,
        clientX: currentX,
        clientY: currentY,
        button: 0,
        buttons: 1,
      });
    });
  }

  // Release pointer
  await act(async () => {
    fireEvent.pointerUp(targetElement, {
      pointerId: 1,
      clientX: endX,
      clientY: endY,
      button: 0,
      buttons: 0,
    });
  });
}

/**
 * Gets all task elements by their titles
 */
export function getTaskByTitle(title: string): HTMLElement {
  return screen.getByText(title).closest('[data-testid^="task-"]') as HTMLElement;
}

/**
 * Gets column element by title
 */
export function getColumnByTitle(title: string): HTMLElement {
  return screen.getByText(title).closest('[data-testid^="column-"]') as HTMLElement;
}

/**
 * Waits for drag operation to complete
 */
export async function waitForDragComplete(timeout: number = 500): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, timeout));
  });
}

/**
 * Creates mock board data for testing
 */
export function createMockBoard(options: {
  columns?: number;
  tasksPerColumn?: number;
} = {}) {
  const { columns = 3, tasksPerColumn = 3 } = options;

  return {
    title: 'Test Board',
    columns: Array.from({ length: columns }, (_, colIndex) => ({
      id: `column-${colIndex + 1}`,
      title: `Column ${colIndex + 1}`,
      tasks: Array.from({ length: tasksPerColumn }, (_, taskIndex) => ({
        id: `task-${colIndex + 1}-${taskIndex + 1}`,
        title: `Task ${colIndex + 1}.${taskIndex + 1}`,
        tags: [],
        steps: [],
      })),
    })),
  };
}
