import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import userService from '../services/userService';
import storage from '../services/storageService';
import { ROLES, STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

const REASON_MESSAGES = {
  blocked: 'Your account has been blocked by an administrator. You have been signed out.',
  deleted: 'Your account no longer exists. You have been signed out.',
  expired: 'Your session has expired. Please sign in again.',
};

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => authService.getSessionUser().user);
  const userRef = useRef(user);
  const setUser = useCallback((u) => {
    userRef.current = u;
    setUserState(u);
  }, []);

  /** Re-check the stored session against current user records. */
  const revalidate = useCallback(() => {
    const { user: current, reason } = authService.getSessionUser();
    const prev = userRef.current;
    if (prev && !current && reason) toast.error(REASON_MESSAGES[reason], { id: 'session-invalid', duration: 6000 });
    const unchanged = (!prev && !current) || (prev && current && JSON.stringify(prev) === JSON.stringify(current));
    if (!unchanged) setUser(current);
    return current;
  }, [setUser]);

  useEffect(() => {
    revalidate();
    const unsub = storage.subscribe((evt) => {
      if (evt.key === STORAGE_KEYS.USERS || evt.key === STORAGE_KEYS.SESSION) revalidate();
    });
    // Cross-tab: react when another tab changes users or the session.
    const onStorage = (e) => {
      if (!e.key || e.key === STORAGE_KEYS.USERS || e.key === STORAGE_KEYS.SESSION) revalidate();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', revalidate);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', revalidate);
    };
  }, [revalidate]);

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    return u;
  }, [setUser]);

  const signup = useCallback(async (data) => {
    const u = await authService.signup(data);
    setUser(u);
    return u;
  }, [setUser]);

  const logout = useCallback(() => {
    userRef.current = null;
    authService.logout();
    setUser(null);
  }, [setUser]);

  const updateProfile = useCallback((data) => {
    const u = userService.updateProfile(user, data);
    setUser(u);
    return u;
  }, [user, setUser]);

  const changePassword = useCallback((data) => authService.changePassword(user?.id, data), [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === ROLES.ADMIN,
      login,
      signup,
      logout,
      revalidate,
      updateProfile,
      changePassword,
    }),
    [user, login, signup, logout, revalidate, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
