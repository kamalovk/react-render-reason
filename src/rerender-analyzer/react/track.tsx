import React, { useRef, useEffect, ComponentType, FC } from 'react';
import { usePrevious } from './usePrevious';
import { useParentName, RerenderChainContext } from './RerenderChainContext';
import { analyzeRender } from '../core/analyzeRender';
import { store } from '../core/store';
import { domRegistry } from '../core/domRegistry';

export function track<P extends object>(Component: ComponentType<P>): FC<P> {
  const displayName =
    (Component as { displayName?: string }).displayName ||
    Component.name ||
    'UnknownComponent';

  function TrackedComponent(props: P) {
    const prevProps = usePrevious(props);
    const parentName = useParentName();
    const wrapperRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      domRegistry.register(displayName, el);
      return () => domRegistry.unregister(displayName, el);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { changes, reason, tips } = analyzeRender(
      prevProps === undefined ? null : (prevProps as Record<string, unknown>),
      props as Record<string, unknown>,
    );

    store.add({
      name: displayName,
      changes,
      reason,
      tips: tips.length ? tips : undefined,
      parent: parentName ?? undefined,
    });

    const consoleStyle =
      reason === 'mount'
        ? 'color: #4caf50; font-weight: bold'
        : reason === 'props changed'
          ? 'color: #ff9800; font-weight: bold'
          : 'color: #9e9e9e';

    console.groupCollapsed(
      `%c[rerender-analyzer] ${displayName} — ${reason}`,
      consoleStyle,
    );
    if (parentName) console.log('parent:', parentName);
    if (changes.length) console.log('changed props:', changes);
    if (tips.length) console.log('tips:', tips);
    console.groupEnd();

    return React.createElement(
      RerenderChainContext.Provider,
      { value: displayName },
      React.createElement(
        'span',
        { ref: wrapperRef, style: { display: 'contents' } },
        React.createElement(Component, props),
      ),
    );
  }

  TrackedComponent.displayName = `Tracked(${displayName})`;
  return TrackedComponent;
}
