import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function NotFoundPage({ inline = false }) {
  usePageTitle('Page not found');
  return (
    <div className={`flex flex-col items-center justify-center px-6 text-center ${inline ? 'py-16' : 'min-h-[70vh] py-20'}`}>
      <svg viewBox="0 0 220 120" className="h-28 w-56" aria-hidden="true">
        <ellipse cx="110" cy="96" rx="92" ry="14" fill="#EFE9DC" />
        <path d="M30 70c0-26 36-46 80-46s80 20 80 46" fill="none" stroke="#214E34" strokeWidth="6" strokeLinecap="round" />
        <path d="M22 72h176" stroke="#214E34" strokeWidth="6" strokeLinecap="round" />
        <circle cx="110" cy="20" r="6" fill="#C6A66B" />
      </svg>
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">This dish isn’t on the menu</h1>
      <p className="mt-4 max-w-md text-muted">The page you’re looking for may have been moved, renamed or never existed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary"><Home className="h-4 w-4" aria-hidden="true" /> Back to home</Link>
        <Link to="/explore" className="btn btn-secondary"><Compass className="h-4 w-4" aria-hidden="true" /> Explore recipes</Link>
      </div>
    </div>
  );
}
