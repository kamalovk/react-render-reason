import { diffProps } from './diffProps';

export type RenderReason = 'mount' | 'props changed' | 'parent rerender';

export interface AnalyzeResult {
  changes: string[];
  reason: RenderReason;
  tips: string[];
}

function getTipForKey(
  key: string,
  prevVal: unknown,
  nextVal: unknown,
): string | null {
  if (prevVal === undefined) return null;

  if (typeof nextVal === 'function') {
    return `"${key}": function recreated (use useCallback to stabilize)`;
  }

  if (nextVal !== null && typeof nextVal === 'object') {
    return `"${key}": reference changed (use useMemo or stable reference)`;
  }

  return null;
}

export function analyzeRender(
  prev: Record<string, unknown> | null,
  next: Record<string, unknown>,
): AnalyzeResult {
  if (prev === null || prev === undefined) {
    return { changes: [], reason: 'mount', tips: [] };
  }

  const changes = diffProps(prev, next);

  if (changes.length === 0) {
    return { changes: [], reason: 'parent rerender', tips: [] };
  }

  const tips: string[] = [];
  for (const key of changes) {
    const tip = getTipForKey(key, prev[key], next[key]);
    if (tip !== null) tips.push(tip);
  }

  return { changes, reason: 'props changed', tips };
}
