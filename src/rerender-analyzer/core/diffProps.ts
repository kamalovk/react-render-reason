export function diffProps(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  if (prev === next) return [];
  if (!prev || typeof prev !== 'object') return Object.keys(next ?? {});
  if (!next || typeof next !== 'object') return Object.keys(prev);

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed: string[] = [];

  for (const key of allKeys) {
    if (!Object.is(prev[key], next[key])) {
      changed.push(key);
    }
  }

  return changed;
}
