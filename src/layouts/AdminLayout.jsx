import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ChefHat, Tags, MessageSquareText, History, Menu, X, LogOut, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';
import SidebarNav from '../components/navigation/SidebarNav';
import Spinner from '../components/common/Spinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../context/RecipeContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { allRecipes } = useRecipes();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pending = allRecipes.filter((r) => r.status === 'pending').length;

  useEffect(() => setOpen(false), [location.pathname]);

  const nav = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/recipes', label: 'Recipes', icon: ChefHat, badge: pending || null },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
    { to: '/admin/activity', label: 'Activity log', icon: History },
  ];

  const sidebar = (
    <div className="flex h-full flex-col bg-forest-dark px-4 py-6">
      <div className="px-2">
        <Logo to="/admin/dashboard" light subtitle="Studio" />
      </div>
      <div className="mt-8 flex-1">
        <SidebarNav items={nav} label="Studio navigation" dark />
      </div>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link to="/" className="flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 text-sm text-ivory/70 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /> View public site
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            toast.success('Signed out of Élan Kitchen Studio.');
            navigate('/login');
          }}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 text-left text-sm text-ivory/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Studio navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative h-full w-72 max-w-[85%]">
            {sidebar}
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-5 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ivory hover:bg-white/10" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ivory-300 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-forest-50 lg:hidden" aria-label="Open navigation" aria-expanded={open}>
              <Menu className="h-5 w-5" />
            </button>
            <p className="font-display text-lg font-semibold text-forest-dark">Élan Kitchen Studio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted">Administrator</p>
            </div>
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-10" tabIndex={-1}>
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
