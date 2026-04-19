import React from 'react';
import { usePrevious } from './usePrevious.js';
import { useParentName, RerenderChainContext } from './RerenderChainContext.js';
import { analyzeRender } from '../core/analyzeRender.js';
import { store } from '../core/store.js';

/**
 * track — HOC, оборачивающий компонент для отслеживания ререндеров.
 *
 * Принципы:
 * - Не ломает хуки: вызывает Component(props) напрямую только если это функция.
 *   Корректно работает с JSX через React.createElement.
 * - Не использует React Fiber / internals.
 * - Передаёт имя компонента вниз через RerenderChainContext.
 *
 * @template {object} P
 * @param {React.ComponentType<P>} Component
 * @returns {React.FC<P>}
 */
export function track(Component) {
  const displayName =
    Component.displayName || Component.name || 'UnknownComponent';

  function TrackedComponent(props) {
    const prevProps = usePrevious(props);
    const parentName = useParentName();

    // Анализируем ререндер (prevProps === undefined при монтировании)
    const { changes, reason, tips } = analyzeRender(
      prevProps === undefined ? null : prevProps,
      props,
    );

    // Формируем запись и кладём в стор
    /** @type {import('../core/store.js').RenderRecord} */
    const record = {
      name: displayName,
      changes,
      reason,
      tips: tips.length ? tips : undefined,
      parent: parentName || undefined,
    };

    store.add(record);

    // Логируем в консоль для быстрой отладки
    const style =
      reason === 'mount'
        ? 'color: #4caf50; font-weight: bold'
        : reason === 'props changed'
          ? 'color: #ff9800; font-weight: bold'
          : 'color: #9e9e9e';

    console.groupCollapsed(
      `%c[rerender-analyzer] ${displayName} — ${reason}`,
      style,
    );
    if (parentName) console.log('parent:', parentName);
    if (changes.length) console.log('changed props:', changes);
    if (tips && tips.length) console.log('tips:', tips);
    console.groupEnd();

    // Оборачиваем вывод в Provider, чтобы дочерние компоненты знали своего родителя
    return React.createElement(
      RerenderChainContext.Provider,
      { value: displayName },
      React.createElement(Component, props),
    );
  }

  TrackedComponent.displayName = `Tracked(${displayName})`;
  return TrackedComponent;
}
