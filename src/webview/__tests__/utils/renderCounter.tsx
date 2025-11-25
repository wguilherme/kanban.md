import { useRef, useEffect, Profiler, ProfilerOnRenderCallback } from 'react';

interface RenderCount {
  componentName: string;
  renderCount: number;
  renders: Array<{
    phase: 'mount' | 'update';
    actualDuration: number;
    baseDuration: number;
    timestamp: number;
  }>;
}

// Global store for render counts
const renderCounts = new Map<string, RenderCount>();

/**
 * Hook to track render count of a component
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;

    const existing = renderCounts.get(componentName) || {
      componentName,
      renderCount: 0,
      renders: [],
    };

    existing.renderCount = renderCount.current;
    renderCounts.set(componentName, existing);
  });

  return renderCount.current;
}

/**
 * Profiler wrapper to track component render performance
 */
interface RenderProfilerProps {
  id: string;
  children: React.ReactNode;
}

export function RenderProfiler({ id, children }: RenderProfilerProps) {
  const onRender: ProfilerOnRenderCallback = (
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    _startTime,
    _commitTime
  ) => {
    const existing = renderCounts.get(profilerId) || {
      componentName: profilerId,
      renderCount: 0,
      renders: [],
    };

    existing.renderCount += 1;
    existing.renders.push({
      phase: phase as 'mount' | 'update',
      actualDuration,
      baseDuration,
      timestamp: Date.now(),
    });

    renderCounts.set(profilerId, existing);
  };

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

/**
 * Get render stats for a component
 */
export function getRenderStats(componentName: string): RenderCount | undefined {
  return renderCounts.get(componentName);
}

/**
 * Get all render stats
 */
export function getAllRenderStats(): Map<string, RenderCount> {
  return new Map(renderCounts);
}

/**
 * Clear all render stats (call before each test)
 */
export function clearRenderStats(): void {
  renderCounts.clear();
}

/**
 * Assert that a component rendered at most N times
 */
export function assertMaxRenders(
  componentName: string,
  maxRenders: number,
  message?: string
): void {
  const stats = renderCounts.get(componentName);
  const actualRenders = stats?.renderCount || 0;

  if (actualRenders > maxRenders) {
    throw new Error(
      message ||
        `Component "${componentName}" rendered ${actualRenders} times, expected at most ${maxRenders}. ` +
          `This may indicate unnecessary re-renders causing flickering.`
    );
  }
}

/**
 * Assert that a component had no "update" renders (only mount)
 */
export function assertNoUpdateRenders(
  componentName: string,
  message?: string
): void {
  const stats = renderCounts.get(componentName);
  const updateRenders = stats?.renders.filter(r => r.phase === 'update') || [];

  if (updateRenders.length > 0) {
    throw new Error(
      message ||
        `Component "${componentName}" had ${updateRenders.length} update renders. ` +
          `This may indicate unnecessary re-renders causing flickering.`
    );
  }
}

/**
 * Get render summary for debugging
 */
export function getRenderSummary(): string {
  const lines: string[] = ['=== Render Summary ==='];

  for (const [name, stats] of renderCounts) {
    const mounts = stats.renders.filter(r => r.phase === 'mount').length;
    const updates = stats.renders.filter(r => r.phase === 'update').length;
    const avgDuration =
      stats.renders.reduce((sum, r) => sum + r.actualDuration, 0) /
      stats.renders.length;

    lines.push(
      `${name}: ${stats.renderCount} renders (${mounts} mount, ${updates} update) - avg ${avgDuration.toFixed(2)}ms`
    );
  }

  return lines.join('\n');
}
