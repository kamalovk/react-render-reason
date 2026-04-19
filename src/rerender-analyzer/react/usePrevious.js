import { useRef } from 'react';

/**
 * usePrevious — возвращает предыдущее значение аргумента.
 * При первом рендере возвращает undefined.
 *
 * @template T
 * @param {T} value
 * @returns {T | undefined}
 */
export function usePrevious(value) {
  const ref = useRef(undefined);
  const prev = ref.current;
  ref.current = value;
  return prev;
}
