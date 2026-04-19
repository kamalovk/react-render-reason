import { RenderReason } from './analyzeRender';

export interface RenderRecord {
  name: string;
  changes: string[];
  reason: RenderReason;
  tips?: string[];
  parent?: string;
  timestamp: number;
}

const MAX_RECORDS = 1000;

function createStore() {
  let records: RenderRecord[] = [];
  const listeners = new Set<() => void>();

  function notify() {
    for (const fn of listeners) fn();
  }

  return {
    add(record: Omit<RenderRecord, 'timestamp'>): void {
      const entry: RenderRecord = { ...record, timestamp: Date.now() };
      records.push(entry);
      if (records.length > MAX_RECORDS) {
        records = records.slice(records.length - MAX_RECORDS);
      }
      notify();
    },

    getAll(): RenderRecord[] {
      return records.slice();
    },

    getLast(n = 50): RenderRecord[] {
      return records.slice(-n);
    },

    clear(): void {
      records = [];
      notify();
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const store = createStore();
