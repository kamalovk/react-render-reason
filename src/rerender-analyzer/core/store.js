/**
 * RenderRecord — одна запись о ререндере.
 * @typedef {{ name: string, changes: string[], reason: string, tips?: string[], timestamp: number }} RenderRecord
 */

const MAX_RECORDS = 1000;

/**
 * Простой FIFO-стор для хранения записей о ререндерах.
 * Не зависит от React.
 */
function createStore() {
  /** @type {RenderRecord[]} */
  let records = [];

  /** @type {Set<() => void>} */
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) fn();
  }

  return {
    /**
     * Добавить запись о ререндере.
     * @param {Omit<RenderRecord, 'timestamp'>} record
     */
    add(record) {
      const entry = { ...record, timestamp: Date.now() };
      records.push(entry);
      // FIFO: удаляем старые записи при превышении лимита
      if (records.length > MAX_RECORDS) {
        records = records.slice(records.length - MAX_RECORDS);
      }
      notify();
    },

    /** Вернуть снимок всех записей (новейшие последними). */
    getAll() {
      return records.slice();
    },

    /** Вернуть последние N записей. */
    getLast(n = 50) {
      return records.slice(-n);
    },

    /** Очистить стор. */
    clear() {
      records = [];
      notify();
    },

    /**
     * Подписаться на изменения.
     * @param {() => void} listener
     * @returns {() => void} функция отписки
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Глобальный синглтон стора. */
export const store = createStore();
