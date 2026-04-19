import { useState, useEffect, useRef } from 'react';
import { store } from '../core/store.js';

function RecordRow({ record }) {
  return (
    <div style={{ borderBottom: '1px solid #333', padding: '4px 6px', fontSize: '12px' }}>
      <span style={{ fontWeight: 'bold' }}>{record.name}</span>
      {' · '}
      <span>{record.reason}</span>
      {record.parent && <span style={{ color: '#888' }}> ← {record.parent}</span>}
      {record.changes.length > 0 && <div>props: {record.changes.join(', ')}</div>}
      {record.tips && record.tips.map((tip, i) => (
        <div key={i} style={{ color: '#aaa' }}>tip: {tip}</div>
      ))}
    </div>
  );
}

export function RerenderOverlay() {
  const [records, setRecords] = useState(() => store.getLast(50));
  const [open, setOpen] = useState(true);
  const [pos, setPos] = useState({ x: window.innerWidth - 360, y: 16 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => store.subscribe(() => setRecords(store.getLast(50))), []);

  useEffect(() => {
    const onMove = (e) => {
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

  return (
    <div style={{
      position: 'fixed', top: pos.y, left: pos.x,
      width: 340, maxHeight: 460, zIndex: 99999,
      background: '#111', color: '#ddd', border: '1px solid #444',
      fontFamily: 'monospace', fontSize: '12px',
      display: 'flex', flexDirection: 'column', userSelect: 'none',
    }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '4px 8px', background: '#222',
          cursor: 'grab', borderBottom: '1px solid #444',
        }}
        onMouseDown={(e) => {
          dragging.current = true;
          offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        }}
      >
        <span>rerender-analyzer ({records.length})</span>
        <span>
          <button onClick={() => store.clear()} style={btn}>clear</button>
          <button onClick={() => setOpen((o) => !o)} style={btn}>{open ? '▼' : '▲'}</button>
        </span>
      </div>
      {open && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {records.length === 0
            ? <div style={{ padding: 8, color: '#555' }}>no renders yet</div>
            : [...records].reverse().map((r, i) => <RecordRow key={i} record={r} />)
          }
        </div>
      )}
    </div>
  );
}

const btn = { background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 4px' };
