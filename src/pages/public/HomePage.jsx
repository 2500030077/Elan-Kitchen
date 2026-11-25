import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Compass, PenLine, CalendarHeart, Star, Clock } from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';
import { useAuth } from '../../context/AuthContext';
import RecipeSection from '../../components/recipes/RecipeSection';
import RecipeImage from '../../components/common/RecipeImage';
import Avatar from '../../components/common/Avatar';
import { Stars } from '../../components/common/StarRating';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMinutes } from '../../utils/helpers';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1565661833906-f1da5fd3b6ab';

function HeroSearch() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore');
      }}
      className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-xl border border-ivory-300 bg-white p-1.5 shadow-soft focus-within:border-forest"
    >
      <label htmlFor="hero-search" className="sr-only">Search recipes</label>
      <Search className="ml-3 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      <input
        id="hero-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search biryani, pasta, brownies…"
        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[15px] focus:outline-none"
      />
      <button type="submit" className="btn btn-primary shrink-0">Search</button>
    </form>
  );
}

export default function HomePage() {
  usePageTitle();
  const { approvedRecipes, users, reviews } = useRecipes();
  const { user } = useAuth();

  const sections = useMemo(() => {
    const byPop = [...approvedRecipes].sort((a, b) => b.popularity - a.popularity);
    const quick = approvedRecipes.filter((r) => r.totalTime <= 30).sort((a, b) => b.rating - a.rating || a.totalTime - b.totalTime);
    const healthy = approvedRecipes
      .filter((r) => r.categoryName === 'Salads & Bowls' || r.dietary.some((d) => ['Vegan', 'High-Protein', 'Low-Carb'].includes(d)))
      .sort((a, b) => b.rating - a.rating);
    const community = [...approvedRecipes]
      .filter((r) => r.reviewCount > 0)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    const cuisines = new Map();
    approvedRecipes.forEach((r) => {
      const c = cuisines.get(r.cuisine) || { name: r.cuisine, count: 0, image: r.image, best: r };
      c.count += 1;
      if (r.popularity > c.best.popularity) {
        c.best = r;
        c.image = r.image;
      }
      cuisines.set(r.cuisine, c);
    });
    return {
      trending: byPop.slice(0, 4),
      quick: quick.slice(0, 4),
      healthy: healthy.slice(0, 4),
      featured: community[0],
      community: community.slice(1, 5),
      cuisines: [...cuisines.values()].sort((a, b) => b.count - a.count).slice(0, 6),
      spotlight: byPop[0],
    };
  }, [approvedRecipes]);

  const stats = [
    { label: 'Community recipes', value: approvedRecipes.length },
    { label: 'Home cooks', value: users.filter((u) => u.role === 'user').length },
    { label: 'Cuisines', value: new Set(approvedRecipes.map((r) => r.cuisine)).size },
    { label: 'Reviews shared', value: reviews.length },
  ];

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div className="container-site grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="eyebrow">Discover. Create. Savor.</p>
            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.08] sm:text-6xl lg:text-[4.1rem]">
              Good food begins with <em className="font-medium italic text-forest">inspiration.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Explore hand-picked recipes from a community of home cooks, save the ones you love, plan your week and
              share your own signature dishes.
            </p>
            <HeroSearch />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/explore" className="btn btn-primary">
                Explore Recipes <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {!user && <Link to="/signup" className="btn btn-secondary">Create a free account</Link>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
            <RecipeImage src={HERO_IMAGE} alt="A table set with an abundant spread of colourful home-cooked dishes" width={1100} eager className="aspect-[4/5] rounded-[20px] shadow-lift sm:aspect-[5/5] lg:aspect-[4/5]" />
            {sections.spotlight && (
              <Link
                to={`/recipes/${sections.spotlight.id}`}
                className="absolute -bottom-6 left-4 right-4 flex items-center gap-4 rounded-card border border-ivory-300 bg-white p-3.5 shadow-lift transition-transform hover:-translate-y-0.5 sm:left-auto sm:right-6 sm:w-80"
              >
                <RecipeImage src={sections.spotlight.image} alt="" width={160} className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-dark">Most loved this month</p>
                  <p className="truncate font-display text-lg font-semibold">{sections.spotlight.title}</p>
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Stars value={sections.spotlight.rating} size="h-3 w-3" /> {formatMinutes(sections.spotlight.totalTime)}
                  </p>
                </div>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section aria-label="Community at a glance" className="border-y border-ivory-300 bg-white">
        <dl className="container-site grid grid-cols-2 divide-ivory-300 py-8 sm:grid-cols-4 sm:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-2 text-center">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">{s.label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold text-forest-dark">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------- Cuisines ---------------- */}
      <section className="container-site py-16" aria-labelledby="cuisines-heading">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Travel by taste</p>
          <h2 id="cuisines-heading" className="text-3xl font-semibold sm:text-4xl">Popular cuisines</h2>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {sections.cuisines.map((c) => (
            <li key={c.name}>
              <Link to={`/explore?cuisine=${encodeURIComponent(c.name)}`} className="group block text-center">
                <RecipeImage src={c.image} alt="" width={360} className="mx-auto aspect-square w-full rounded-full ring-4 ring-white shadow-soft transition-transform duration-300 group-hover:scale-[1.03]" />
                <p className="mt-3 font-display text-lg font-semibold group-hover:text-forest">{c.name}</p>
                <p className="text-xs text-muted">{c.count} recipe{c.count === 1 ? '' : 's'}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <RecipeSection eyebrow="What everyone’s cooking" title="Trending recipes" recipes={sections.trending} link="/explore?sort=popular" />

      {/* ---------------- Featured community ---------------- */}
      {sections.featured && (
        <section className="bg-forest-dark py-16 text-ivory sm:py-20" aria-labelledby="featured-heading">
          <div className="container-site">
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">From our members</p>
                <h2 id="featured-heading" className="text-3xl font-semibold text-ivory sm:text-4xl">Featured community recipes</h2>
              </div>
              <Link to="/explore?sort=newest" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-light">
                See the latest <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
              <Link to={`/recipes/${sections.featured.id}`} className="group relative block overflow-hidden rounded-card">
                <RecipeImage src={sections.featured.image} alt={sections.featured.title} width={1000} className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.02]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 pt-20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">{sections.featured.cuisine} · {formatMinutes(sections.featured.totalTime)}</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-white">{sections.featured.title}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
                    <Avatar name={sections.featured.authorName} src={sections.featured.authorAvatar} size="sm" /> {sections.featured.authorName}
                  </p>
                </div>
              </Link>
              <ul className="grid gap-4">
                {sections.community.map((r) => (
                  <li key={r.id}>
                    <Link to={`/recipes/${r.id}`} className="flex items-center gap-4 rounded-card border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                      <RecipeImage src={r.image} alt="" width={200} className="h-20 w-20 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-semibold text-ivory">{r.title}</p>
                        <p className="text-xs text-ivory/70">by {r.authorName}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ivory/80">
                          <Star className="h-3.5 w-3.5 text-gold" fill="currentColor" aria-hidden="true" /> {r.rating.toFixed(1)} · {r.reviewCount} review{r.reviewCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <RecipeSection eyebrow="30 minutes or less" title="Quick & easy" description="Weeknight-friendly dishes that never compromise on flavour." recipes={sections.quick} link="/explore?maxTime=30&sort=time" />
      <RecipeSection eyebrow="Nourish yourself" title="Healthy recipes" description="Bright bowls, plant-based plates and protein-packed meals." recipes={sections.healthy} link="/explore?category=salads-bowls" linkLabel="Explore healthy" />

      {/* ---------------- How it works ---------------- */}
      <section className="border-y border-ivory-300 bg-white py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="container-site">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow mb-2">How Élan Kitchen works</p>
            <h2 id="how-heading" className="text-3xl font-semibold sm:text-4xl">From inspiration to the dinner table</h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Compass, title: 'Discover', text: 'Search by dish or ingredient and filter by cuisine, diet, time and rating to find exactly what you crave.' },
              { icon: CalendarHeart, title: 'Plan & cook', text: 'Save favourites into collections, plan your week, generate a shopping list and cook with step-by-step mode.' },
              { icon: PenLine, title: 'Create & share', text: 'Submit your own recipes. Our editors review every submission before it is published to the community.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-card border border-ivory-300 bg-ivory/60 p-7">
                <span className="absolute right-6 top-5 font-display text-5xl font-semibold text-ivory-300" aria-hidden="true">0{i + 1}</span>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-ivory">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container-site py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[20px] bg-forest px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/15" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5" aria-hidden="true" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-gold">{user ? 'Share your craft' : 'Join the community'}</p>
          <h2 className="relative mx-auto mt-3 max-w-2xl text-3xl font-semibold text-ivory sm:text-[2.6rem] sm:leading-tight">
            {user ? 'Have a recipe everyone should know?' : 'Cook more. Waste less. Share what you love.'}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-ivory/75">
            {user
              ? 'Submit it to Élan Kitchen. Once approved by our editors, it will inspire cooks across the community.'
              : 'Create a free account to save favourites, build collections, plan meals, rate recipes and publish your own.'}
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin/recipes' : '/user/recipes/new'} className="btn btn-gold">
                {user.role === 'admin' ? 'Review submissions' : 'Submit a recipe'}
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-gold">Create your free account</Link>
                <Link to="/login" className="btn border border-white/25 text-ivory hover:bg-white/10">I already have an account</Link>
              </>
            )}
          </div>
          <p className="relative mt-6 inline-flex items-center gap-2 text-xs text-ivory/60">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Takes less than a minute
          </p>
        </div>
      </section>
    </>
  );
}
