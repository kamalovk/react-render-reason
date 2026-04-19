import { RenderReason } from './analyzeRender';

export interface PropDiffEntry {
  prev: string;
  next: string;
}

export interface RenderRecord {
  name: string;
  changes: string[];
  propDiff?: Record<string, PropDiffEntry>;
  reason: RenderReason;
  tips?: string[];
  parent?: string;
  timestamp: number;
  duration: number;
}

const MAX_RECORDS = 1000;

function createStore() {
  let records: RenderRecord[] = [];
  const counts = new Map<string, number>();
  const listeners = new Set<() => void>();

  function notify() {
    for (const fn of listeners) fn();
  }

  return {
    add(record: Omit<RenderRecord, 'timestamp'>): void {
      const entry: RenderRecord = { ...record, timestamp: Date.now() };
      records.push(entry);
      if (records.length > MAX_RECORDS) {
        records.splice(0, records.length - MAX_RECORDS);
      }
      counts.set(record.name, (counts.get(record.name) ?? 0) + 1);
      notify();
    },

    getAll(): RenderRecord[] {
      return records.slice();
    },

    getLast(n = 50): RenderRecord[] {
      return records.slice(-n);
    },

    getCounts(): Array<{ name: string; count: number }> {
      return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },

    clear(): void {
      records = [];
      counts.clear();
      notify();
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const store = createStore();
