import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Modal from '../common/Modal';
import RecipeImage from '../common/RecipeImage';
import { useRecipes } from '../../context/RecipeContext';
import { formatMinutes } from '../../utils/helpers';

/** Searchable list of approved recipes; favourites first. */
export default function RecipePickerModal({ open, onClose, onSelect, title = 'Choose a recipe', description }) {
  const { approvedRecipes, favoriteIds } = useRecipes();
  const [q, setQ] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return approvedRecipes
      .filter((r) => (!term || `${r.title} ${r.cuisine}`.toLowerCase().includes(term)) && (!onlyFav || favoriteIds.has(r.id)))
      .sort((a, b) => Number(favoriteIds.has(b.id)) - Number(favoriteIds.has(a.id)) || a.title.localeCompare(b.title));
  }, [approvedRecipes, favoriteIds, q, onlyFav]);

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="lg">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search recipes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input className="input pl-9" placeholder="Search recipes…" value={q} onChange={(e) => setQ(e.target.value)} data-autofocus />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-forest" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /> Favorites only
        </label>
      </div>
      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No recipes match your search.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onSelect(r)} className="flex w-full items-center gap-3 rounded-lg border border-ivory-300 p-2 text-left hover:border-forest hover:bg-forest-50">
                <RecipeImage src={r.image} alt="" width={120} className="h-14 w-14 shrink-0 rounded-md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.title}</span>
                  <span className="text-xs text-muted">{r.cuisine} · {formatMinutes(r.totalTime)}{favoriteIds.has(r.id) ? ' · ♥' : ''}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
