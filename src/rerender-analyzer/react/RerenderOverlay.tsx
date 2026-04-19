import { useState, useEffect, useRef, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { store } from '../core/store';
import { domRegistry } from '../core/domRegistry';
import { RenderRecord, PropDiffEntry } from '../core/store';
import { RA_STYLES } from './RerenderOverlay.styles';

// ─── Theme ───────────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light';

type ThemeVars = Record<string, string>;

function themeVars(theme: Theme): ThemeVars {
  if (theme === 'dark') return {
    '--ra-bg': '#1a1a1a', '--ra-surface': '#252525', '--ra-border': '#333',
    '--ra-text': '#e0e0e0', '--ra-muted': '#888', '--ra-dim': '#555',
    '--ra-input-bg': '#252525', '--ra-input-border': '#444',
    '--ra-badge-bg': '#2a2a2a', '--ra-bar-bg': '#2a2a2a',
    '--ra-shadow': 'rgba(0,0,0,0.6)',
    '--ra-dur-ok-bg': '#1a3a1a', '--ra-dur-warn-bg': '#4a1a1a',
  };
  return {
    '--ra-bg': '#f7f7f7', '--ra-surface': '#ebebeb', '--ra-border': '#d4d4d4',
    '--ra-text': '#1c1c1c', '--ra-muted': '#666', '--ra-dim': '#aaa',
    '--ra-input-bg': '#fff', '--ra-input-border': '#c8c8c8',
    '--ra-badge-bg': '#e0e0e0', '--ra-bar-bg': '#e0e0e0',
    '--ra-shadow': 'rgba(0,0,0,0.15)',
    '--ra-dur-ok-bg': '#e8f5e9', '--ra-dur-warn-bg': '#ffebee',
  };
}

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
  const slow = record.duration > 16;

  return (
    <div
      className="ra-record"
      onMouseEnter={() => highlightComponent(record.name)}
      onMouseLeave={() => unhighlightComponent(record.name)}
    >
      <div className="ra-record-header">
        <span className="ra-record-name">{record.name}</span>
        <span className="ra-badge" style={{ color: reasonColor }}>{record.reason}</span>
        <span
          className="ra-badge-dur"
          style={{
            background: slow ? 'var(--ra-dur-warn-bg)' : 'var(--ra-dur-ok-bg)',
            color: slow ? '#ff5252' : '#43a047',
            fontWeight: slow ? 'bold' : 'normal',
          }}
        >
          {slow ? '⚠ ' : ''}{record.duration.toFixed(2)}ms
        </span>
        {record.parent && <span className="ra-record-parent">← {record.parent}</span>}
      </div>
      {record.changes.length > 0 && (
        <div className="ra-changes">
          {record.propDiff
            ? record.changes.map((key) => {
                const entry: PropDiffEntry | undefined = record.propDiff![key];
                return (
                  <div key={key} className="ra-prop-row">
                    <span className="ra-prop-key">{key}:</span>
                    <span className="ra-prop-prev">{entry?.prev}</span>
                    <span className="ra-prop-arrow">→</span>
                    <span className="ra-prop-next">{entry?.next}</span>
                  </div>
                );
              })
            : <div className="ra-props-list">props: {record.changes.join(', ')}</div>
          }
        </div>
      )}
      {record.tips && record.tips.length > 0 && (
        <div className="ra-tips">
          {record.tips.map((tip, i) => <div key={i}>💡 {tip}</div>)}
        </div>
      )}
      <div className="ra-time">{new Date(record.timestamp).toLocaleTimeString()}</div>
    </div>
  );
}

