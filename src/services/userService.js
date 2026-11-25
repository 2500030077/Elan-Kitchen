/**
 * User domain service: profiles, preferences, recently viewed,
 * contact messages and administrative user management.
 */
import { ACTIVITY_ACTIONS, MAX_RECENTLY_VIEWED, RECIPE_STATUS, ROLES, STORAGE_KEYS, USER_STATUS } from '../utils/constants';
import { normalizeEmail } from '../utils/helpers';
import { isValidEmail, validateContact, validateName } from '../utils/validation';
import storage from './storageService';
import { findUserByEmail, sanitizeUser } from './authService';
import { cascadeDeleteRecipe, DomainError } from './recipeService';
import { logActivity } from './activityService';

const K = STORAGE_KEYS;

export const getUsers = () => storage.getAll(K.USERS).map(sanitizeUser);
export const getUserById = (id) => sanitizeUser(storage.findById(K.USERS, id));

export const updateProfile = (actor, { name, email, avatar, bio }) => {
  if (!actor?.id) throw new DomainError('You must be signed in.', 'UNAUTHENTICATED');
  const errors = {};
  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;
  if (!email?.trim()) errors.email = 'Email address is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  else {
    const other = findUserByEmail(email);
    if (other && other.id !== actor.id) errors.email = 'Another account already uses this email.';
  }
  if ((bio || '').length > 240) errors.bio = 'Bio must be 240 characters or fewer.';
  if (Object.keys(errors).length) throw new DomainError('Please fix the highlighted fields.', 'VALIDATION', errors);
  const patch = { name: name.trim(), email: normalizeEmail(email), bio: (bio || '').trim() };
  if (avatar !== undefined) patch.avatar = avatar;
  return sanitizeUser(storage.update(K.USERS, actor.id, patch));
};

/* ---------- preferences ---------- */

export const getPreferences = (userId) =>
  storage.findOne(K.PREFERENCES, (p) => p.userId === userId) || { userId, dietary: [], cuisines: [] };

export const savePreferences = (userId, { dietary = [], cuisines = [] }) => {
  const existing = storage.findOne(K.PREFERENCES, (p) => p.userId === userId);
  if (existing) return storage.update(K.PREFERENCES, existing.id, { dietary, cuisines });
  return storage.create(K.PREFERENCES, { userId, dietary, cuisines });
};

/* ---------- recently viewed ---------- */

export const getRecentlyViewed = (userId) => storage.findOne(K.RECENTLY_VIEWED, (r) => r.userId === userId)?.recipeIds || [];

export const addRecentlyViewed = (userId, recipeId) => {
  if (!userId || !recipeId) return;
  const existing = storage.findOne(K.RECENTLY_VIEWED, (r) => r.userId === userId);
  const ids = [recipeId, ...(existing?.recipeIds || []).filter((id) => id !== recipeId)].slice(0, MAX_RECENTLY_VIEWED);
  if (existing) storage.update(K.RECENTLY_VIEWED, existing.id, { recipeIds: ids });
  else storage.create(K.RECENTLY_VIEWED, { userId, recipeIds: ids });
};

/* ---------- contact ---------- */

export const saveContactMessage = (data, userId = null) => {
  const errors = validateContact(data);
  if (Object.keys(errors).length) throw new DomainError('Please fix the highlighted fields.', 'VALIDATION', errors);
  return storage.create(K.CONTACT_MESSAGES, {
    userId,
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    subject: data.subject.trim(),
    message: data.message.trim(),
  });
};

/* ---------- admin user management ---------- */

const requireAdmin = (admin) => {
  if (admin?.role !== ROLES.ADMIN) throw new DomainError('Administrator access is required.', 'FORBIDDEN');
};

const guardTarget = (admin, targetId, verb) => {
  requireAdmin(admin);
  if (admin.id === targetId) throw new DomainError(`You cannot ${verb} your own account.`, 'FORBIDDEN');
  const target = storage.findById(K.USERS, targetId);
  if (!target) throw new DomainError('User not found.', 'NOT_FOUND');
  if (target.role === ROLES.ADMIN) throw new DomainError(`Administrator accounts cannot be ${verb}ed here.`, 'FORBIDDEN');
  return target;
};

export const blockUser = (admin, userId) => {
  const target = guardTarget(admin, userId, 'block');
  const updated = storage.update(K.USERS, userId, { status: USER_STATUS.BLOCKED });
  logActivity(admin, { action: ACTIVITY_ACTIONS.USER_BLOCKED, entityType: 'User', entityId: userId, entityName: `${target.name} (${target.email})` });
  return sanitizeUser(updated);
};

export const unblockUser = (admin, userId) => {
  const target = guardTarget(admin, userId, 'unblock');
  const updated = storage.update(K.USERS, userId, { status: USER_STATUS.ACTIVE });
  logActivity(admin, { action: ACTIVITY_ACTIONS.USER_UNBLOCKED, entityType: 'User', entityId: userId, entityName: `${target.name} (${target.email})` });
  return sanitizeUser(updated);
};

/**
 * Delete a regular user and their personal data.
 * - Favorites, collections, reviews, meal plans, shopping lists,
 *   preferences and recently-viewed records are removed.
 * - Their pending/rejected recipes are deleted (with full cascade).
 * - Their approved recipes stay published, credited to “Élan Community”,
 *   so other members' favorites, collections and plans keep working.
 */
export const deleteUser = (admin, userId) => {
  const target = guardTarget(admin, userId, 'delete');
  const owned = storage.filterBy(K.RECIPES, (r) => r.authorId === userId);
  owned.filter((r) => r.status !== RECIPE_STATUS.APPROVED).forEach((r) => cascadeDeleteRecipe(r.id));
  storage.updateWhere(
    K.RECIPES,
    (r) => r.authorId === userId,
    (r) => ({ ...r, authorId: null, authorName: 'Élan Community' }),
  );
  [K.FAVORITES, K.COLLECTIONS, K.REVIEWS, K.MEAL_PLANS, K.SHOPPING_LISTS, K.PREFERENCES, K.RECENTLY_VIEWED].forEach((key) =>
    storage.removeWhere(key, (r) => r.userId === userId),
  );
  storage.remove(K.USERS, userId);
  logActivity(admin, {
    action: ACTIVITY_ACTIONS.USER_DELETED,
    entityType: 'User',
    entityId: userId,
    entityName: `${target.name} (${target.email})`,
    details: `${owned.length} submitted recipe(s) handled`,
  });
  return true;
};

const userService = {
  getUsers,
  getUserById,
  updateProfile,
  getPreferences,
  savePreferences,
  getRecentlyViewed,
  addRecentlyViewed,
  saveContactMessage,
  blockUser,
  unblockUser,
  deleteUser,
};

export default userService;
