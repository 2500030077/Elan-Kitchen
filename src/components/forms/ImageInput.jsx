import { useId, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage, dataUrlSizeKB } from '../../utils/image';
import RecipeImage from '../common/RecipeImage';

/** Image picker supporting an https URL or a compressed local upload. */
export default function ImageInput({ value, onChange, error, label = 'Recipe image', maxDim = 1200, aspect = 'aspect-[4/3]', required }) {
  const id = useId();
  const fileRef = useRef(null);
  const [mode, setMode] = useState(value?.startsWith('data:') ? 'upload' : 'url');
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value && !value.startsWith('data:') ? value : '');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, { maxDim });
      onChange(dataUrl);
      toast.success(`Image compressed to ${dataUrlSizeKB(dataUrl)} KB`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="label" id={`${id}-label`}>
        {label}
        {required && <span className="ml-0.5 text-terracotta-dark" aria-hidden="true">*</span>}
      </p>
      <div className="mb-3 inline-flex rounded-lg border border-ivory-300 bg-white p-1" role="tablist" aria-labelledby={`${id}-label`}>
        {[
          ['url', 'Image URL', Link2],
          ['upload', 'Upload', ImagePlus],
        ].map(([m, text, Icon]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-forest text-white' : 'text-charcoal hover:bg-forest-50'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" /> {text}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          {mode === 'url' ? (
            <div className="flex gap-2">
              <label htmlFor={`${id}-url`} className="sr-only">Image URL</label>
              <input
                id={`${id}-url`}
                type="url"
                className={`input ${error ? 'input-error' : ''}`}
                placeholder="https://images.unsplash.com/…"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onBlur={() => onChange(urlDraft.trim())}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-err` : `${id}-hint`}
              />
            </div>
          ) : (
            <div>
              <input ref={fileRef} id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} aria-describedby={error ? `${id}-err` : `${id}-hint`} />
              <label htmlFor={`${id}-file`} className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${error ? 'border-danger' : 'border-ivory-300 hover:border-forest/50 hover:bg-forest-50/50'}`}>
                {busy ? <Loader2 className="h-6 w-6 animate-spin text-forest" aria-hidden="true" /> : <ImagePlus className="h-6 w-6 text-forest" aria-hidden="true" />}
                <span className="font-medium">{busy ? 'Compressing…' : 'Choose an image'}</span>
              </label>
            </div>
          )}
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
            {mode === 'url' ? 'Paste a direct link to an image (https).' : 'JPG, PNG or WebP up to 5 MB. Images are resized and compressed before saving.'}
          </p>
          {error && <p id={`${id}-err`} className="mt-1.5 text-sm text-danger" role="alert">{error}</p>}
        </div>
        <div className="relative">
          {value ? (
            <>
              <RecipeImage key={value} src={value} alt="Selected image preview" width={400} className={`${aspect} w-full rounded-lg border border-ivory-300`} />
              <button type="button" onClick={() => { onChange(''); setUrlDraft(''); }} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-danger shadow" aria-label="Remove image">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className={`${aspect} flex w-full items-center justify-center rounded-lg border border-dashed border-ivory-300 bg-ivory-200/50 text-xs text-muted`}>Preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
