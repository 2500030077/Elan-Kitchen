import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import RecipeGrid from './RecipeGrid';

export default function RecipeSection({ eyebrow, title, description, recipes, link, linkLabel = 'View all' }) {
  if (!recipes.length) return null;
  return (
    <section className="container-site py-12 sm:py-16" aria-labelledby={`sec-${title.replace(/\s+/g, '-')}`}>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 id={`sec-${title.replace(/\s+/g, '-')}`} className="text-3xl font-semibold sm:text-4xl">{title}</h2>
          {description && <p className="mt-2 max-w-xl text-muted">{description}</p>}
        </div>
        {link && (
          <Link to={link} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-dark">
            {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      <RecipeGrid recipes={recipes} />
    </section>
  );
}
