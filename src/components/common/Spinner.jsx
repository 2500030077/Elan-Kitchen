import { LogoMark } from './Logo';

export default function Spinner({ label = 'Loading…', fullPage = false }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-4 ${fullPage ? 'min-h-screen' : 'py-24'}`}>
      <LogoMark className="h-12 w-12 animate-pulse" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
