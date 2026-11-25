import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { APP_TAGLINE, CUISINES } from '../../utils/constants';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="no-print mt-24 bg-forest-dark text-ivory/80">
      <div className="container-site grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/70">
            A community of home cooks discovering, creating and savouring recipes from every corner of the world.
          </p>
          <p className="mt-4 font-display text-lg italic text-gold">{APP_TAGLINE}</p>
        </div>
        <nav className="md:col-span-2" aria-label="Explore">
          <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/explore">All recipes</Link></li>
            <li><Link className="hover:text-white" to="/explore?sort=popular">Trending</Link></li>
            <li><Link className="hover:text-white" to="/explore?maxTime=30">Quick &amp; easy</Link></li>
            <li><Link className="hover:text-white" to="/explore?dietary=Vegan">Plant-based</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-3" aria-label="Cuisines">
          <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Cuisines</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {CUISINES.slice(0, 6).map((c) => (
              <li key={c}><Link className="hover:text-white" to={`/explore?cuisine=${encodeURIComponent(c)}`}>{c}</Link></li>
            ))}
          </ul>
        </nav>
        <nav className="md:col-span-3" aria-label="Company">
          <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Élan Kitchen</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/about">About us</Link></li>
            <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
            <li><Link className="hover:text-white" to="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-white" to="/signup">Join the community</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-ivory/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Élan Kitchen. An academic demonstration project.</p>
          <p>Food photography courtesy of Unsplash contributors.</p>
        </div>
      </div>
    </footer>
  );
}
