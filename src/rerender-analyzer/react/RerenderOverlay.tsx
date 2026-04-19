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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: '#e0e0e0', fontWeight: 'bold' }}>{record.name}</span>
        <span style={{ color: reasonColor, fontSize: '11px', background: '#2a2a2a', borderRadius: '3px', padding: '1px 5px' }}>
          {record.reason}
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
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 380, y: 20 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => store.subscribe(() => setRecords(store.getLast(50))), []);

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
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {records.length === 0
            ? (
              <div style={{ padding: '20px', color: '#555', textAlign: 'center', fontSize: '12px' }}>
                No renders recorded yet. Wrap components with track().
              </div>
            )
            : [...records].reverse().map((r, i) => <RecordRow key={i} record={r} />)
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
