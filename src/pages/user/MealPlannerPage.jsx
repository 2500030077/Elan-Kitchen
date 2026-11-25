import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, X, Trash2, ShoppingBasket, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import plannerService from '../../services/plannerService';
import storage from '../../services/storageService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RecipeImage from '../../components/common/RecipeImage';
import RecipePickerModal from '../../components/recipes/RecipePickerModal';
import WeekSwitcher from './WeekSwitcher';
import useWeekParam from './useWeekParam';
import usePageTitle from '../../hooks/usePageTitle';
import { MEAL_SLOTS, STORAGE_KEYS, WEEK_DAYS } from '../../utils/constants';
import { addDays, formatDate, parseDateKey, toDateKey } from '../../utils/helpers';

export default function MealPlannerPage() {
  usePageTitle('Meal Planner');
  const { user } = useAuth();
  const { getRecipe } = useRecipes();
  const wk = useWeekParam();
  const [tick, setTick] = useState(0);
  const [picking, setPicking] = useState(null); // { day, slot }
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => storage.subscribe((e) => e.key === STORAGE_KEYS.MEAL_PLANS && setTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plan = useMemo(() => plannerService.getMealPlan(user.id, wk.week), [user.id, wk.week, tick]);
  const planned = plannerService.getPlannedRecipeIds(plan).filter((id) => getRecipe(id)).length;
  const todayKey = toDateKey(new Date());

  const assign = (recipe) => {
    try {
      plannerService.setMealSlot(user.id, wk.week, picking.day, picking.slot, recipe.id);
      toast.success(`${recipe.title} → ${picking.day} ${MEAL_SLOTS.find((s) => s.key === picking.slot).label.toLowerCase()}`);
      setPicking(null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = (day, slot) => {
    plannerService.setMealSlot(user.id, wk.week, day, slot, null);
    toast.success('Meal removed');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Plan ahead"
        title="Weekly meal planner"
        description="Assign recipes to breakfast, lunch, snack and dinner. Changes save automatically."
        actions={
          <>
            <Link to={`/user/shopping-list${wk.isCurrent ? '' : `?week=${wk.week}`}`} className="btn btn-secondary"><ShoppingBasket className="h-4 w-4" aria-hidden="true" /> Shopping list</Link>
            <Button variant="ghost" icon={Trash2} className="text-danger" onClick={() => setConfirmClear(true)} disabled={planned === 0}>Clear week</Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <WeekSwitcher {...wk} />
        <p className="text-sm text-muted"><span className="font-semibold text-charcoal">{planned}</span> of 28 meals planned</p>
      </div>

      <div className="space-y-4">
        {WEEK_DAYS.map((day, di) => {
          const dateKey = addDays(wk.week, di);
          const isToday = dateKey === todayKey;
          return (
            <section key={day} className={`card p-4 ${isToday ? 'ring-2 ring-gold' : ''}`} aria-labelledby={`day-${day}`}>
              <h2 id={`day-${day}`} className="mb-3 flex items-baseline gap-2 font-sans text-sm font-semibold">
                <CalendarDays className="h-4 w-4 self-center text-forest" aria-hidden="true" />
                {day}
                <span className="font-normal text-muted">{formatDate(parseDateKey(dateKey).toISOString(), { day: 'numeric', month: 'short' })}</span>
                {isToday && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase text-forest-dark">Today</span>}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {MEAL_SLOTS.map((s) => {
                  const recipe = getRecipe(plan.slots[day]?.[s.key]);
                  return (
                    <li key={s.key} className="relative min-h-[104px] rounded-lg border border-ivory-300 bg-ivory/50 p-2.5">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{s.label}</p>
                      {recipe ? (
                        <>
                          <div className="absolute right-1.5 top-1.5 flex">
                            <button type="button" onClick={() => setPicking({ day, slot: s.key })} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-forest-50 hover:text-forest" aria-label={`Replace ${day} ${s.label}`} title="Replace"><RefreshCw className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => remove(day, s.key)} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-red-50 hover:text-danger" aria-label={`Remove ${day} ${s.label}`} title="Remove"><X className="h-4 w-4" /></button>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <RecipeImage src={recipe.image} alt="" width={120} className="h-12 w-12 shrink-0 rounded-md" />
                            <Link to={`/recipes/${recipe.id}`} className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug hover:text-forest">{recipe.title}</Link>
                          </div>
                        </>
                      ) : (
                        <button type="button" onClick={() => setPicking({ day, slot: s.key })} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-ivory-300 text-sm text-muted hover:border-forest hover:text-forest" aria-label={`Add ${s.label.toLowerCase()} for ${day}`}>
                          <Plus className="h-4 w-4" aria-hidden="true" /> Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <RecipePickerModal open={!!picking} onClose={() => setPicking(null)} onSelect={assign} title={picking ? `${picking.day} · ${MEAL_SLOTS.find((s) => s.key === picking.slot)?.label}` : ''} description="Pick a recipe for this meal. Your favorites are listed first." />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          plannerService.clearWeek(user.id, wk.week);
          setConfirmClear(false);
          toast.success('Week cleared');
        }}
        title="Clear this week’s plan?"
        message={`All ${planned} planned meals for this week will be removed. Other weeks are not affected.`}
        confirmLabel="Clear week"
      />
    </div>
  );
}
