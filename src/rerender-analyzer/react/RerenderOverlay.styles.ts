// Source of truth: RerenderOverlay.css
// Edit that file, then sync here. This string is injected into Shadow DOM.
export const RA_STYLES = `
.ra-overlay {
  position: fixed;
  width: 360px;
  z-index: 999999;
  background: var(--ra-bg);
  color: var(--ra-text);
  border: 1px solid var(--ra-border);
  border-radius: 8px;
  font-family: monospace;
  box-shadow: 0 4px 24px var(--ra-shadow);
  display: flex;
  flex-direction: column;
  user-select: none;
}
.ra-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--ra-surface);
  border-radius: 8px 8px 0 0;
  cursor: grab;
  border-bottom: 1px solid var(--ra-border);
}
.ra-title { font-size: 12px; font-weight: bold; }
.ra-toolbar { display: flex; gap: 2px; align-items: center; }
.ra-btn {
  background: transparent;
  border: none;
  color: var(--ra-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 5px;
  line-height: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}
.ra-btn:hover { background: var(--ra-badge-bg); }
.ra-sep { width: 1px; height: 14px; background: var(--ra-border); margin: 0 2px; }
.ra-tabs { display: flex; border-bottom: 1px solid var(--ra-border); }
.ra-tab {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 11px;
  padding: 5px 0;
  font-family: monospace;
  color: var(--ra-muted);
  transition: color 0.15s, border-color 0.15s;
}
.ra-filter { padding: 4px 8px; border-bottom: 1px solid var(--ra-border); }
.ra-filter-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--ra-input-bg);
  border: 1px solid var(--ra-input-border);
  border-radius: 4px;
  color: var(--ra-text);
  font-size: 11px;
  padding: 4px 6px;
  font-family: monospace;
  outline: none;
}
.ra-list { overflow-y: auto; flex: 1; }
.ra-empty { padding: 20px; text-align: center; font-size: 12px; color: var(--ra-dim); }
.ra-record {
  border-bottom: 1px solid var(--ra-border);
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.5;
  cursor: default;
}
.ra-record-header { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ra-record-name { color: var(--ra-text); font-weight: bold; }
.ra-badge { font-size: 11px; background: var(--ra-badge-bg); border-radius: 3px; padding: 1px 5px; }
.ra-badge-dur { font-size: 11px; border-radius: 3px; padding: 1px 5px; }
.ra-record-parent { color: #607d8b; font-size: 11px; }
.ra-changes { margin-top: 3px; }
.ra-prop-row { font-size: 11px; display: flex; gap: 4px; align-items: baseline; flex-wrap: wrap; }
.ra-prop-key  { color: #90caf9; }
.ra-prop-prev { color: #ef9a9a; text-decoration: line-through; opacity: 0.8; }
.ra-prop-arrow { color: var(--ra-muted); }
.ra-prop-next { color: #a5d6a7; }
.ra-props-list { color: #90caf9; font-size: 11px; }
.ra-tips { color: #ffcc80; margin-top: 2px; font-style: italic; }
.ra-time { font-size: 10px; margin-top: 2px; color: var(--ra-dim); }
.ra-hot-row { padding: 6px 8px; border-bottom: 1px solid var(--ra-border); cursor: default; }
.ra-hot-row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.ra-hot-name { font-size: 12px; font-weight: bold; color: var(--ra-text); }
.ra-hot-count { font-size: 12px; font-weight: bold; }
.ra-bar-track { height: 3px; background: var(--ra-bar-bg); border-radius: 2px; }
.ra-bar-fill { height: 100%; border-radius: 2px; transition: width 0.2s; }
.ra-settings { overflow-y: auto; flex: 1; padding: 16px; }
.ra-settings-label {
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--ra-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.ra-theme-btns { display: flex; gap: 8px; }
.ra-theme-btn {
  flex: 1;
  padding: 10px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
  transition: all 0.15s;
  background: var(--ra-surface);
  color: var(--ra-muted);
  border: 1px solid var(--ra-border);
}
.ra-restore {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 999999;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  font-family: monospace;
  background: var(--ra-surface);
  color: var(--ra-text);
  border: 1px solid var(--ra-border);
}
`;
