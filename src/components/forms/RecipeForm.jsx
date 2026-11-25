import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, TextAreaField, SelectField } from './FormField';
import ImageInput from './ImageInput';
import TagInput from './TagInput';
import Button from '../common/Button';
import { CUISINES, DIETARY_OPTIONS, DIFFICULTIES, UNITS } from '../../utils/constants';
import { generateId } from '../../utils/helpers';
import { validateRecipe } from '../../utils/validation';

const blankIngredient = () => ({ id: generateId(), name: '', quantity: '', unit: '' });

export const toFormState = (recipe) =>
  recipe
    ? {
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        categoryId: recipe.categoryId,
        dietary: recipe.dietary || [],
        difficulty: recipe.difficulty,
        prepTime: String(recipe.prepTime ?? ''),
        cookTime: String(recipe.cookTime ?? ''),
        servings: String(recipe.servings ?? ''),
        image: recipe.image,
        ingredients: (recipe.ingredients || []).map((i) => ({ id: i.id || generateId(), name: i.name, quantity: i.quantity ?? '', unit: i.unit || '' })),
        steps: [...(recipe.steps || [])],
        nutrition: {
          calories: recipe.nutrition?.calories ?? '',
          protein: recipe.nutrition?.protein ?? '',
          carbs: recipe.nutrition?.carbs ?? '',
          fat: recipe.nutrition?.fat ?? '',
        },
        tags: recipe.tags || [],
      }
    : {
        title: '',
        description: '',
        cuisine: '',
        categoryId: '',
        dietary: [],
        difficulty: '',
        prepTime: '',
        cookTime: '',
        servings: '4',
        image: '',
        ingredients: [blankIngredient(), blankIngredient(), blankIngredient()],
        steps: ['', ''],
        nutrition: { calories: '', protein: '', carbs: '', fat: '' },
        tags: [],
      };

