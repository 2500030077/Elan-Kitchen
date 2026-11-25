import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/** Vertical nav for desktop + horizontally scrolling pill nav for mobile. */
export default function SidebarNav({ items, label, dark = false }) {
  const base = dark
    ? ({ isActive }) => `flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-ivory/70 hover:bg-white/5 hover:text-white'}`
    : ({ isActive }) => `flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors ${isActive ? 'bg-forest text-white' : 'text-charcoal/80 hover:bg-forest-50 hover:text-forest'}`;
  return (
    <nav aria-label={label}>
      <ul className="space-y-1">
        {items.map(({ to, label: text, icon: Icon, end, badge }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={base}>
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
              <span className="flex-1">{text}</span>
              {badge ? <span className="rounded-full bg-terracotta px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileTabNav({ items, label }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  // Keep the active tab visible in the horizontally scrolling strip.
  useEffect(() => {
    const active = ref.current?.querySelector('[aria-current="page"]');
    if (active && ref.current) {
      const box = ref.current;
      box.scrollLeft = active.offsetLeft - box.clientWidth / 2 + active.clientWidth / 2;
    }
  }, [pathname]);
  return (
    <nav ref={ref} aria-label={label} className="-mx-4 mb-6 overflow-x-auto px-4 lg:hidden">
      <ul className="flex w-max gap-2 pb-1">
        {items.map(({ to, label: text, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium ${isActive ? 'border-forest bg-forest text-white' : 'border-ivory-300 bg-white text-charcoal'}`
              }
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {text}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