export function RerenderOverlay() {
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const [records, setRecords] = useState<RenderRecord[]>(() => store.getLast(50));
  const [counts, setCounts] = useState(() => store.getCounts());
  const [tab, setTab] = useState<'log' | 'hot' | 'settings'>('log');
  const [filter, setFilter] = useState('');
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [pos, setPos] = useState({ x: window.innerWidth - 380, y: 20 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  pausedRef.current = paused;

  useEffect(() => {
    return store.subscribe(() => {
      if (pausedRef.current) return;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setRecords(store.getLast(50));
        setCounts(store.getCounts());
        rafRef.current = null;
      });
    });
  }, []);

  // When unpausing, immediately sync to latest store state
  useEffect(() => {
    if (!paused) {
      setRecords(store.getLast(50));
      setCounts(store.getCounts());
    }
  }, [paused]);

  // Shadow DOM setup
  useEffect(() => {
    let host = document.getElementById('__ra-host__') as HTMLDivElement | null;
    if (!host) {
      host = document.createElement('div');
      host.id = '__ra-host__';
      document.body.appendChild(host);
    }
    let root = host.shadowRoot;
    if (!root) {
      root = host.attachShadow({ mode: 'open' });
      const s = document.createElement('style');
      s.textContent = RA_STYLES;
      root.appendChild(s);
    }
    setShadowRoot(root);
    return () => { document.getElementById('__ra-host__')?.remove(); };
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

  if (!shadowRoot) return null;

  const vars = themeVars(theme) as CSSProperties;

  const content = !visible ? (
    <button
      className="ra-restore"
      style={vars}
      onClick={() => setVisible(true)}
    >
      🔍 Rerender Analyzer
    </button>
  ) : (
    <div
      className="ra-overlay"
      style={{ top: pos.y, left: pos.x, maxHeight: minimized ? 'auto' : '480px', ...vars }}
    >
      {/* ── Header ── */}
      <div
        className="ra-header"
        onMouseDown={(e) => {
          dragging.current = true;
          offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        }}
      >
        <span className="ra-title" style={{ color: paused ? '#ff9800' : undefined }}>
          {paused ? '⏸ ' : '🔍 '}Rerender Analyzer ({records.length})
        </span>
        <div className="ra-toolbar">
          <button
            className="ra-btn"
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Resume recording' : 'Pause recording'}
            style={{ color: paused ? '#ff9800' : undefined }}
          >
            {paused
              ? <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,2 14,8 3,14"/></svg>
              : <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="4" height="12"/><rect x="10" y="2" width="4" height="12"/></svg>
            }
          </button>
          <div className="ra-sep" />
          <button
            className="ra-btn"
            title="Export all records as JSON"
            onClick={() => {
              const data = JSON.stringify(store.getAll(), null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rerender-analyzer-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1v9M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="ra-btn" onClick={() => store.clear()} title="Clear all records">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 4h10M6 4V2h4v2M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="ra-sep" />
          <button className="ra-btn" onClick={() => setMinimized((m) => !m)} title={minimized ? 'Expand' : 'Minimize'}>
            {minimized
              ? <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            }
          </button>
          <button className="ra-btn" onClick={() => setVisible(false)} title="Hide overlay">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      {!minimized && (
        <div className="ra-tabs">
          <button
            className="ra-tab"
            onClick={() => setTab('log')}
            style={{ borderBottomColor: tab === 'log' ? '#cdd6f4' : 'transparent', color: tab === 'log' ? '#cdd6f4' : undefined }}
          >Log</button>
          <button
            className="ra-tab"
            onClick={() => setTab('hot')}
            style={{ borderBottomColor: tab === 'hot' ? '#ff9800' : 'transparent', color: tab === 'hot' ? '#ff9800' : undefined }}
          >🔥 Hot</button>
          <button
            className="ra-tab"
            onClick={() => setTab('settings')}
            style={{ borderBottomColor: tab === 'settings' ? 'var(--ra-text)' : 'transparent', color: tab === 'settings' ? 'var(--ra-text)' : undefined }}
          >⚙️ Settings</button>
        </div>
      )}

      {/* ── Filter ── */}
      {!minimized && tab !== 'settings' && (
        <div className="ra-filter">
          <input
            className="ra-filter-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name…"
          />
        </div>
      )}

      {/* ── Log tab ── */}
      {!minimized && tab === 'log' && (
        <div className="ra-list">
          {(() => {
            const filtered = filter
              ? [...records].reverse().filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()))
              : [...records].reverse();
            return filtered.length === 0
              ? <div className="ra-empty">{records.length === 0 ? 'No renders recorded yet. Wrap components with track().' : 'No matches.'}</div>
              : filtered.map((r, i) => <RecordRow key={i} record={r} />);
          })()}
        </div>
      )}

      {/* ── Hot tab ── */}
      {!minimized && tab === 'hot' && (
        <div className="ra-list">
          {(() => {
            const filtered = filter
              ? counts.filter(({ name }) => name.toLowerCase().includes(filter.toLowerCase()))
              : counts;
            if (filtered.length === 0) {
              return <div className="ra-empty">{counts.length === 0 ? 'No renders recorded yet.' : 'No matches.'}</div>;
            }
            const max = counts[0].count;
            return filtered.map(({ name, count }) => (
              <div
                key={name}
                className="ra-hot-row"
                onMouseEnter={() => highlightComponent(name)}
                onMouseLeave={() => unhighlightComponent(name)}
              >
                <div className="ra-hot-row-header">
                  <span className="ra-hot-name">{name}</span>
                  <span className="ra-hot-count" style={{ color: count > 20 ? '#ff5252' : count > 5 ? '#ff9800' : '#43a047' }}>
                    × {count}
                  </span>
                </div>
                <div className="ra-bar-track">
                  <div
                    className="ra-bar-fill"
                    style={{
                      width: `${Math.round((count / max) * 100)}%`,
                      background: count > 20 ? '#ff5252' : count > 5 ? '#ff9800' : '#43a047',
                    }}
                  />
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Settings tab ── */}
      {!minimized && tab === 'settings' && (
        <div className="ra-settings">
          <div className="ra-settings-label">Appearance</div>
          <div className="ra-theme-btns">
            <button
              className="ra-theme-btn"
              onClick={() => setTheme('dark')}
              style={theme === 'dark' ? { border: '2px solid #cdd6f4', background: '#1e1e2e', color: '#cdd6f4' } : undefined}
            >🌙 Dark</button>
            <button
              className="ra-theme-btn"
              onClick={() => setTheme('light')}
              style={theme === 'light' ? { border: '2px solid #ff9800', background: '#fff8ee', color: '#e65100' } : undefined}
            >☀️ Light</button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, shadowRoot);
}