function Section({ title, description, children }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function RecipeForm({ initial, categories, onSubmit, submitLabel = 'Submit for review', onCancel, notice }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const field = (k) => ({ value: form[k], onChange: (e) => set(k, e.target.value), error: errors[k] });

  const updateIng = (id, patch) => set('ingredients', form.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const moveStep = (i, dir) => {
    const s = [...form.steps];
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    set('steps', s);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateRecipe(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields.');
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || 'Could not save the recipe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {notice}
      <Section title="The basics" description="A clear title and an appetising description help your recipe get approved.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField className="sm:col-span-2" label="Recipe title" required maxLength={90} placeholder="e.g. Smoky Chipotle Black Bean Tacos" {...field('title')} />
          <TextAreaField className="sm:col-span-2" label="Description" required rows={3} maxLength={500} hint={`${form.description.length}/500`} {...field('description')} />
          <SelectField label="Cuisine" required placeholder="Select cuisine" options={CUISINES} {...field('cuisine')} />
          <SelectField label="Category" required placeholder="Select category" options={categories.map((c) => ({ value: c.id, label: c.name }))} {...field('categoryId')} />
          <SelectField label="Difficulty" required placeholder="Select difficulty" options={DIFFICULTIES} {...field('difficulty')} />
          <TextField label="Servings" type="number" min={1} max={50} required inputMode="numeric" {...field('servings')} />
          <TextField label="Preparation time (min)" type="number" min={0} required inputMode="numeric" {...field('prepTime')} />
          <TextField label="Cooking time (min)" type="number" min={0} required inputMode="numeric" {...field('cookTime')} />
        </div>
        <fieldset className="mt-6">
          <legend className="label">Dietary preferences <span className="text-terracotta-dark" aria-hidden="true">*</span></legend>
          <div className="flex flex-wrap gap-2" aria-invalid={!!errors.dietary}>
            {DIETARY_OPTIONS.map((d) => {
              const on = form.dietary.includes(d);
              return (
                <button key={d} type="button" aria-pressed={on} onClick={() => set('dietary', on ? form.dietary.filter((x) => x !== d) : [...form.dietary, d])} className={`chip min-h-[36px] ${on ? 'chip-active' : 'hover:border-forest/40'}`}>
                  {d}
                </button>
              );
            })}
          </div>
          {errors.dietary && <p className="mt-1.5 text-sm text-danger" role="alert">{errors.dietary}</p>}
        </fieldset>
      </Section>

      <Section title="Photo">
        <ImageInput value={form.image} onChange={(v) => set('image', v)} error={errors.image} required />
      </Section>

      <Section title="Ingredients" description="Leave quantity empty for “to taste”. Numeric quantities scale automatically with servings.">
        <ul className="space-y-3">
          {form.ingredients.map((ing, idx) => (
            <li key={ing.id} className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[90px_120px_1fr_auto]">
              <label className="sr-only" htmlFor={`q-${ing.id}`}>Quantity for ingredient {idx + 1}</label>
              <input id={`q-${ing.id}`} type="number" min="0" step="any" inputMode="decimal" placeholder="Qty" className="input order-2 sm:order-none" value={ing.quantity} onChange={(e) => updateIng(ing.id, { quantity: e.target.value })} />
              <label className="sr-only" htmlFor={`u-${ing.id}`}>Unit for ingredient {idx + 1}</label>
              <select id={`u-${ing.id}`} className="input order-3 sm:order-none" value={ing.unit} onChange={(e) => updateIng(ing.id, { unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u || '— unit —'}</option>)}
              </select>
              <label className="sr-only" htmlFor={`n-${ing.id}`}>Ingredient {idx + 1} name</label>
              <input id={`n-${ing.id}`} placeholder={`Ingredient ${idx + 1}, e.g. Basmati rice`} className="input order-1 sm:order-none" value={ing.name} onChange={(e) => updateIng(ing.id, { name: e.target.value })} maxLength={80} />
              <button type="button" onClick={() => set('ingredients', form.ingredients.filter((i) => i.id !== ing.id))} disabled={form.ingredients.length <= 1} className="order-1 inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger disabled:opacity-30 sm:order-none" aria-label={`Remove ingredient ${idx + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        {errors.ingredients && <p className="mt-2 text-sm text-danger" role="alert">{errors.ingredients}</p>}
        <Button variant="secondary" size="sm" icon={Plus} className="mt-4" onClick={() => set('ingredients', [...form.ingredients, blankIngredient()])} disabled={form.ingredients.length >= 40}>
          Add ingredient
        </Button>
      </Section>

      <Section title="Method" description="Write one clear action per step.">
        <ol className="space-y-3">
          {form.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white" aria-hidden="true">{i + 1}</span>
              <label className="sr-only" htmlFor={`step-${i}`}>Step {i + 1}</label>
              <textarea id={`step-${i}`} rows={2} className="input flex-1 resize-y" value={s} placeholder={`Describe step ${i + 1}`} maxLength={600} onChange={(e) => set('steps', form.steps.map((x, j) => (j === i ? e.target.value : x)))} />
              <div className="flex flex-col">
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-forest-50 disabled:opacity-30" aria-label={`Move step ${i + 1} up`}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-forest-50 disabled:opacity-30" aria-label={`Move step ${i + 1} down`}><ArrowDown className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={() => set('steps', form.steps.filter((_, j) => j !== i))} disabled={form.steps.length <= 1} className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger disabled:opacity-30" aria-label={`Remove step ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
        {errors.steps && <p className="mt-2 text-sm text-danger" role="alert">{errors.steps}</p>}
        <Button variant="secondary" size="sm" icon={Plus} className="mt-4" onClick={() => set('steps', [...form.steps, ''])} disabled={form.steps.length >= 30}>
          Add step
        </Button>
      </Section>

      <Section title="Extras" description="Optional — nutrition per serving and tags help people find your recipe.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['calories', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([k, l]) => (
            <TextField key={k} label={l} type="number" min={0} inputMode="numeric" value={form.nutrition[k]} onChange={(e) => set('nutrition', { ...form.nutrition, [k]: e.target.value })} />
          ))}
        </div>
        <div className="mt-5">
          <TagInput value={form.tags} onChange={(t) => set('tags', t)} />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap justify-end gap-3 rounded-card border border-ivory-300 bg-white/95 p-4 shadow-lift backdrop-blur">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}
