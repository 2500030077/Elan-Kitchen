import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Plus, X, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../common/Logo';
import UserMenu from './UserMenu';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore Recipes' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const linkCls = ({ isActive }) =>
  `relative px-1 py-2 text-[15px] font-medium transition-colors ${isActive ? 'text-forest' : 'text-charcoal/80 hover:text-forest'}`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`no-print sticky top-0 z-40 border-b transition-colors ${scrolled ? 'border-ivory-300 bg-ivory/95 backdrop-blur' : 'border-transparent bg-ivory'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <nav className="container-site flex h-[72px] items-center justify-between gap-4" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkCls}>
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-gold" aria-hidden="true" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          {!user && (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Join the community</Link>
            </>
          )}
          {user && !isAdmin && (
            <Link to="/user/recipes/new" className="btn btn-secondary">
              <Plus className="h-4 w-4" aria-hidden="true" /> Submit recipe
            </Link>
          )}
          {user && isAdmin && (
            <Link to="/admin/dashboard" className="btn btn-secondary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Studio
            </Link>
          )}
          {user && <UserMenu />}
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-charcoal hover:bg-forest-50 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div className="absolute inset-0 bg-forest-dark/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.aside
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-ivory shadow-lift"
            >
              <div className="flex h-[72px] items-center justify-between border-b border-ivory-300 px-5">
                <Logo />
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-forest-50" aria-label="Close navigation menu" autoFocus>
                  <X className="h-6 w-6" />
                </button>
              </div>
              {user && (
                <div className="flex items-center gap-3 border-b border-ivory-300 px-5 py-4">
                  <Avatar name={user.name} src={user.avatar} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                </div>
              )}
              <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {LINKS.map((l) => (
                  <li key={l.to}>
                    <NavLink to={l.to} end={l.end} className={({ isActive }) => `flex min-h-[48px] items-center rounded-lg px-4 text-base font-medium ${isActive ? 'bg-forest text-white' : 'hover:bg-forest-50'}`}>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
                {user && (
                  <li>
                    <NavLink to={isAdmin ? '/admin/dashboard' : '/user/dashboard'} className={({ isActive }) => `flex min-h-[48px] items-center gap-2 rounded-lg px-4 text-base font-medium ${isActive ? 'bg-forest text-white' : 'hover:bg-forest-50'}`}>
                      {isAdmin ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <LayoutDashboard className="h-4 w-4" aria-hidden="true" />}
                      {isAdmin ? 'Studio dashboard' : 'My dashboard'}
                    </NavLink>
                  </li>
                )}
              </ul>
              <div className="space-y-2 border-t border-ivory-300 p-5">
                {!user ? (
                  <>
                    <Link to="/signup" className="btn btn-primary w-full">Join the community</Link>
                    <Link to="/login" className="btn btn-secondary w-full">Log in</Link>
                  </>
                ) : (
                  <>
                    {!isAdmin && (
                      <Link to="/user/recipes/new" className="btn btn-primary w-full">
                        <Plus className="h-4 w-4" aria-hidden="true" /> Submit a recipe
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary w-full text-danger"
                      onClick={() => {
                        logout();
                        toast.success('You have been signed out.');
                        navigate('/');
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
                    </button>
                  </>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
