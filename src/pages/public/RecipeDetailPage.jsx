import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Flame, Users, ChefHat, Timer, Printer, Share2, FolderPlus, Minus, Plus, PlayCircle, ChevronRight, AlertCircle, Hourglass, Pencil, SearchX } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRecipes } from '../../context/RecipeContext';
import { useAuth } from '../../context/AuthContext';
import recipeService from '../../services/recipeService';
import { addRecentlyViewed } from '../../services/userService';
import RecipeImage from '../../components/common/RecipeImage';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { RatingSummary } from '../../components/common/StarRating';
import FavoriteButton from '../../components/recipes/FavoriteButton';
import AddToCollectionModal from '../../components/recipes/AddToCollectionModal';
import ReviewSection from '../../components/recipes/ReviewSection';
import CookingMode from '../../components/recipes/CookingMode';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import usePageTitle from '../../hooks/usePageTitle';
import useRequireAuthAction from '../../hooks/useRequireAuthAction';
import { formatDate, formatMinutes, formatQuantity, scaleQuantity, unitLabel } from '../../utils/helpers';

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="text-sm font-semibold text-charcoal">{value}</dd>
      </div>
    </div>
  );
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const { getRecipe, approvedRecipes } = useRecipes();
  const { user, isAdmin } = useAuth();
  const requireAuth = useRequireAuthAction();
  const recipe = getRecipe(id);
  const visible = recipe && recipeService.canViewRecipe(recipe, user);
  usePageTitle(visible ? recipe.title : 'Recipe not found');

  const [servings, setServings] = useState(recipe?.servings || 1);
  const [checked, setChecked] = useState({});
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [cooking, setCooking] = useState(false);
  const tracked = useRef(null);

  useEffect(() => {
    setServings(recipe?.servings || 1);
    setChecked({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Track views and recently viewed once per recipe visit.
  useEffect(() => {
    if (!visible || tracked.current === id) return;
    tracked.current = id;
    if (recipe.status === 'approved') recipeService.incrementViews(id);
    if (user && !isAdmin) {
      try {
        addRecentlyViewed(user.id, id);
      } catch {
        /* non-critical */
      }
    }
  }, [id, visible, recipe, user, isAdmin]);

  const ingredients = useMemo(
    () => (recipe?.ingredients || []).map((ing) => ({ ...ing, scaled: scaleQuantity(ing.quantity, recipe.servings, servings, ing.unit) })),
    [recipe, servings],
  );

  const related = useMemo(() => {
    if (!recipe) return [];
    return approvedRecipes
      .filter((r) => r.id !== recipe.id)
      .map((r) => ({ r, score: (r.cuisine === recipe.cuisine ? 2 : 0) + (r.categoryId === recipe.categoryId ? 2 : 0) + r.dietary.filter((d) => recipe.dietary.includes(d)).length * 0.5 + r.rating * 0.1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.r);
  }, [approvedRecipes, recipe]);

  if (!visible) {
    return (
      <div className="container-site py-16">
        <EmptyState
          icon={SearchX}
          title="We couldn’t find that recipe"
          description="It may have been removed, is awaiting moderation, or the link is incorrect."
          action={<Button to="/explore">Browse recipes</Button>}
        />
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text: `${recipe.title} on Élan Kitchen`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Recipe link copied to clipboard');
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Could not share — copy the address bar link instead.');
    }
  };

  const isOwner = user && recipe.authorId === user.id;
  const n = recipe.nutrition || {};
  const hasNutrition = [n.calories, n.protein, n.carbs, n.fat].some((v) => v !== null && v !== undefined);

  return (
    <article className="pb-8">
      {recipe.status !== 'approved' && (
        <div className={`no-print border-b ${recipe.status === 'rejected' ? 'border-red-100 bg-red-50' : 'border-gold-light bg-gold-light/40'}`}>
          <div className="container-site flex flex-col gap-3 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2">
              {recipe.status === 'rejected' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" /> : <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />}
              <span>
                <strong>{recipe.status === 'rejected' ? 'Rejected — ' : 'Pending review — '}</strong>
                {recipe.status === 'rejected' ? recipe.rejectionReason : 'This recipe is only visible to you and the moderators until it is approved.'}
              </span>
            </p>
            {isOwner && <Button size="sm" variant="secondary" icon={Pencil} to={`/user/recipes/${recipe.id}/edit`}>Edit recipe</Button>}
            {isAdmin && <Button size="sm" variant="secondary" to="/admin/recipes">Moderate in Studio</Button>}
          </div>
        </div>
      )}

      <div className="container-site pt-6">
        <nav aria-label="Breadcrumb" className="no-print mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-forest">Home</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to="/explore" className="hover:text-forest">Recipes</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to={`/explore?cuisine=${encodeURIComponent(recipe.cuisine)}`} className="hover:text-forest">{recipe.cuisine}</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="truncate text-charcoal">{recipe.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">{recipe.cuisine} · {recipe.categoryName}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.1] sm:text-5xl">{recipe.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{recipe.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="flex items-center gap-2.5 text-sm">
                <Avatar name={recipe.authorName} src={recipe.authorAvatar} size="sm" />
                <span>
                  <span className="block font-semibold">{recipe.authorName}</span>
                  <span className="text-xs text-muted">Published {formatDate(recipe.publishedAt || recipe.createdAt)}</span>
                </span>
              </span>
              <a href="#reviews-heading" className="no-print hover:opacity-80"><RatingSummary rating={recipe.rating} count={recipe.reviewCount} /></a>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Dietary information">
              {recipe.dietary.map((d) => <li key={d}><Badge tone="green">{d}</Badge></li>)}
            </ul>
            <div className="no-print mt-7 flex flex-wrap gap-2">
              <Button icon={PlayCircle} onClick={() => setCooking(true)}>Start cooking</Button>
              <FavoriteButton recipe={recipe} variant="button" />
              {!isAdmin && (
                <Button variant="secondary" icon={FolderPlus} onClick={requireAuth(() => setCollectionOpen(true), 'Sign in to build collections.')}>
                  Add to collection
                </Button>
              )}
              <Button variant="secondary" icon={Share2} onClick={share} aria-label="Share recipe">Share</Button>
              <Button variant="secondary" icon={Printer} onClick={() => window.print()} aria-label="Print recipe">Print</Button>
            </div>
          </div>
          <RecipeImage src={recipe.image} alt={recipe.title} width={1200} eager className="aspect-[4/3] rounded-[18px] shadow-lift" />
        </div>

        <dl className="mt-10 grid grid-cols-2 divide-ivory-300 rounded-card border border-ivory-300 bg-white sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          <Meta icon={Timer} label="Prep time" value={formatMinutes(recipe.prepTime)} />
          <Meta icon={Flame} label="Cook time" value={formatMinutes(recipe.cookTime)} />
          <Meta icon={Clock} label="Total time" value={formatMinutes(recipe.totalTime)} />
          <Meta icon={ChefHat} label="Difficulty" value={recipe.difficulty} />
          <Meta icon={Users} label="Servings" value={`${recipe.servings} serving${recipe.servings > 1 ? 's' : ''}`} />
        </dl>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(300px,380px)_1fr]">
          <aside aria-labelledby="ingredients-heading">
            <div className="card p-6 lg:sticky lg:top-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="ingredients-heading" className="text-2xl font-semibold">Ingredients</h2>
                <div className="no-print flex items-center gap-1 rounded-full border border-ivory-300 p-1" role="group" aria-label="Adjust servings">
                  <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} disabled={servings <= 1} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-forest-50 disabled:opacity-40" aria-label="Decrease servings">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[88px] text-center text-sm font-medium" aria-live="polite">{servings} serving{servings > 1 ? 's' : ''}</span>
                  <button type="button" onClick={() => setServings((s) => Math.min(50, s + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-forest-50" aria-label="Increase servings">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {servings !== recipe.servings && (
                <p className="no-print mt-2 text-xs text-muted">
                  Quantities scaled from {recipe.servings}. <button type="button" className="font-medium text-forest underline" onClick={() => setServings(recipe.servings)}>Reset</button>
                </p>
              )}
              <ul className="mt-5 divide-y divide-ivory-200">
                {ingredients.map((ing) => (
                  <li key={ing.id}>
                    <label className="flex cursor-pointer items-start gap-3 py-2.5">
                      <input type="checkbox" className="no-print mt-1 h-4 w-4 shrink-0 accent-forest" checked={!!checked[ing.id]} onChange={() => setChecked((c) => ({ ...c, [ing.id]: !c[ing.id] }))} />
                      <span className={`text-[15px] leading-snug ${checked[ing.id] ? 'text-muted line-through' : ''}`}>
                        {ing.scaled !== null ? <strong className="font-semibold">{formatQuantity(ing.scaled)}{unitLabel(ing.unit, ing.scaled) ? ` ${unitLabel(ing.unit, ing.scaled)}` : ''} </strong> : null}
                        {ing.name}
                        {ing.scaled === null && <span className="text-muted"> — to taste</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {hasNutrition && (
                <div className="mt-6 rounded-lg bg-ivory p-4">
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">Nutrition per serving</h3>
                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[['Calories', n.calories, 'kcal'], ['Protein', n.protein, 'g'], ['Carbs', n.carbs, 'g'], ['Fat', n.fat, 'g']].map(([label, v, u]) => (
                      <div key={label}>
                        <dd className="font-display text-xl font-semibold">{v ?? '—'}</dd>
                        <dt className="text-[11px] text-muted">{label}{v != null ? ` (${u})` : ''}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </aside>

          <section aria-labelledby="method-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="method-heading" className="text-2xl font-semibold">Method</h2>
              <Button variant="ghost" size="sm" icon={PlayCircle} onClick={() => setCooking(true)} className="no-print">Cooking mode</Button>
            </div>
            <ol className="mt-6 space-y-6">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest font-display text-lg font-semibold text-ivory" aria-hidden="true">{i + 1}</span>
                  <div className="pt-1.5">
                    <h3 className="sr-only">Step {i + 1}</h3>
                    <p className="text-[16px] leading-relaxed text-charcoal/90">{s}</p>
                  </div>
                </li>
              ))}
            </ol>
            {recipe.tags?.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                {recipe.tags.map((t) => (
                  <li key={t}><Link to={`/explore?q=${encodeURIComponent(t)}`} className="chip hover:border-forest/40">#{t}</Link></li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-16 border-t border-ivory-300 pt-12">
          <ReviewSection recipe={recipe} />
        </div>

        {related.length > 0 && (
          <section className="no-print mt-16 border-t border-ivory-300 pt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-8 text-2xl font-semibold sm:text-3xl">You might also like</h2>
            <RecipeGrid recipes={related} />
          </section>
        )}
      </div>

      {collectionOpen && <AddToCollectionModal open={collectionOpen} onClose={() => setCollectionOpen(false)} recipe={recipe} />}
      {cooking && <CookingMode recipe={recipe} ingredients={ingredients} onClose={() => setCooking(false)} />}
    </article>
  );
}
