// Minimal in-memory Local Storage for Node-based unit tests.
class MemoryStorage {
  constructor() { this.map = new Map(); this.quota = Infinity; }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) {
    const s = String(v);
    if (s.length > this.quota) {
      const e = new DOMException('Quota exceeded', 'QuotaExceededError');
      throw e;
    }
    this.map.set(k, s);
  }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); this.quota = Infinity; }
}
globalThis.localStorage = new MemoryStorage();
