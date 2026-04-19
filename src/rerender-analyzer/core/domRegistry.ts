const registry = new Map<string, Set<HTMLElement>>();
const EMPTY: ReadonlySet<HTMLElement> = new Set();

export const domRegistry = {
  register(name: string, el: HTMLElement): void {
    if (!registry.has(name)) registry.set(name, new Set());
    registry.get(name)!.add(el);
  },

  unregister(name: string, el: HTMLElement): void {
    registry.get(name)?.delete(el);
  },

  get(name: string): ReadonlySet<HTMLElement> {
    return registry.get(name) ?? EMPTY;
  },
};
