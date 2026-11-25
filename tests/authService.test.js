import { beforeEach, describe, expect, it } from 'vitest';
import { __resetBackend } from '../src/services/storageService';
import authService, { AuthError } from '../src/services/authService';
import { STORAGE_KEYS } from '../src/utils/constants';

const valid = { name: 'Test Cook', email: 'Cook@Example.com', password: 'Secret123', confirmPassword: 'Secret123', acceptTerms: true };

beforeEach(() => {
  localStorage.clear();
  __resetBackend();
});

describe('authService', () => {
  it('registers a user with a salted PBKDF2 hash and never stores plaintext', async () => {
    const user = await authService.signup(valid);
    expect(user.role).toBe('user');
    expect(user.passwordHash).toBeUndefined();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    expect(raw).not.toContain('Secret123');
    const stored = JSON.parse(raw)[0];
    expect(stored.email).toBe('cook@example.com');
    expect(stored.passwordHash).toBeTruthy();
    expect(stored.passwordSalt).toBeTruthy();
  });

  it('prevents duplicate emails case-insensitively', async () => {
    await authService.signup(valid);
    await expect(authService.signup({ ...valid, email: 'COOK@example.COM' })).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL' });
  });

  it('validates signup input', async () => {
    await expect(authService.signup({ ...valid, password: 'short', confirmPassword: 'short' })).rejects.toBeInstanceOf(AuthError);
    await expect(authService.signup({ ...valid, confirmPassword: 'Other123' })).rejects.toMatchObject({ field: 'confirmPassword' });
    await expect(authService.signup({ ...valid, email: 'not-an-email' })).rejects.toMatchObject({ field: 'email' });
    await expect(authService.signup({ ...valid, acceptTerms: false })).rejects.toMatchObject({ field: 'acceptTerms' });
  });

  it('cannot self-register as admin', async () => {
    const user = await authService.signup({ ...valid, role: 'admin' });
    expect(user.role).toBe('user');
  });

  it('logs in, persists the session and logs out', async () => {
    await authService.signup(valid);
    authService.logout();
    expect(authService.getSessionUser().user).toBeNull();
    const user = await authService.login({ email: 'cook@example.com', password: 'Secret123' });
    expect(user.name).toBe('Test Cook');
    expect(authService.getSessionUser().user.id).toBe(user.id);
    authService.logout();
    expect(localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
  });

  it('rejects invalid passwords with a generic message', async () => {
    await authService.signup(valid);
    await expect(authService.login({ email: valid.email, password: 'Wrong1234' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(authService.login({ email: 'nobody@example.com', password: 'Wrong1234' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('blocks login and invalidates sessions for blocked users', async () => {
    const user = await authService.signup(valid);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    users[0].status = 'blocked';
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const res = authService.getSessionUser();
    expect(res.user).toBeNull();
    expect(res.reason).toBe('blocked');
    await expect(authService.login({ email: valid.email, password: valid.password })).rejects.toMatchObject({ code: 'BLOCKED' });
    expect(user.id).toBeTruthy();
  });

  it('invalidates sessions of deleted users', async () => {
    await authService.signup(valid);
    localStorage.setItem(STORAGE_KEYS.USERS, '[]');
    expect(authService.getSessionUser().reason).toBe('deleted');
  });

  it('changes password only with the correct current password', async () => {
    const user = await authService.signup(valid);
    await expect(authService.changePassword(user.id, { currentPassword: 'Bad12345', newPassword: 'NewPass123', confirmPassword: 'NewPass123' })).rejects.toMatchObject({ field: 'currentPassword' });
    await authService.changePassword(user.id, { currentPassword: 'Secret123', newPassword: 'NewPass123', confirmPassword: 'NewPass123' });
    authService.logout();
    await expect(authService.login({ email: valid.email, password: 'NewPass123' })).resolves.toBeTruthy();
  });
});
