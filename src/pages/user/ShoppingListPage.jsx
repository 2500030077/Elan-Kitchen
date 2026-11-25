import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Plus, X, ShoppingBasket, CheckCheck, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import plannerService from '../../services/plannerService';
import storage from '../../services/storageService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import WeekSwitcher from './WeekSwitcher';
import useWeekParam from './useWeekParam';
import usePageTitle from '../../hooks/usePageTitle';
import { STORAGE_KEYS, UNITS } from '../../utils/constants';
import { formatQuantity, unitLabel } from '../../utils/helpers';

export default function ShoppingListPage() {
  usePageTitle('Shopping List');
  const { user } = useAuth();
  const { recipeMap } = useRecipes();
  const wk = useWeekParam();
  const [tick, setTick] = useState(0);
  const [custom, setCustom] = useState({ name: '', quantity: '', unit: '' });
  const [customErr, setCustomErr] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(
    () => storage.subscribe((e) => (e.key === STORAGE_KEYS.SHOPPING_LISTS || e.key === STORAGE_KEYS.MEAL_PLANS) && setTick((t) => t + 1)),
    [],
  );

  const { items, state, plannedCount } = useMemo(() => {
    const plan = plannerService.getMealPlan(user.id, wk.week);
    const ids = plannerService.getPlannedRecipeIds(plan).filter((id) => recipeMap.has(id));
    const s = plannerService.getShoppingState(user.id, wk.week);
    const generated = plannerService.aggregateIngredients(ids, recipeMap).filter((i) => !s.removed.includes(i.key));
    const customs = s.customItems.map((c) => ({ key: `custom:${c.id}`, name: c.name, quantity: c.quantity, unit: c.unit, recipes: [], custom: true }));
    return { items: [...generated, ...customs], state: s, plannedCount: ids.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, wk.week, recipeMap, tick]);

  const done = items.filter((i) => state.checked[i.key]).length;

  const addCustom = (e) => {
    e.preventDefault();
    try {
      plannerService.addCustomItem(user.id, wk.week, custom);
      setCustom({ name: '', quantity: '', unit: '' });
      setCustomErr('');
    } catch (err) {
      setCustomErr(err.errors?.name || err.errors?.quantity || err.message);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Plan ahead"
        title="Shopping list"
        description="Generated from your meal plan. Matching ingredients with compatible units are combined."
        actions={
          <>
            <Button variant="secondary" icon={Printer} onClick={() => window.print()} disabled={!items.length}>Print</Button>
            <Button variant="secondary" icon={CheckCheck} onClick={() => { plannerService.clearCompleted(user.id, wk.week); toast.success('Completed items cleared'); }} disabled={!done}>Clear completed</Button>
          </>
        }
      />
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <WeekSwitcher {...wk} />
        <p className="text-sm text-muted">{plannedCount} planned meal{plannedCount === 1 ? '' : 's'} · <span className="font-semibold text-charcoal">{done}/{items.length}</span> items checked</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="card p-2 sm:p-4" aria-label="Shopping items">
          <h2 className="print-only mb-2 text-2xl font-semibold">Élan Kitchen shopping list — week of {wk.week}</h2>
          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title={plannedCount ? 'Everything is cleared' : 'No meals planned for this week'}
              description={plannedCount ? 'You removed or completed every item. Reset to regenerate from your plan.' : 'Add recipes to your meal planner and the ingredients will appear here automatically.'}
              action={plannedCount ? <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset list</Button> : <Link to={`/user/meal-planner${wk.isCurrent ? '' : `?week=${wk.week}`}`} className="btn btn-primary">Open meal planner</Link>}
              className="border-0"
            />
          ) : (
            <ul className="divide-y divide-ivory-200">
              {items.map((i) => {
                const on = !!state.checked[i.key];
                return (
                  <li key={i.key} className="flex items-start gap-3 px-2 py-3">
                    <input id={`item-${i.key}`} type="checkbox" checked={on} onChange={() => plannerService.toggleShoppingItem(user.id, wk.week, i.key)} className="mt-1 h-5 w-5 shrink-0 accent-forest" />
                    <label htmlFor={`item-${i.key}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className={`block text-[15px] ${on ? 'text-muted line-through' : ''}`}>
                        {i.quantity !== null && i.quantity !== undefined && <strong className="font-semibold">{formatQuantity(i.quantity)}{unitLabel(i.unit, i.quantity) ? ` ${unitLabel(i.unit, i.quantity)}` : ''} </strong>}
                        {i.name}
                        {(i.quantity === null || i.quantity === undefined) && !i.custom && <span className="text-muted"> (as needed)</span>}
                      </span>
                      <span className="block truncate text-xs text-muted">{i.custom ? 'Added by you' : `For ${i.recipes.join(', ')}`}</span>
                    </label>
                    <button type="button" onClick={() => plannerService.removeShoppingItem(user.id, wk.week, i.key)} className="no-print inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted hover:bg-red-50 hover:text-danger" aria-label={`Remove ${i.name}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="no-print space-y-4">
          <form onSubmit={addCustom} className="card space-y-3 p-4" noValidate>
            <h2 className="font-sans text-sm font-semibold">Add an item</h2>
            <div>
              <label htmlFor="custom-name" className="sr-only">Item name</label>
              <input id="custom-name" className={`input ${customErr ? 'input-error' : ''}`} placeholder="e.g. Kitchen towels" value={custom.name} maxLength={60} onChange={(e) => { setCustom({ ...custom, name: e.target.value }); setCustomErr(''); }} aria-invalid={!!customErr} aria-describedby={customErr ? 'custom-err' : undefined} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="sr-only" htmlFor="custom-qty">Quantity</label>
              <input id="custom-qty" type="number" min="0" step="any" className="input" placeholder="Qty" value={custom.quantity} onChange={(e) => setCustom({ ...custom, quantity: e.target.value })} />
              <label className="sr-only" htmlFor="custom-unit">Unit</label>
              <select id="custom-unit" className="input" value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u || 'unit'}</option>)}
              </select>
            </div>
            {customErr && <p id="custom-err" className="text-sm text-danger" role="alert">{customErr}</p>}
            <Button type="submit" icon={Plus} className="w-full">Add to list</Button>
          </form>
          <div className="card p-4 text-sm text-muted">
            <p className="font-semibold text-charcoal">How aggregation works</p>
            <p className="mt-1.5 leading-relaxed">Identical ingredients are summed when their units match (g/kg and ml/l convert automatically). Different units such as tbsp vs g stay on separate lines.</p>
            <button type="button" onClick={() => setConfirmReset(true)} className="mt-3 inline-flex items-center gap-1.5 font-medium text-forest hover:underline"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset list from plan</button>
          </div>
        </aside>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          plannerService.resetShoppingList(user.id, wk.week);
          setTick((t) => t + 1);
          setConfirmReset(false);
          toast.success('Shopping list regenerated from your meal plan');
        }}
        title="Reset shopping list?"
        message="Checked items, removed items and your custom additions for this week will be cleared, and the list regenerated from the meal plan."
        confirmLabel="Reset list"
      />
    </div>
  );
}
