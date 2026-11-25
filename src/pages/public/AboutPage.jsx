import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Users, HeartHandshake } from 'lucide-react';
import RecipeImage from '../../components/common/RecipeImage';
import { useRecipes } from '../../context/RecipeContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function AboutPage() {
  usePageTitle('About Us');
  const { approvedRecipes, users, reviews } = useRecipes();
  const values = [
    { icon: Leaf, title: 'Ingredient-first', text: 'Every recipe lists precise quantities that scale with your servings, so nothing is wasted.' },
    { icon: ShieldCheck, title: 'Editorially reviewed', text: 'Our moderators check each community submission for clarity and completeness before publishing.' },
    { icon: Users, title: 'Community-driven', text: 'Ratings and reviews come from real members who cooked the dish in their own kitchens.' },
    { icon: HeartHandshake, title: 'Made for everyday', text: 'Meal planning and shopping lists turn inspiration into a realistic weekly routine.' },
  ];
  return (
    <div>
      <section className="container-site grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="eyebrow mb-3">About Élan Kitchen</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">A table where every home cook has a seat.</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Élan Kitchen began with a simple idea: the best recipes aren’t locked away in restaurant kitchens — they live in
            family notebooks, WhatsApp messages and weekend experiments. We built a place to gather them, polish them and share
            them beautifully.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Today our community of {users.filter((u) => u.role === 'user').length} cooks has published {approvedRecipes.length} recipes
            and left {reviews.length} reviews spanning {new Set(approvedRecipes.map((r) => r.cuisine)).size} cuisines.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/explore" className="btn btn-primary">Explore recipes</Link>
            <Link to="/contact" className="btn btn-secondary">Get in touch</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RecipeImage src="https://images.unsplash.com/photo-1577219492769-b63a779fac28" alt="A chef carefully preparing a plated dish" width={700} className="aspect-[3/4] rounded-card" />
          <RecipeImage src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d" alt="Colourful whole and ground spices arranged on a table" width={700} className="mt-10 aspect-[3/4] rounded-card" />
        </div>
      </section>
      <section className="border-y border-ivory-300 bg-white py-16" aria-labelledby="values-heading">
        <div className="container-site">
          <h2 id="values-heading" className="mb-10 text-center text-3xl font-semibold sm:text-4xl">What we stand for</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-card border border-ivory-300 bg-ivory/60 p-6">
                <Icon className="h-7 w-7 text-forest" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="container-site py-16 text-center">
        <p className="mx-auto max-w-3xl font-display text-2xl italic leading-relaxed text-forest-dark sm:text-3xl">
          “Cooking is how we say <span className="text-terracotta-dark">welcome</span>, <span className="text-terracotta-dark">thank you</span> and <span className="text-terracotta-dark">I love you</span> — often all at once.”
        </p>
        <p className="mt-4 text-sm text-muted">— The Élan Kitchen team</p>
      </section>
    </div>
  );
}
