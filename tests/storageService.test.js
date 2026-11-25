import { beforeEach, describe, expect, it } from 'vitest';
import storage, { StorageError, __resetBackend } from '../src/services/storageService';
import { STORAGE_KEYS } from '../src/utils/constants';

beforeEach(() => {
  localStorage.clear();
  __resetBackend();
});

describe('storageService CRUD', () => {
  it('creates records with UUID and ISO timestamps', () => {
    const r = storage.create('elan_test', { name: 'Basil' });
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(r.createdAt).toISOString()).toBe(r.createdAt);
    expect(storage.getAll('elan_test')).toHaveLength(1);
  });

  it('reads, finds, filters, updates and deletes', () => {
    const a = storage.create('elan_test', { name: 'A', n: 1 });
    storage.create('elan_test', { name: 'B', n: 2 });
    expect(storage.findById('elan_test', a.id).name).toBe('A');
    expect(storage.filterBy('elan_test', (r) => r.n > 1)).toHaveLength(1);
    const u = storage.update('elan_test', a.id, { name: 'A2' });
    expect(u.name).toBe('A2');
    expect(u.createdAt).toBe(a.createdAt);
    expect(storage.remove('elan_test', a.id)).toBe(true);
    expect(storage.findById('elan_test', a.id)).toBeNull();
  });

  it('throws NOT_FOUND when updating a missing record', () => {
    expect(() => storage.update('elan_test', 'nope', {})).toThrow(StorageError);
  });

  it('returns fallback for invalid JSON instead of crashing', () => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, '{not json');
    expect(storage.getAll(STORAGE_KEYS.RECIPES)).toEqual([]);
    expect(storage.read(STORAGE_KEYS.RECIPES, 'fallback')).toBe('fallback');
  });

  it('validateStoredData repairs corrupt and non-array keys and drops id-less records', () => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, '{broken');
    localStorage.setItem(STORAGE_KEYS.FAVORITES, '{"a":1}');
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([{ id: 'x' }, { noId: true }, null]));
    const report = storage.validateStoredData();
    expect(report.repaired).toEqual(expect.arrayContaining([STORAGE_KEYS.RECIPES, STORAGE_KEYS.FAVORITES, STORAGE_KEYS.REVIEWS]));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES))).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS))).toEqual([{ id: 'x' }]);
    expect(localStorage.getItem(`${STORAGE_KEYS.RECIPES}__corrupt_backup`)).toBe('{broken');
  });

  it('surfaces quota errors as StorageError(QUOTA_EXCEEDED)', () => {
    localStorage.quota = 10;
    let err;
    try {
      storage.write('elan_big', 'x'.repeat(100));
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(StorageError);
    expect(err.code).toBe('QUOTA_EXCEEDED');
  });
});
