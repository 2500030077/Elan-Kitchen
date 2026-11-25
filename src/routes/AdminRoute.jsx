import { useEffect, useLayoutEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

/** Only administrators may pass. Members are redirected with a notice. */
export default function AdminRoute({ children }) {
  const { user, revalidate } = useAuth();
  const location = useLocation();
  const denied = user && user.role !== ROLES.ADMIN;

  useLayoutEffect(() => {
    revalidate();
  }, [location.pathname, revalidate]);

  useEffect(() => {
    if (denied) toast.error('That area is restricted to administrators.', { id: 'admin-denied' });
  }, [denied]);

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (denied) return <Navigate to="/user/dashboard" replace />;
  return children || <Outlet />;
}
