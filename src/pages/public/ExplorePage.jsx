import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, SearchX, Carrot } from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import RecipeFilters from '../../components/recipes/RecipeFilters';
import { RecipeGridSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import usePageTitle from '../../hooks/usePageTitle';
import useDebounce from '../../hooks/useDebounce';
import { PAGE_SIZE, SORT_OPTIONS, TIME_FILTERS } from '../../utils/constants';

const list = (v) => (v ? v.split(',').filter(Boolean) : []);

/** Parse URL params into a filter object (URL is the single source of truth). */
const readFilters = (sp) => ({
  q: sp.get('q') || '',
  ingredient: sp.get('ingredient') || '',
  cuisines: list(sp.get('cuisine')),
  dietary: list(sp.get('dietary')),
  difficulty: list(sp.get('difficulty')),
  maxTime: sp.get('maxTime') || '',
  category: sp.get('category') || '',
  minRating: sp.get('minRating') || '0',
  sort: sp.get('sort') || 'newest',
});

const PARAM_MAP = { cuisines: 'cuisine', dietary: 'dietary', difficulty: 'difficulty' };

export default function ExplorePage() {
  usePageTitle('Explore Recipes');
  const [sp, setSp] = useSearchParams();
  const filters = useMemo(() => readFilters(sp), [sp]);
  const { approvedRecipes, categories } = useRecipes();
  const [qInput, setQInput] = useState(filters.q);
  const [ingInput, setIngInput] = useState(filters.ingredient);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawer, setDrawer] = useState(false);
  const dq = useDebounce(qInput, 300);
  const dIng = useDebounce(ingInput, 300);
  const typing = qInput !== dq || ingInput !== dIng;

  // keep inputs in sync when URL changes via back/forward or links
  useEffect(() => setQInput(filters.q), [filters.q]);
  useEffect(() => setIngInput(filters.ingredient), [filters.ingredient]);

  const update = (patch, { replace = true } = {}) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      const key = PARAM_MAP[k] || k;
      const val = Array.isArray(v) ? v.join(',') : v;
      if (!val || (key === 'minRating' && val === '0') || (key === 'sort' && val === 'newest')) next.delete(key);
      else next.set(key, val);
    });
    setSp(next, { replace });
    setVisible(PAGE_SIZE);
  };

  useEffect(() => {
    if (dq !== filters.q || dIng !== filters.ingredient) update({ q: dq.trim(), ingredient: dIng.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, dIng]);

  const category = categories.find((c) => c.slug === filters.category || c.id === filters.category);
  const results = useMemo(
    () => recipeService.filterRecipes(approvedRecipes, { ...filters, categoryId: category?.id || (filters.category ? '__none__' : '') }),
    [approvedRecipes, filters, category],
  );
  const availableCuisines = useMemo(() => new Set(approvedRecipes.map((r) => r.cuisine)), [approvedRecipes]);

  const chips = [
    filters.q && { label: `“${filters.q}”`, clear: () => { setQInput(''); update({ q: '' }); } },
    filters.ingredient && { label: `Ingredient: ${filters.ingredient}`, clear: () => { setIngInput(''); update({ ingredient: '' }); } },
    category && { label: category.name, clear: () => update({ category: '' }) },
    ...filters.cuisines.map((c) => ({ label: c, clear: () => update({ cuisines: filters.cuisines.filter((x) => x !== c) }) })),
    ...filters.dietary.map((d) => ({ label: d, clear: () => update({ dietary: filters.dietary.filter((x) => x !== d) }) })),
    ...filters.difficulty.map((d) => ({ label: d, clear: () => update({ difficulty: filters.difficulty.filter((x) => x !== d) }) })),
    filters.maxTime && { label: TIME_FILTERS.find((t) => t.value === filters.maxTime)?.label, clear: () => update({ maxTime: '' }) },
    Number(filters.minRating) > 0 && { label: `${filters.minRating}★ & up`, clear: () => update({ minRating: '0' }) },
  ].filter(Boolean);

  const clearAll = () => {
    setQInput('');
    setIngInput('');
    setSp(filters.sort !== 'newest' ? { sort: filters.sort } : {}, { replace: false });
    setVisible(PAGE_SIZE);
  };

  const panel = <RecipeFilters filters={filters} categories={categories} onChange={(p) => update(p)} availableCuisines={availableCuisines} />;

  return (
    <div className="container-site py-10">
      <header className="mb-8">
        <p className="eyebrow mb-2">Explore</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Find your next favourite dish</h1>
        <p className="mt-3 max-w-2xl text-muted">Search by name or by what’s already in your fridge, then narrow by cuisine, diet, time and rating.</p>
      </header>

      <div className="mb-6 grid gap-3 md:grid-cols-[1.4fr_1fr]" role="search">
        <label className="relative">
          <span className="sr-only">Search recipes by name</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input h-12 pl-10" placeholder="Search by recipe name, e.g. risotto" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </label>
        <label className="relative">
          <span className="sr-only">Search by ingredients, comma separated</span>
          <Carrot className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input h-12 pl-10" placeholder="Ingredients, e.g. paneer, tomato" value={ingInput} onChange={(e) => setIngInput(e.target.value)} />
        </label>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Recipe filters">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold">Filters</h2>
              {chips.length > 0 && <button type="button" onClick={clearAll} className="text-sm font-medium text-forest hover:underline">Clear all</button>}
            </div>
            {panel}
          </div>
        </aside>

        <section aria-labelledby="results-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p id="results-heading" className="text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-charcoal">{results.length}</span> recipe{results.length === 1 ? '' : 's'} found
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={SlidersHorizontal} className="lg:hidden" onClick={() => setDrawer(true)}>
                Filters{chips.length ? ` (${chips.length})` : ''}
              </Button>
              <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                <span className="hidden text-muted sm:inline">Sort by</span>
                <select className="input h-9 py-1 text-sm" value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort recipes">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <li key={c.label}>
                  <button type="button" onClick={c.clear} className="chip border-forest/30 bg-forest-50 hover:bg-forest-100" aria-label={`Remove filter ${c.label}`}>
                    {c.label} <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearAll} className="chip text-danger hover:bg-red-50">Clear all</button>
              </li>
            </ul>
          )}

          {typing ? (
            <RecipeGridSkeleton count={6} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No recipes match your filters"
              description="Try removing a filter, searching for a different ingredient, or browsing all recipes."
              action={<Button onClick={clearAll}>Clear all filters</Button>}
            />
          ) : (
            <>
              <RecipeGrid recipes={results.slice(0, visible)} columns="sm:grid-cols-2 xl:grid-cols-3" />
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-sm text-muted">Showing {Math.min(visible, results.length)} of {results.length}</p>
                {visible < results.length && (
                  <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load more recipes</Button>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filter recipes" footer={<><Button variant="ghost" onClick={clearAll}>Clear all</Button><Button onClick={() => setDrawer(false)}>Show {results.length} results</Button></>}>
        {panel}
      </Modal>
    </div>
  );
}
