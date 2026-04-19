import { useState, useEffect, useRef, CSSProperties } from 'react';
import { store } from '../core/store';
import { domRegistry } from '../core/domRegistry';
import { RenderRecord } from '../core/store';

function highlightComponent(name: string): void {
  for (const wrapper of domRegistry.get(name)) {
    for (const child of Array.from(wrapper.children) as HTMLElement[]) {
      child.dataset.raOutline = child.style.outline;
      child.dataset.raOutlineOffset = child.style.outlineOffset;
      child.style.outline = '2px solid #ff9800';
      child.style.outlineOffset = '2px';
    }
  }
}

function unhighlightComponent(name: string): void {
  for (const wrapper of domRegistry.get(name)) {
    for (const child of Array.from(wrapper.children) as HTMLElement[]) {
      child.style.outline = child.dataset.raOutline ?? '';
      child.style.outlineOffset = child.dataset.raOutlineOffset ?? '';
    }
  }
}

const REASON_COLOR: Record<string, string> = {
  mount: '#4caf50',
  'props changed': '#ff9800',
  'parent rerender': '#9e9e9e',
};

function RecordRow({ record }: { record: RenderRecord }) {
  const reasonColor = REASON_COLOR[record.reason] ?? '#ffffff';

  return (
    <div
      style={{ borderBottom: '1px solid #333', padding: '6px 8px', fontSize: '12px', lineHeight: 1.5, cursor: 'default' }}
      onMouseEnter={() => highlightComponent(record.name)}
      onMouseLeave={() => unhighlightComponent(record.name)}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#e0e0e0', fontWeight: 'bold' }}>{record.name}</span>
        <span style={{ color: reasonColor, fontSize: '11px', background: '#2a2a2a', borderRadius: '3px', padding: '1px 5px' }}>
          {record.reason}
        </span>
        <span style={{
          fontSize: '11px',
          borderRadius: '3px',
          padding: '1px 5px',
          background: record.duration > 16 ? '#4a1a1a' : '#1a2a1a',
          color: record.duration > 16 ? '#ff5252' : '#69f0ae',
          fontWeight: record.duration > 16 ? 'bold' : 'normal',
        }}>
          {record.duration > 16 ? '⚠ ' : ''}{record.duration.toFixed(2)}ms
        </span>
        {record.parent && (
          <span style={{ color: '#607d8b', fontSize: '11px' }}>← {record.parent}</span>
        )}
      </div>
      {record.changes.length > 0 && (
        <div style={{ color: '#90caf9', marginTop: '2px' }}>props: {record.changes.join(', ')}</div>
      )}
      {record.tips && record.tips.length > 0 && (
        <div style={{ color: '#ffcc80', marginTop: '2px', fontStyle: 'italic' }}>
          {record.tips.map((tip, i) => <div key={i}>💡 {tip}</div>)}
        </div>
      )}
      <div style={{ color: '#555', fontSize: '10px', marginTop: '2px' }}>
        {new Date(record.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

export function RerenderOverlay() {
  const [records, setRecords] = useState<RenderRecord[]>(() => store.getLast(50));
  const [counts, setCounts] = useState(() => store.getCounts());
  const [tab, setTab] = useState<'log' | 'hot'>('log');
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 380, y: 20 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return store.subscribe(() => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setRecords(store.getLast(50));
        setCounts(store.getCounts());
        rafRef.current = null;
      });
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed', bottom: '16px', right: '16px', zIndex: 999999,
          background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #45475a',
          borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
        }}
      >
        🔍 Rerender Analyzer
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: pos.y, left: pos.x,
      width: '360px', maxHeight: minimized ? 'auto' : '480px',
      zIndex: 999999, background: '#1a1a1a', color: '#e0e0e0',
      border: '1px solid #444', borderRadius: '8px',
      fontFamily: 'monospace', boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column', userSelect: 'none',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', background: '#252525',
          borderRadius: '8px 8px 0 0', cursor: 'grab', borderBottom: '1px solid #333',
        }}
        onMouseDown={(e) => {
          dragging.current = true;
          offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>
          🔍 Rerender Analyzer ({records.length})
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => store.clear()} title="Clear" style={btnStyle}>🗑</button>
          <button onClick={() => setMinimized((m) => !m)} style={btnStyle}>
            {minimized ? '▲' : '▼'}
          </button>
          <button onClick={() => setVisible(false)} title="Hide" style={btnStyle}>✕</button>
        </div>
      </div>
      {!minimized && (
        <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
          <button
            onClick={() => setTab('log')}
            style={{ ...tabStyle, borderBottom: tab === 'log' ? '2px solid #cdd6f4' : '2px solid transparent', color: tab === 'log' ? '#cdd6f4' : '#666' }}
          >
            Log
          </button>
          <button
            onClick={() => setTab('hot')}
            style={{ ...tabStyle, borderBottom: tab === 'hot' ? '2px solid #ff9800' : '2px solid transparent', color: tab === 'hot' ? '#ff9800' : '#666' }}
          >
            🔥 Hot
          </button>
        </div>
      )}
      {!minimized && tab === 'log' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {records.length === 0
            ? <div style={{ padding: '20px', color: '#555', textAlign: 'center', fontSize: '12px' }}>No renders recorded yet. Wrap components with track().</div>
            : [...records].reverse().map((r, i) => <RecordRow key={i} record={r} />)
          }
        </div>
      )}
      {!minimized && tab === 'hot' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {counts.length === 0
            ? <div style={{ padding: '20px', color: '#555', textAlign: 'center', fontSize: '12px' }}>No renders recorded yet.</div>
            : counts.map(({ name, count }) => {
                const max = counts[0].count;
                const pct = Math.round((count / max) * 100);
                return (
                  <div
                    key={name}
                    style={{ padding: '6px 8px', borderBottom: '1px solid #333', cursor: 'default' }}
                    onMouseEnter={() => highlightComponent(name)}
                    onMouseLeave={() => unhighlightComponent(name)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: 'bold' }}>{name}</span>
                      <span style={{ color: count > 20 ? '#ff5252' : count > 5 ? '#ff9800' : '#69f0ae', fontSize: '12px', fontWeight: 'bold' }}>
                        × {count}
                      </span>
                    </div>
                    <div style={{ height: '3px', background: '#2a2a2a', borderRadius: '2px' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px', width: `${pct}%`,
                        background: count > 20 ? '#ff5252' : count > 5 ? '#ff9800' : '#69f0ae',
                      }} />
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

const btnStyle: CSSProperties = {
  background: 'transparent', border: 'none', color: '#888',
  cursor: 'pointer', fontSize: '14px', padding: '2px 4px', lineHeight: 1,
};

const tabStyle: CSSProperties = {
  flex: 1, background: 'transparent', border: 'none',
  cursor: 'pointer', fontSize: '11px', padding: '5px 0',
  fontFamily: 'monospace', transition: 'color 0.15s',
};
