/**
 * Centralised Local Storage service for Élan Kitchen.
 *
 * - All reads are defensive: invalid JSON or wrong shapes never crash the app.
 * - All writes surface quota errors as a typed StorageError so the UI can react.
 * - Falls back to an in-memory store when Local Storage is unavailable
 *   (e.g. disabled cookies / some private browsing modes).
 * - Emits change events so React contexts can re-render after mutations.
 */
import { COLLECTION_KEYS } from '../utils/constants';
import { generateId, nowISO } from '../utils/helpers';

export class StorageError extends Error {
  constructor(message, code = 'STORAGE_ERROR', cause) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.cause = cause;
  }
}

/* ---------- backing store ---------- */

const memoryStore = (() => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
  };
})();

let backend = null;
let usingMemory = false;

const resolveBackend = () => {
  if (backend) return backend;
  try {
    const ls = globalThis.localStorage;
    const probe = '__elan_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    backend = ls;
  } catch {
    backend = memoryStore;
    usingMemory = true;
  }
  return backend;
};

/** Test hook: reset the resolved backend (used by unit tests). */
export const __resetBackend = () => {
  backend = null;
  usingMemory = false;
};

export const isPersistent = () => {
  resolveBackend();
  return !usingMemory;
};

/* ---------- events ---------- */

const listeners = new Set();

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const emit = (event) => {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error('[storage] listener failed', e);
    }
  });
};

/* ---------- primitives ---------- */

const isQuotaError = (e) =>
  e instanceof DOMException &&
  (e.code === 22 || e.code === 1014 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

export const readRaw = (key) => {
  try {
    return resolveBackend().getItem(key);
  } catch (e) {
    console.error(`[storage] could not read "${key}"`, e);
    return null;
  }
};

/**
 * Read and parse a JSON value. Returns `fallback` when the key is missing
 * or the stored value is not valid JSON (an `invalid` event is emitted).
 */
export const read = (key, fallback = null) => {
  const raw = readRaw(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[storage] invalid JSON in "${key}", using fallback (${e.message})`);
    emit({ type: 'invalid', key });
    return fallback;
  }
};

export const write = (key, value, { silent = false } = {}) => {
  let serialised;
  try {
    serialised = JSON.stringify(value);
  } catch (e) {
    throw new StorageError('Data could not be serialised for storage.', 'SERIALIZE_ERROR', e);
  }
  try {
    resolveBackend().setItem(key, serialised);
  } catch (e) {
    if (isQuotaError(e)) {
      emit({ type: 'quota', key });
      throw new StorageError(
        'Browser storage is full. Try using a smaller image or removing unused data.',
        'QUOTA_EXCEEDED',
        e,
      );
    }
    throw new StorageError('Could not save data to browser storage.', 'WRITE_ERROR', e);
  }
  if (!silent) emit({ type: 'change', key });
  return value;
};

export const removeKey = (key, { silent = false } = {}) => {
  try {
    resolveBackend().removeItem(key);
    if (!silent) emit({ type: 'change', key });
  } catch (e) {
    console.error(`[storage] could not remove "${key}"`, e);
  }
};

/* ---------- collection CRUD ---------- */

/** Read a collection; always returns an array of objects. */
export const getAll = (key) => {
  const data = read(key, []);
  if (!Array.isArray(data)) {
    emit({ type: 'invalid', key });
    return [];
  }
  return data.filter((item) => item && typeof item === 'object');
};

export const setAll = (key, records) => write(key, Array.isArray(records) ? records : []);

export const findById = (key, id) => getAll(key).find((r) => r.id === id) || null;

export const filterBy = (key, predicate) => getAll(key).filter(predicate);

export const findOne = (key, predicate) => getAll(key).find(predicate) || null;

export const create = (key, data) => {
  const ts = nowISO();
  const record = { id: generateId(), createdAt: ts, updatedAt: ts, ...data };
  const all = getAll(key);
  all.push(record);
  setAll(key, all);
  return record;
};

export const update = (key, id, patch) => {
  const all = getAll(key);
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) throw new StorageError('Record not found.', 'NOT_FOUND');
  const next = typeof patch === 'function' ? patch(all[idx]) : { ...all[idx], ...patch };
  all[idx] = { ...next, id: all[idx].id, createdAt: all[idx].createdAt, updatedAt: nowISO() };
  setAll(key, all);
  return all[idx];
};

export const remove = (key, id) => {
  const all = getAll(key);
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  setAll(key, next);
  return true;
};

export const removeWhere = (key, predicate) => {
  const all = getAll(key);
  const next = all.filter((r) => !predicate(r));
  if (next.length !== all.length) setAll(key, next);
  return all.length - next.length;
};

export const updateWhere = (key, predicate, updater) => {
  const all = getAll(key);
  let changed = 0;
  const next = all.map((r) => {
    if (!predicate(r)) return r;
    changed += 1;
    return { ...updater(r), updatedAt: nowISO() };
  });
  if (changed) setAll(key, next);
  return changed;
};

/* ---------- validation & repair ---------- */

/**
 * Validates every collection key. Keys holding invalid JSON or non-array data
 * are backed up (when space allows) and reset to an empty array so the app can
 * keep running. Records without an id are dropped. Returns a report.
 */
export const validateStoredData = () => {
  const report = { repaired: [], droppedRecords: 0 };
  COLLECTION_KEYS.forEach((key) => {
    const raw = readRaw(key);
    if (raw === null) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
    if (!Array.isArray(parsed)) {
      try {
        resolveBackend().setItem(`${key}__corrupt_backup`, raw);
      } catch {
        /* backup is best-effort */
      }
      write(key, [], { silent: true });
      report.repaired.push(key);
      return;
    }
    const clean = parsed.filter((r) => r && typeof r === 'object' && typeof r.id === 'string');
    if (clean.length !== parsed.length) {
      report.droppedRecords += parsed.length - clean.length;
      write(key, clean, { silent: true });
      if (!report.repaired.includes(key)) report.repaired.push(key);
    }
  });
  return report;
};

const storageService = {
  read,
  readRaw,
  write,
  removeKey,
  getAll,
  setAll,
  findById,
  findOne,
  filterBy,
  create,
  update,
  remove,
  removeWhere,
  updateWhere,
  validateStoredData,
  subscribe,
  isPersistent,
};

export default storageService;
