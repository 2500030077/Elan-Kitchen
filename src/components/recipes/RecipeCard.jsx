import { Link } from 'react-router-dom';
import { Clock, ChefHat } from 'lucide-react';
import RecipeImage from '../common/RecipeImage';
import { RatingSummary } from '../common/StarRating';
import FavoriteButton from './FavoriteButton';
import { formatMinutes, totalTime } from '../../utils/helpers';

export default function RecipeCard({ recipe, eager = false, showFavorite = true, footer }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-ivory-300/70 bg-white shadow-soft transition-shadow duration-200 hover:shadow-lift">
      <div className="relative">
        <RecipeImage src={recipe.image} alt={recipe.title} width={640} eager={eager} className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.03]" />
        {showFavorite && (
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton recipe={recipe} />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-forest-dark">
          {recipe.cuisine}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gold-dark">{recipe.categoryName}</p>
        <h3 className="mt-1.5 text-[1.2rem] font-semibold leading-snug">
          <Link to={`/recipes/${recipe.id}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline">
            {recipe.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{recipe.description}</p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatMinutes(totalTime(recipe))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5" aria-hidden="true" />
              {recipe.difficulty}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-ivory-200 pt-2.5">
            <RatingSummary rating={recipe.rating} count={recipe.reviewCount} />
            <span className="truncate text-xs text-muted">by {recipe.authorName}</span>
          </div>
          {footer && <div className="relative z-10 mt-3">{footer}</div>}
        </div>
      </div>
    </article>
  );
}
