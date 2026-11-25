import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, FolderHeart, BookOpen, CheckCircle2, Hourglass, PlusCircle, CalendarDays, ShoppingBasket, Compass, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import { getPreferences, getRecentlyViewed } from '../../services/userService';
import { getUpcomingPlans } from '../../services/plannerService';
import StatCard from '../../components/dashboard/StatCard';
import RecipeImage from '../../components/common/RecipeImage';
import EmptyState from '../../components/common/EmptyState';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import usePageTitle from '../../hooks/usePageTitle';
import { addDays, formatDate, getWeekStart, parseDateKey } from '../../utils/helpers';
import { MEAL_SLOTS, WEEK_DAYS } from '../../utils/constants';

function MiniList({ recipes, empty }) {
  if (!recipes.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-ivory-200">
      {recipes.map((r) => (
        <li key={r.id}>
          <Link to={`/recipes/${r.id}`} className="flex items-center gap-3 py-2.5 hover:text-forest">
            <RecipeImage src={r.image} alt="" width={120} className="h-12 w-12 shrink-0 rounded-md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{r.title}</span>
              <span className="text-xs text-muted">{r.cuisine} · {r.difficulty}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { allRecipes, approvedRecipes, favoriteIds, collections, getRecipe, version } = useRecipes();

  const data = useMemo(() => {
    const mine = allRecipes.filter((r) => r.authorId === user.id);
    const favs = approvedRecipes.filter((r) => favoriteIds.has(r.id));
    const recent = getRecentlyViewed(user.id).map(getRecipe).filter((r) => r && r.status === 'approved');
    const prefs = getPreferences(user.id);
    const seen = new Set([...favoriteIds, ...mine.map((r) => r.id)]);
    const recommended = approvedRecipes
      .filter((r) => !seen.has(r.id))
      .map((r) => ({
        r,
        score: (prefs.cuisines.includes(r.cuisine) ? 3 : 0) + r.dietary.filter((d) => prefs.dietary.includes(d)).length * 2 + r.rating,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.r);

    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7;
    const thisWeek = getWeekStart(today);
    const upcoming = [];
    getUpcomingPlans(user.id, thisWeek).forEach((plan) => {
      WEEK_DAYS.forEach((day, di) => {
        if (plan.weekStart === thisWeek && di < todayIdx) return;
        MEAL_SLOTS.forEach((s) => {
          const rid = plan.slots?.[day]?.[s.key];
          const recipe = rid && getRecipe(rid);
          if (recipe) upcoming.push({ date: addDays(plan.weekStart, di), day, slot: s.label, recipe });
        });
      });
    });
    return {
      mine,
      favs,
      recent,
      recommended,
      upcoming: upcoming.slice(0, 6),
      approved: mine.filter((r) => r.status === 'approved').length,
      pending: mine.filter((r) => r.status === 'pending').length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRecipes, approvedRecipes, favoriteIds, user.id, getRecipe, version]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const actions = [
    { to: '/user/recipes/new', label: 'Submit a recipe', icon: PlusCircle },
    { to: '/user/meal-planner', label: 'Plan this week', icon: CalendarDays },
    { to: '/user/shopping-list', label: 'Shopping list', icon: ShoppingBasket },
    { to: '/explore', label: 'Explore recipes', icon: Compass },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">{formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{greet}, {user.name.split(' ')[0]}.</h1>
        <p className="text-muted">Here’s what’s cooking in your kitchen.</p>
      </header>

      <section aria-label="Your statistics" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Saved recipes" value={favoriteIds.size} icon={Heart} tone="terracotta" to="/user/favorites" />
        <StatCard label="Collections" value={collections.length} icon={FolderHeart} to="/user/collections" />
        <StatCard label="Submitted" value={data.mine.length} icon={BookOpen} tone="gold" to="/user/recipes" />
        <StatCard label="Approved" value={data.approved} icon={CheckCircle2} tone="green" to="/user/recipes" />
        <StatCard label="Pending" value={data.pending} icon={Hourglass} tone="gold" to="/user/recipes" />
      </section>

      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="sr-only">Quick actions</h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="flex min-h-[56px] items-center gap-3 rounded-card border border-ivory-300 bg-white px-4 py-3 text-sm font-medium hover:border-forest/40 hover:bg-forest-50">
                <Icon className="h-5 w-5 text-forest" aria-hidden="true" /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2" aria-labelledby="upcoming-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="upcoming-heading" className="font-sans text-base font-semibold">Upcoming meals</h2>
            <Link to="/user/meal-planner" className="text-sm font-medium text-forest hover:underline">Open planner</Link>
          </div>
          {data.upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No meals planned" description="Plan breakfast, lunch, snacks and dinner for the week ahead." action={<Link to="/user/meal-planner" className="btn btn-primary">Start planning</Link>} className="border-0 bg-transparent py-8" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.upcoming.map((m) => (
                <li key={`${m.date}-${m.slot}`}>
                  <Link to={`/recipes/${m.recipe.id}`} className="flex items-center gap-3 rounded-lg border border-ivory-200 p-2.5 hover:border-forest/40">
                    <RecipeImage src={m.recipe.image} alt="" width={120} className="h-14 w-14 shrink-0 rounded-md" />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-gold-dark">{formatDate(parseDateKey(m.date).toISOString(), { weekday: 'short', day: 'numeric', month: 'short' })} · {m.slot}</span>
                      <span className="block truncate text-sm font-semibold">{m.recipe.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-1 font-sans text-base font-semibold">Recently viewed</h2>
          <MiniList recipes={data.recent.slice(0, 5)} empty="Recipes you open will appear here." />
        </section>
      </div>

      <section className="card p-5" aria-labelledby="fav-heading">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="fav-heading" className="font-sans text-base font-semibold">Your favorites</h2>
          <Link to="/user/favorites" className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
        {data.favs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Tap the heart on any recipe to save it here.</p>
        ) : (
          <ul className="mt-3 flex gap-4 overflow-x-auto pb-2">
            {data.favs.slice(0, 8).map((r) => (
              <li key={r.id} className="w-40 shrink-0">
                <Link to={`/recipes/${r.id}`} className="group block">
                  <RecipeImage src={r.image} alt="" width={320} className="aspect-square rounded-lg" />
                  <p className="mt-2 truncate text-sm font-semibold group-hover:text-forest">{r.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.recommended.length > 0 && (
        <section aria-labelledby="rec-heading">
          <div className="mb-4">
            <h2 id="rec-heading" className="text-2xl font-semibold">Recommended for you</h2>
            <p className="text-sm text-muted">Based on your dietary and cuisine preferences. <Link to="/user/profile" className="text-forest underline">Update preferences</Link></p>
          </div>
          <RecipeGrid recipes={data.recommended} columns="sm:grid-cols-2 xl:grid-cols-4" />
        </section>
      )}
    </div>
  );
}
