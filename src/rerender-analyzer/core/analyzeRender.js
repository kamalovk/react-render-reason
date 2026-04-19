import { diffProps } from './diffProps.js';

/**
 * Причины ререндера.
 * @typedef {'mount' | 'props changed' | 'parent rerender'} RenderReason
 */

/**
 * Эвристические подсказки для отдельного изменённого prop.
 *
 * @param {string} key
 * @param {unknown} prevVal
 * @param {unknown} nextVal
 * @returns {string | null}
 */
function getTipForKey(key, prevVal, nextVal) {
  if (prevVal === undefined) return null; // первый рендер — монтирование

  if (typeof nextVal === 'function') {
    return `"${key}": function recreated (use useCallback to stabilize)`;
  }

  if (nextVal !== null && typeof nextVal === 'object') {
    return `"${key}": reference changed (use useMemo or stable reference)`;
  }

  return null;
}

/**
 * analyzeRender — анализирует изменения между предыдущим и следующим рендером.
 *
 * @param {Record<string, unknown> | null} prev  — предыдущие props (null при монтировании)
 * @param {Record<string, unknown>} next          — текущие props
 * @returns {{ changes: string[], reason: RenderReason, tips: string[] }}
 */
export function analyzeRender(prev, next) {
  // Монтирование
  if (prev === null || prev === undefined) {
    return { changes: [], reason: 'mount', tips: [] };
  }

  const changes = diffProps(prev, next);

  if (changes.length === 0) {
    // Props не изменились → ререндер вызван родителем
    return { changes: [], reason: 'parent rerender', tips: [] };
  }

  // Собираем подсказки по каждому изменённому ключу
  const tips = changes
    .map((key) => getTipForKey(key, prev[key], next[key]))
    .filter(Boolean);

  return { changes, reason: 'props changed', tips };
}
