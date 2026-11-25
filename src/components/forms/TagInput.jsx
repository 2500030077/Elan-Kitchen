import { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ value = [], onChange, max = 10, label = 'Tags', hint }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    if (!t || value.includes(t) || value.length >= max) {
      setDraft('');
      return;
    }
    onChange([...value, t]);
    setDraft('');
  };
  return (
    <div>
      <label htmlFor="tag-input" className="label">{label}</label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ivory-300 bg-white p-2 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/15">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest">
            #{t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="rounded-full hover:text-danger">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id="tag-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={add}
          placeholder={value.length >= max ? 'Tag limit reached' : 'Type a tag and press Enter'}
          disabled={value.length >= max}
          className="min-w-[160px] flex-1 bg-transparent px-1 py-1 text-sm focus:outline-none"
          maxLength={24}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{hint || `Up to ${max} tags, e.g. quick, spicy, festive.`}</p>
    </div>
  );
}
