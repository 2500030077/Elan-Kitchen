/**
 * Academic demonstration authentication.
 *
 * Passwords are never stored in plaintext: each account stores a random
 * 16-byte salt and a PBKDF2-SHA-256 derived key (Web Crypto API).
 *
 * IMPORTANT: this runs entirely in the browser and uses Local Storage, which
 * any user can inspect or modify. It demonstrates correct password handling
 * patterns but is NOT production-grade security — a real deployment needs a
 * server that verifies credentials and enforces authorisation.
 */
import { STORAGE_KEYS, ROLES, USER_STATUS, SESSION_TTL_MS } from '../utils/constants';
import { generateId, normalizeEmail, nowISO } from '../utils/helpers';
import { validateLogin, validatePassword, validateSignup } from '../utils/validation';
import storage from './storageService';

export const PBKDF2_ITERATIONS = 120000;

export class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR', field) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.field = field;
  }
}

/* ---------- crypto helpers ---------- */

const toBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
};

const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const getSubtle = () => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new AuthError(
      'Secure password hashing requires a secure context (https or localhost).',
      'CRYPTO_UNAVAILABLE',
    );
  }
  return subtle;
};

export const hashPassword = async (password, saltB64, iterations = PBKDF2_ITERATIONS) => {
  const subtle = getSubtle();
  const salt = saltB64 ? fromBase64(saltB64) : globalThis.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, keyMaterial, 256);
  return { hash: toBase64(bits), salt: toBase64(salt), iterations };
};

/** Constant-time-ish string comparison to avoid trivially leaking timing. */
const safeEqual = (a = '', b = '') => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const verifyPassword = async (password, user) => {
  if (!user?.passwordHash || !user?.passwordSalt) return false;
  const { hash } = await hashPassword(password, user.passwordSalt, user.passwordIterations || PBKDF2_ITERATIONS);
  return safeEqual(hash, user.passwordHash);
};

/** Remove credential material before handing a user object to the UI. */
export const sanitizeUser = (user) => {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, passwordSalt, passwordIterations, ...safe } = user;
  return safe;
};

/* ---------- account helpers ---------- */

export const findUserByEmail = (email) => {
  const target = normalizeEmail(email);
  return storage.getAll(STORAGE_KEYS.USERS).find((u) => normalizeEmail(u.email) === target) || null;
};

export const buildUserRecord = async ({ name, email, password, role = ROLES.USER, createdAt }) => {
  const { hash, salt, iterations } = await hashPassword(password);
  const ts = createdAt || nowISO();
  return {
    id: generateId(),
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash: hash,
    passwordSalt: salt,
    passwordIterations: iterations,
    role,
    status: USER_STATUS.ACTIVE,
    avatar: '',
    bio: '',
    createdAt: ts,
    updatedAt: ts,
  };
};

/* ---------- session ---------- */

const createSession = (user) => {
  const session = {
    token: generateId(),
    userId: user.id,
    role: user.role,
    createdAt: nowISO(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  storage.write(STORAGE_KEYS.SESSION, session);
  return session;
};

export const clearSession = (opts) => storage.removeKey(STORAGE_KEYS.SESSION, opts);

/**
 * Re-validates the stored session against the current user records.
 * Returns { user, reason } where reason explains an invalidated session.
 */
export const getSessionUser = () => {
  const session = storage.read(STORAGE_KEYS.SESSION, null);
  if (!session || typeof session !== 'object' || !session.userId) return { user: null, reason: null };
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    clearSession({ silent: true });
    return { user: null, reason: 'expired' };
  }
  const user = storage.findById(STORAGE_KEYS.USERS, session.userId);
  if (!user) {
    clearSession({ silent: true });
    return { user: null, reason: 'deleted' };
  }
  if (user.status === USER_STATUS.BLOCKED) {
    clearSession({ silent: true });
    return { user: null, reason: 'blocked' };
  }
  return { user: sanitizeUser(user), reason: null };
};

/* ---------- public API ---------- */

export const signup = async ({ name, email, password, confirmPassword, acceptTerms }) => {
  const errors = validateSignup({ name, email, password, confirmPassword, acceptTerms });
  const firstField = Object.keys(errors)[0];
  if (firstField) throw new AuthError(errors[firstField], 'VALIDATION', firstField);
  if (findUserByEmail(email)) {
    throw new AuthError('An account with this email already exists.', 'DUPLICATE_EMAIL', 'email');
  }
  // Role is always forced to "user" — administrators cannot self-register.
  const record = await buildUserRecord({ name, email, password, role: ROLES.USER });
  const users = storage.getAll(STORAGE_KEYS.USERS);
  users.push(record);
  storage.setAll(STORAGE_KEYS.USERS, users);
  createSession(record);
  return sanitizeUser(record);
};

export const login = async ({ email, password }) => {
  const errors = validateLogin({ email, password });
  const firstField = Object.keys(errors)[0];
  if (firstField) throw new AuthError(errors[firstField], 'VALIDATION', firstField);
  const user = findUserByEmail(email);
  const ok = user ? await verifyPassword(password, user) : false;
  if (!user || !ok) throw new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS');
  if (user.status === USER_STATUS.BLOCKED) {
    throw new AuthError('This account has been blocked by an administrator. Please contact support.', 'BLOCKED');
  }
  createSession(user);
  return sanitizeUser(user);
};

export const logout = () => clearSession();

export const changePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
  const user = storage.findById(STORAGE_KEYS.USERS, userId);
  if (!user) throw new AuthError('Account not found.', 'NOT_FOUND');
  if (!currentPassword) throw new AuthError('Enter your current password.', 'VALIDATION', 'currentPassword');
  if (!(await verifyPassword(currentPassword, user))) {
    throw new AuthError('Current password is incorrect.', 'INVALID_CREDENTIALS', 'currentPassword');
  }
  const pwErr = validatePassword(newPassword);
  if (pwErr) throw new AuthError(pwErr, 'VALIDATION', 'newPassword');
  if (newPassword !== confirmPassword) throw new AuthError('Passwords do not match.', 'VALIDATION', 'confirmPassword');
  if (await verifyPassword(newPassword, user)) {
    throw new AuthError('New password must be different from the current password.', 'VALIDATION', 'newPassword');
  }
  const { hash, salt, iterations } = await hashPassword(newPassword);
  storage.update(STORAGE_KEYS.USERS, userId, { passwordHash: hash, passwordSalt: salt, passwordIterations: iterations });
  return true;
};

const authService = { signup, login, logout, getSessionUser, changePassword, hashPassword, verifyPassword, sanitizeUser };
export default authService;
