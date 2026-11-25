/**
 * First-launch initialisation and start-up validation.
 *
 * Seed data is written ONLY when the app has never been initialised.
 * On every subsequent launch existing data is validated/repaired in place —
 * it is never reset or overwritten.
 */
import { DEMO_ACCOUNTS, ROLES, SCHEMA_VERSION, STORAGE_KEYS } from '../utils/constants';
import { buildSeedData } from '../data/seedData';
import storage from './storageService';
import { buildUserRecord } from './authService';

const K = STORAGE_KEYS;

const hasExistingData = () => [K.USERS, K.RECIPES].some((k) => storage.readRaw(k) !== null);

const migrate = (fromVersion) => {
  // Placeholder for future schema migrations. v1 is the initial schema.
  if (fromVersion < SCHEMA_VERSION) storage.write(K.SCHEMA_VERSION, SCHEMA_VERSION, { silent: true });
};

/** Ensure there is always at least one administrator (repairs tampered data). */
const ensureAdminExists = async () => {
  const users = storage.getAll(K.USERS);
  if (users.some((u) => u.role === ROLES.ADMIN)) return false;
  const admin = await buildUserRecord({ name: 'Élan Studio Admin', email: DEMO_ACCOUNTS.admin.email, password: DEMO_ACCOUNTS.admin.password, role: ROLES.ADMIN });
  const withoutDup = users.filter((u) => u.email !== admin.email);
  storage.setAll(K.USERS, [admin, ...withoutDup]);
  return true;
};

/**
 * @returns {Promise<{seeded:boolean, repaired:string[], persistent:boolean}>}
 */
export const initializeApp = async () => {
  const initialized = storage.read(K.INITIALIZED, false) === true;

  if (!initialized && !hasExistingData()) {
    const data = await buildSeedData(buildUserRecord);
    storage.setAll(K.USERS, data.users);
    storage.setAll(K.CATEGORIES, data.categories);
    storage.setAll(K.RECIPES, data.recipes);
    storage.setAll(K.REVIEWS, data.reviews);
    storage.setAll(K.FAVORITES, data.favorites);
    storage.setAll(K.COLLECTIONS, data.collections);
    storage.setAll(K.MEAL_PLANS, data.mealPlans);
    storage.setAll(K.SHOPPING_LISTS, data.shoppingLists);
    storage.setAll(K.RECENTLY_VIEWED, data.recentlyViewed);
    storage.setAll(K.PREFERENCES, data.preferences);
    storage.setAll(K.ACTIVITY_LOGS, data.activityLogs);
    storage.setAll(K.CONTACT_MESSAGES, data.contactMessages);
    storage.write(K.SCHEMA_VERSION, SCHEMA_VERSION);
    // Flag is written last so a failed seed is retried on next launch.
    storage.write(K.INITIALIZED, true);
    return { seeded: true, repaired: [], persistent: storage.isPersistent() };
  }

  if (!initialized) storage.write(K.INITIALIZED, true, { silent: true });
  const version = Number(storage.read(K.SCHEMA_VERSION, 0)) || 0;
  migrate(version);
  const report = storage.validateStoredData();
  const adminRestored = await ensureAdminExists();
  if (adminRestored) report.repaired.push('admin account');
  return { seeded: false, repaired: report.repaired, persistent: storage.isPersistent() };
};

export default { initializeApp };
