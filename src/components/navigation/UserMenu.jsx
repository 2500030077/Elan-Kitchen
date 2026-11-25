import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Heart, User, ShieldCheck, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

export default function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Studio dashboard', icon: ShieldCheck },
        { to: '/explore', label: 'Browse recipes', icon: BookOpen },
      ]
    : [
        { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/user/favorites', label: 'Favorites', icon: Heart },
        { to: '/user/profile', label: 'Profile & settings', icon: User },
      ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-ivory-300 bg-white py-1 pl-1 pr-3 text-sm hover:border-forest/30"
      >
        <Avatar name={user.name} src={user.avatar} size="sm" />
        <span className="hidden max-w-[120px] truncate font-medium lg:inline">{user.name.split(' ')[0]}</span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-card border border-ivory-300 bg-white py-1 shadow-lift">
          <div className="border-b border-ivory-200 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} role="menuitem" to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-forest-50">
              <Icon className="h-4 w-4 text-muted" aria-hidden="true" /> {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout();
              setOpen(false);
              toast.success('You have been signed out.');
              navigate('/');
            }}
            className="flex w-full items-center gap-3 border-t border-ivory-200 px-4 py-2.5 text-left text-sm text-danger hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
