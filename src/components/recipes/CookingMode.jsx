import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { formatQuantity, unitLabel } from '../../utils/helpers';

/** Full-screen, distraction-free step-by-step cooking view. */
export default function CookingMode({ recipe, ingredients, onClose }) {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState({});
  const total = recipe.steps.length;
  const done = step >= total;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(total, s + 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, total]);

  const progress = Math.round((Math.min(step, total) / total) * 100);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Cooking mode: ${recipe.title}`} className="fixed inset-0 z-[70] flex flex-col bg-ivory">
      <header className="flex items-center justify-between gap-4 border-b border-ivory-300 bg-white px-4 py-3 sm:px-8">
        <div className="min-w-0">
          <p className="eyebrow">Cooking mode</p>
          <h2 className="truncate text-lg font-semibold sm:text-xl">{recipe.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" autoFocus>
          <X className="h-4 w-4" aria-hidden="true" /> Exit
        </button>
      </header>
      <div className="h-1.5 bg-ivory-300" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Recipe progress">
        <div className="h-full bg-forest transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="hidden overflow-y-auto border-r border-ivory-300 bg-white p-6 lg:block" aria-label="Ingredient checklist">
          <h3 className="mb-4 text-lg font-semibold">Ingredients</h3>
          <ul className="space-y-2">
            {ingredients.map((ing) => (
              <li key={ing.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-ivory">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-forest" checked={!!checked[ing.id]} onChange={() => setChecked((c) => ({ ...c, [ing.id]: !c[ing.id] }))} />
                  <span className={`text-sm ${checked[ing.id] ? 'text-muted line-through' : ''}`}>
                    {ing.scaled !== null && <strong className="font-semibold">{formatQuantity(ing.scaled)} {unitLabel(ing.unit, ing.scaled)} </strong>}
                    {ing.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex flex-col overflow-y-auto px-5 py-8 sm:px-12 lg:px-20">
          {!done ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center" aria-live="polite">
              <p className="eyebrow">Step {step + 1} of {total}</p>
              <p className="mt-4 font-display text-2xl leading-relaxed text-charcoal sm:text-4xl sm:leading-snug">{recipe.steps[step]}</p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center" aria-live="polite">
              <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
              <h3 className="mt-4 text-3xl font-semibold">Bon appétit!</h3>
              <p className="mt-2 text-muted">You’ve completed every step. Enjoy your {recipe.title}.</p>
              <button type="button" className="btn btn-primary mt-6" onClick={onClose}>Finish</button>
            </div>
          )}
          <ol className="mx-auto mt-8 flex flex-wrap justify-center gap-2" aria-label="Steps">
            {recipe.steps.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={i === step ? 'step' : undefined}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-9 w-9 rounded-full text-sm font-semibold ${i === step ? 'bg-forest text-white' : i < step ? 'bg-forest-100 text-forest-dark' : 'bg-white text-muted ring-1 ring-ivory-300'}`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
        </main>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-ivory-300 bg-white px-4 py-4 sm:px-8">
        <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </button>
        <span className="text-sm text-muted">{progress}% complete</span>
        <button type="button" className="btn btn-primary" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={done}>
          {step === total - 1 ? 'Finish' : 'Next step'} <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </footer>
    </div>,
    document.body,
  );
}
