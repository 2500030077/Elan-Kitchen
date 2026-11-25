import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9', light = false }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill={light ? '#FAF8F3' : '#214E34'} />
      <path d="M33 12c11 3 17 12 15 24-1 6-6 10-12 10-2-12-3-23-3-34Z" fill="#C6A66B" />
      <path d="M35.5 18c.5 8 1 15 1.8 24" stroke={light ? '#FAF8F3' : '#214E34'} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M22 12v11a4 4 0 0 0 3 3.9V52" stroke={light ? '#214E34' : '#FAF8F3'} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M18.5 12v8M25.5 12v8" stroke={light ? '#214E34' : '#FAF8F3'} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', light = false, subtitle, className = '' }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Élan Kitchen home">
      <LogoMark light={light} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.35rem] font-semibold tracking-tight ${light ? 'text-ivory' : 'text-forest-dark'}`}>
          Élan Kitchen
        </span>
        {subtitle && <span className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${light ? 'text-gold' : 'text-gold-dark'}`}>{subtitle}</span>}
      </span>
    </Link>
  );
}
