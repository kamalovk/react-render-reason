/**
 * diffProps — сравнивает два объекта props и возвращает список изменённых ключей.
 * Чистый JavaScript, без зависимостей.
 *
 * @param {Record<string, unknown>} prev
 * @param {Record<string, unknown>} next
 * @returns {string[]} список ключей, значения которых изменились
 */
export function diffProps(prev, next) {
  if (prev === next) return [];
  if (!prev || typeof prev !== 'object') return Object.keys(next || {});
  if (!next || typeof next !== 'object') return Object.keys(prev);

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed = [];

  for (const key of allKeys) {
    if (!Object.is(prev[key], next[key])) {
      changed.push(key);
    }
  }

  return changed;
}
