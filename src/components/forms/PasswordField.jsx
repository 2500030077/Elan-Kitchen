import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field } from './FormField';

export default function PasswordField({ label = 'Password', error, hint, required, className, id, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={id}>
      {(a11y) => (
        <div className="relative">
          <input type={visible ? 'text' : 'password'} className={`input pr-12 ${error ? 'input-error' : ''}`} {...a11y} {...props} />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted hover:text-charcoal"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
    </Field>
  );
}
