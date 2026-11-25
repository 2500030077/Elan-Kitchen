import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/** Wraps an action so guests are sent to login (and returned afterwards). */
export default function useRequireAuthAction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (fn, message = 'Please sign in to continue.') =>
      (...args) => {
        if (!user) {
          toast(message, { icon: '🔒' });
          navigate('/login', { state: { from: location } });
          return undefined;
        }
        return fn(...args);
      },
    [user, navigate, location],
  );
}
