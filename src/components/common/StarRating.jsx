import { useState } from 'react';
import { Star } from 'lucide-react';

/** Read-only star display. */
export function Stars({ value = 0, size = 'h-4 w-4', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Rated ${value} out of 5`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(value - (i - 1), 0), 1);
        return (
          <span key={i} className={`relative inline-block ${size}`} aria-hidden="true">
            <Star className={`absolute inset-0 ${size} text-ivory-300`} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${size} text-gold`} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingSummary({ rating, count, className = '' }) {
  if (!count) return <span className={`text-xs text-muted ${className}`}>No ratings yet</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <Stars value={rating} size="h-3.5 w-3.5" />
      <span className="font-medium text-charcoal">{rating.toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

/** Keyboard-accessible star input (radio group). */
export function StarInput({ value, onChange, error, id = 'rating' }) {
  const [hover, setHover] = useState(0);
  const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  return (
    <div>
      <div role="radiogroup" aria-labelledby={`${id}-label`} aria-invalid={!!error} className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? 's' : ''} — ${labels[i - 1]}`}
            tabIndex={value === i || (!value && i === 1) ? 0 : -1}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                onChange(Math.min(5, (value || 0) + 1));
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                onChange(Math.max(1, (value || 2) - 1));
              }
            }}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`h-7 w-7 ${(hover || value) >= i ? 'text-gold' : 'text-ivory-300'}`} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted">{labels[(hover || value) - 1] || 'Select a rating'}</span>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
