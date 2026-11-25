import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';
import SidebarNav, { MobileTabNav } from '../components/navigation/SidebarNav';
import Spinner from '../components/common/Spinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { USER_NAV } from './userNav';

export default function UserLayout() {
  const { user } = useAuth();
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container-site flex flex-1 gap-8 py-8 lg:py-10">
        <aside className="no-print hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">
            <div className="mb-5 flex items-center gap-3 rounded-card border border-ivory-300 bg-white p-3.5">
              <Avatar name={user?.name} src={user?.avatar} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted">Community member</p>
              </div>
            </div>
            <SidebarNav items={USER_NAV} label="Member navigation" />
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1" tabIndex={-1}>
          <div className="no-print">
            <MobileTabNav items={USER_NAV} label="Member navigation" />
          </div>
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Footer />
    </div>
  );
}
