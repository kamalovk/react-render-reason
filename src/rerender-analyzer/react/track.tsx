import React, { Profiler, useRef, useEffect, ComponentType, FC } from 'react';
import { usePrevious } from './usePrevious';
import { useParentName, RerenderChainContext } from './RerenderChainContext';
import { analyzeRender, AnalyzeResult } from '../core/analyzeRender';
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

    // Profiler writes actualDuration here before useEffect fires
    const durationRef = useRef<number>(0);

    const pendingRef = useRef<(AnalyzeResult & { parent: string | null }) | null>(null);
    const result = analyzeRender(
      prevProps === undefined ? null : (prevProps as Record<string, unknown>),
      props as Record<string, unknown>,
    );
    pendingRef.current = { ...result, parent: parentName };

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      domRegistry.register(displayName, el);
      return () => domRegistry.unregister(displayName, el);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Side effects (store + console) run after commit — safe in StrictMode
    useEffect(() => {
      const data = pendingRef.current;
      if (!data) return;
      pendingRef.current = null;

      const { changes, reason, tips, parent } = data;
      // durationRef.current is set by Profiler.onRender which fires before effects
      const duration = durationRef.current;

      store.add({
        name: displayName,
        changes,
        reason,
        tips: tips.length ? tips : undefined,
        parent: parent ?? undefined,
        duration,
      });

      const consoleStyle =
        reason === 'mount'
          ? 'color: #4caf50; font-weight: bold'
          : reason === 'props changed'
            ? 'color: #ff9800; font-weight: bold'
            : 'color: #9e9e9e';

      console.groupCollapsed(
        `%c[rerender-analyzer] ${displayName} — ${reason} (${duration.toFixed(2)}ms)`,
        consoleStyle,
      );
      if (parent) console.log('parent:', parent);
      if (changes.length) console.log('changed props:', changes);
      if (tips.length) console.log('tips:', tips);
      if (duration > 16) console.warn(`[rerender-analyzer] ⚠ Slow render: ${displayName} took ${duration.toFixed(2)}ms`);
      console.groupEnd();
    });

    return React.createElement(
      RerenderChainContext.Provider,
      { value: displayName },
      React.createElement(
        'span',
        { ref: wrapperRef, style: { display: 'contents' } },
        React.createElement(
          Profiler,
          {
            id: displayName,
            onRender: (_id, _phase, actualDuration) => {
              durationRef.current = actualDuration;
            },
          },
          React.createElement(Component, props),
        ),
      ),
    );
  }

  TrackedComponent.displayName = `Tracked(${displayName})`;
  return TrackedComponent;
}
