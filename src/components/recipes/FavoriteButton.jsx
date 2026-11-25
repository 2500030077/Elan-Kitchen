import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import useRequireAuthAction from '../../hooks/useRequireAuthAction';

export default function FavoriteButton({ recipe, variant = 'icon', className = '' }) {
  const { user, isAdmin } = useAuth();
  const { favoriteIds } = useRecipes();
  const requireAuth = useRequireAuthAction();
  if (isAdmin) return null;
  const active = favoriteIds.has(recipe.id);

  const onClick = requireAuth((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const now = recipeService.toggleFavorite(user, recipe.id);
      toast.success(now ? `Saved “${recipe.title}” to favorites` : 'Removed from favorites', { id: `fav-${recipe.id}` });
    } catch (err) {
      toast.error(err.message);
    }
  }, 'Sign in to save favorites.');

  if (variant === 'button') {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={`btn ${active ? 'btn-primary' : 'btn-secondary'} ${className}`}>
        <Heart className="h-4 w-4" fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
        {active ? 'Saved' : 'Save'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title} to favorites`}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-soft transition-transform hover:scale-105 ${active ? 'text-terracotta' : 'text-charcoal'} ${className}`}
    >
      <Heart className="h-[18px] w-[18px]" fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}
