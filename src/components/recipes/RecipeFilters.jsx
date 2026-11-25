import { CUISINES, DIETARY_OPTIONS, DIFFICULTIES, TIME_FILTERS } from '../../utils/constants';
import { Stars } from '../common/StarRating';

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-ivory-300 pb-5 pt-1 last:border-0">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckList({ options, selected, onToggle, name }) {
  return (
    <ul className="space-y-1.5">
      {options.map((o) => {
        const id = `${name}-${o.replace(/\W+/g, '-')}`;
        return (
          <li key={o}>
            <label htmlFor={id} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-sm">
              <input id={id} type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="h-4 w-4 accent-forest" />
              {o}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Controlled filter panel. `filters` mirrors the URL search params. */
export default function RecipeFilters({ filters, categories, onChange, availableCuisines }) {
  const toggle = (key, value) => {
    const cur = filters[key];
    onChange({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };
  const cuisines = CUISINES.filter((c) => !availableCuisines || availableCuisines.has(c));
  return (
    <div className="space-y-5">
      <Group title="Category">
        <select aria-label="Category" className="input" value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </Group>
      <Group title="Cuisine">
        <CheckList name="cuisine" options={cuisines} selected={filters.cuisines} onToggle={(v) => toggle('cuisines', v)} />
      </Group>
      <Group title="Dietary preference">
        <CheckList name="diet" options={DIETARY_OPTIONS} selected={filters.dietary} onToggle={(v) => toggle('dietary', v)} />
      </Group>
      <Group title="Difficulty">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => {
            const on = filters.difficulty.includes(d);
            return (
              <button key={d} type="button" aria-pressed={on} onClick={() => toggle('difficulty', d)} className={`chip min-h-[36px] ${on ? 'chip-active' : 'hover:border-forest/40'}`}>
                {d}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Total cooking time">
        <div className="space-y-1.5">
          {TIME_FILTERS.map((t) => (
            <label key={t.value || 'any'} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="maxTime" value={t.value} checked={filters.maxTime === t.value} onChange={() => onChange({ maxTime: t.value })} className="h-4 w-4 accent-forest" />
              {t.label}
            </label>
          ))}
        </div>
      </Group>
      <Group title="Minimum rating">
        <div className="space-y-1.5">
          {[0, 4, 3, 2].map((r) => (
            <label key={r} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="minRating" checked={Number(filters.minRating) === r} onChange={() => onChange({ minRating: String(r) })} className="h-4 w-4 accent-forest" />
              {r === 0 ? 'Any rating' : (<><Stars value={r} size="h-3.5 w-3.5" /> <span>{r}+ stars</span></>)}
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}
