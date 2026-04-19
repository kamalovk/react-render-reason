import React, { Profiler, useRef, useEffect, ComponentType, FC } from 'react';
import { usePrevious } from './usePrevious';
import { useParentName, RerenderChainContext } from './RerenderChainContext';
import { analyzeRender, AnalyzeResult } from '../core/analyzeRender';
import { store } from '../core/store';
import { domRegistry } from '../core/domRegistry';

function serialize(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'function') return `ƒ ${val.name || 'anonymous'}()`;
  if (typeof val === 'object') {
    try {
      const str = JSON.stringify(val);
      return str.length > 60 ? str.slice(0, 57) + '…' : str;
    } catch {
      return '[object]';
    }
  }
  const str = String(val);
  return str.length > 60 ? str.slice(0, 57) + '…' : str;
}

export function track<P extends object>(Component: ComponentType<P>): FC<P> {
  if (process.env.NODE_ENV === 'production') return Component as unknown as FC<P>;
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

    const pendingRef = useRef<(AnalyzeResult & { parent: string | null; prevProps: Record<string, unknown> | null }) | null>(null);
    const result = analyzeRender(
      prevProps === undefined ? null : (prevProps as Record<string, unknown>),
      props as Record<string, unknown>,
    );
    pendingRef.current = { ...result, parent: parentName, prevProps: prevProps === undefined ? null : (prevProps as Record<string, unknown>) };

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

      const { changes, reason, tips, parent, prevProps: pp } = data;
      // durationRef.current is set by Profiler.onRender which fires before effects
      const duration = durationRef.current;

      const nextP = props as Record<string, unknown>;
      const propDiff: Record<string, { prev: string; next: string }> = {};
      if (pp !== null) {
        for (const key of changes) {
          propDiff[key] = { prev: serialize(pp[key]), next: serialize(nextP[key]) };
        }
      }

      store.add({
        name: displayName,
        changes,
        propDiff: changes.length ? propDiff : undefined,
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
