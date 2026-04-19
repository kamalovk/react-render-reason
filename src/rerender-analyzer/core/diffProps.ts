export function diffProps(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  if (prev === next) return [];
  if (!prev || typeof prev !== 'object') return Object.keys(next ?? {});
  if (!next || typeof next !== 'object') return Object.keys(prev);

  const changed: string[] = [];

  // Check all prev keys for changes or removals
  for (const key of Object.keys(prev)) {
    if (!Object.is(prev[key], next[key])) {
      changed.push(key);
    }
  }

  // Check for new keys added in next
  for (const key of Object.keys(next)) {
    if (!(key in prev)) {
      changed.push(key);
    }
  }

  return changed;
}
