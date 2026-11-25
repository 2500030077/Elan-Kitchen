import { useMemo, useState } from 'react';
import { Heart, Search, HeartOff } from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';
import PageHeader from '../../components/common/PageHeader';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import usePageTitle from '../../hooks/usePageTitle';
import storage from '../../services/storageService';
import { STORAGE_KEYS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function FavoritesPage() {
  usePageTitle('Favorites');
  const { user } = useAuth();
  const { favorites, getRecipe, favoriteIds } = useRecipes();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');

  const list = useMemo(() => {
    const mine = favorites
      .filter((f) => f.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((f) => getRecipe(f.recipeId))
      .filter((r) => r && r.status === 'approved');
    const term = q.trim().toLowerCase();
    const filtered = term ? mine.filter((r) => `${r.title} ${r.cuisine} ${r.ingredients.map((i) => i.name).join(' ')}`.toLowerCase().includes(term)) : mine;
    if (sort === 'title') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'rating') return [...filtered].sort((a, b) => b.rating - a.rating);
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites, getRecipe, q, sort, user.id, favoriteIds]);

  const total = storage.filterBy(STORAGE_KEYS.FAVORITES, (f) => f.userId === user.id).length;

  return (
    <div>
      <PageHeader eyebrow="Your kitchen" title="Favorite recipes" description={`${favoriteIds.size} saved recipe${favoriteIds.size === 1 ? '' : 's'}. Tap the heart to remove one.`} />
      {total === 0 ? (
        <EmptyState icon={Heart} title="No favorites yet" description="Browse recipes and tap the heart icon to save the ones you want to cook." action={<Button to="/explore">Discover recipes</Button>} />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search saved recipes</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input type="search" className="input pl-9" placeholder="Search your favorites by name, cuisine or ingredient" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <select className="input sm:w-48" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort favorites">
              <option value="recent">Recently saved</option>
              <option value="title">Title A–Z</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
          {list.length === 0 ? (
            <EmptyState icon={HeartOff} title="No matches" description={`None of your favorites match “${q}”.`} action={<Button variant="secondary" onClick={() => setQ('')}>Clear search</Button>} />
          ) : (
            <RecipeGrid recipes={list} columns="sm:grid-cols-2 xl:grid-cols-3" />
          )}
        </>
      )}
    </div>
  );
}
