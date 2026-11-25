import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { TextField, TextAreaField } from '../../components/forms/FormField';
import ImageInput from '../../components/forms/ImageInput';
import RecipeImage from '../../components/common/RecipeImage';

/** Create / rename a collection, choose a cover (from its recipes, URL or upload). */
export default function CollectionFormModal({ open, onClose, onSave, initial, recipeImages = [] }) {
  const [form, setForm] = useState({ name: '', description: '', coverImage: '' });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setForm({ name: initial?.name || '', description: initial?.description || '', coverImage: initial?.coverImage || '' });
      setErrors({});
    }
  }, [open, initial]);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Collection name is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      onSave(form);
    } catch (err) {
      setErrors(err.errors || { name: err.message });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit collection' : 'New collection'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="collection-form">{initial ? 'Save changes' : 'Create collection'}</Button>
        </>
      }
    >
      <form id="collection-form" onSubmit={submit} noValidate className="space-y-5">
        <TextField label="Name" required maxLength={50} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} data-autofocus placeholder="e.g. Weekend Specials" />
        <TextAreaField label="Description" rows={2} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} hint={`${form.description.length}/200`} />
        {recipeImages.length > 0 && (
          <fieldset>
            <legend className="label">Use a recipe photo as cover</legend>
            <div className="flex flex-wrap gap-2">
              {recipeImages.slice(0, 10).map((img) => (
                <button key={img} type="button" onClick={() => setForm({ ...form, coverImage: img })} aria-pressed={form.coverImage === img} aria-label="Use this recipe photo as cover" className={`rounded-lg p-0.5 ${form.coverImage === img ? 'ring-2 ring-forest' : 'ring-1 ring-ivory-300'}`}>
                  <RecipeImage src={img} alt="" width={120} className="h-14 w-14 rounded-md" />
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <ImageInput label="Or choose a custom cover" value={form.coverImage} onChange={(v) => setForm({ ...form, coverImage: v })} maxDim={900} aspect="aspect-[16/10]" />
      </form>
    </Modal>
  );
}
