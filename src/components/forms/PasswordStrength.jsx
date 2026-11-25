import { Check, X } from 'lucide-react';
import { passwordChecks, passwordStrength } from '../../utils/validation';

const COLORS = ['bg-ivory-300', 'bg-danger', 'bg-terracotta', 'bg-gold', 'bg-success'];

export default function PasswordStrength({ password }) {
  const { score, label } = passwordStrength(password);
  const c = passwordChecks(password);
  const rules = [
    [c.length, 'At least 8 characters'],
    [c.upper, 'One uppercase letter'],
    [c.lower, 'One lowercase letter'],
    [c.number, 'One number'],
  ];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${score >= i ? COLORS[score] : 'bg-ivory-300'}`} />
        ))}
      </div>
      {password && <p className="mt-1.5 text-xs text-muted">Strength: <span className="font-medium text-charcoal">{label}</span></p>}
      <ul className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
        {rules.map(([ok, text]) => (
          <li key={text} className={`flex items-center gap-1.5 ${ok ? 'text-success' : 'text-muted'}`}>
            {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{text}<span className="sr-only">{ok ? ' — met' : ' — not met'}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
