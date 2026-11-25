import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { initializeApp } from '../services/initService';
import storage from '../services/storageService';

const AppContext = createContext(null);

/**
 * Boots the application (first-launch seeding / validation) and exposes
 * app-wide UI state: initialisation status, storage health and the mobile nav.
 */
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [persistent, setPersistent] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const boot = useCallback(async () => {
    setInitError(null);
    try {
      const result = await initializeApp();
      setPersistent(result.persistent);
      if (result.repaired.length) {
        toast(`Some saved data was unreadable and has been repaired (${result.repaired.join(', ')}).`, { icon: '🛠️', duration: 6000 });
      }
      if (!result.persistent) {
        toast.error('Browser storage is unavailable — changes will be lost when you close this tab.', { duration: 8000 });
      }
      setReady(true);
    } catch (e) {
      console.error('[init] failed', e);
      setInitError(e.message || 'Initialisation failed.');
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(
    () =>
      storage.subscribe((evt) => {
        if (evt.type === 'quota') toast.error('Browser storage is full. Try a smaller image or remove unused data.', { id: 'quota' });
      }),
    [],
  );

  const value = useMemo(
    () => ({ ready, initError, persistent, retryInit: boot, mobileNavOpen, setMobileNavOpen }),
    [ready, initError, persistent, boot, mobileNavOpen],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
