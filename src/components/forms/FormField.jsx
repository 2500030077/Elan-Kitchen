import { useId } from 'react';

/** Shared label + hint + error wrapper wired with aria attributes. */
export function Field({ label, error, hint, required, children, id: idProp, className = '' }) {
  const autoId = useId();
  const id = idProp || autoId;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-terracotta-dark" aria-hidden="true">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy, 'aria-required': required || undefined })}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}

export function TextField({ label, error, hint, required, className, inputClassName = '', id, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={id}>
      {(a11y) => <input className={`input ${error ? 'input-error' : ''} ${inputClassName}`} {...a11y} {...props} />}
    </Field>
  );
}

export function TextAreaField({ label, error, hint, required, className, rows = 4, id, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={id}>
      {(a11y) => <textarea rows={rows} className={`input resize-y ${error ? 'input-error' : ''}`} {...a11y} {...props} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, required, className, options = [], placeholder, id, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={id}>
      {(a11y) => (
        <select className={`input pr-9 ${error ? 'input-error' : ''}`} {...a11y} {...props}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      )}
    </Field>
  );
}

export function CheckboxField({ label, error, checked, onChange, id: idProp, className = '', children }) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-ivory-300 accent-forest"
        />
        <label htmlFor={id} className="cursor-pointer text-sm text-charcoal/90">{label || children}</label>
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
