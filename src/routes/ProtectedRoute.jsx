import { useLayoutEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

/**
 * Guards member routes. Re-validates the session (blocked/deleted accounts)
 * on every navigation. Administrators are sent to their own dashboard.
 */
export default function ProtectedRoute({ children }) {
  const { user, revalidate } = useAuth();
  const location = useLocation();

  useLayoutEffect(() => {
    revalidate();
  }, [location.pathname, revalidate]);

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role === ROLES.ADMIN) return <Navigate to="/admin/dashboard" replace />;
  return children || <Outlet />;
}

/** Redirects already-signed-in users away from login/signup. */
export function GuestOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === ROLES.ADMIN ? '/admin/dashboard' : '/user/dashboard'} replace />;
  return children || <Outlet />;
}
