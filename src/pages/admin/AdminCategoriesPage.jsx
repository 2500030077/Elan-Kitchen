import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { TextField, TextAreaField, SelectField } from '../../components/forms/FormField';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';

export default function AdminCategoriesPage() {
  usePageTitle('Category Management');
  const { user } = useAuth();
  const { categories, allRecipes } = useRecipes();
  const [editing, setEditing] = useState(null); // {initial|null}
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [target, setTarget] = useState('');
  const [targetErr, setTargetErr] = useState('');

  const counts = useMemo(() => {
    const m = new Map();
    allRecipes.forEach((r) => m.set(r.categoryId, (m.get(r.categoryId) || 0) + 1));
    return m;
  }, [allRecipes]);

  const open = (initial) => {
    setEditing({ initial });
    setForm({ name: initial?.name || '', description: initial?.description || '' });
    setErrors({});
  };

  const save = (e) => {
    e.preventDefault();
    try {
      if (editing.initial) {
        recipeService.updateCategory(user, editing.initial.id, form);
        toast.success('Category updated');
      } else {
        recipeService.createCategory(user, form);
        toast.success(`Created “${form.name.trim()}”`);
      }
      setEditing(null);
    } catch (err) {
      setErrors(err.errors || { name: err.message });
    }
  };

  const doDelete = () => {
    const used = counts.get(deleting.id) || 0;
    if (used && !target) {
      setTargetErr('Choose a category to move these recipes to.');
      return;
    }
    try {
      recipeService.deleteCategory(user, deleting.id, used ? target : undefined);
      toast.success(used ? `Moved ${used} recipe(s) and deleted “${deleting.name}”` : `Deleted “${deleting.name}”`);
      setDeleting(null);
    } catch (err) {
      setTargetErr(err.message);
    }
  };

  const used = deleting ? counts.get(deleting.id) || 0 : 0;

  return (
    <div>
      <PageHeader eyebrow="Studio" title="Categories" description="Organise recipes into categories. Categories in use must have their recipes reassigned before deletion." actions={<Button icon={Plus} onClick={() => open(null)}>New category</Button>} />
      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" description="Create your first category." action={<Button icon={Plus} onClick={() => open(null)}>New category</Button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <caption className="sr-only">Categories</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Recipes</th>
                <th scope="col">Created</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-ivory/60">
                  <td className="whitespace-nowrap font-semibold">{c.name}<br /><code className="text-xs font-normal text-muted">{c.slug}</code></td>
                  <td className="max-w-sm text-muted">{c.description || '—'}</td>
                  <td>
                    <span className={`inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${counts.get(c.id) ? 'bg-forest-50 text-forest' : 'bg-ivory-200 text-muted'}`}>{counts.get(c.id) || 0}</span>
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => open(c)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-forest-50 hover:text-forest" aria-label={`Edit ${c.name}`} title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => { setDeleting(c); setTarget(''); setTargetErr(''); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger" aria-label={`Delete ${c.name}`} title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.initial ? 'Edit category' : 'New category'}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="category-form">{editing?.initial ? 'Save changes' : 'Create category'}</Button></>}
      >
        <form id="category-form" onSubmit={save} noValidate className="space-y-4">
          <TextField label="Name" required maxLength={40} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({}); }} error={errors.name} data-autofocus hint="Names must be unique (case-insensitive)." />
          <TextAreaField label="Description" rows={3} maxLength={160} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} hint={`${form.description.length}/160`} />
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={`Delete “${deleting?.name}”?`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={doDelete}>{used ? 'Reassign & delete' : 'Delete category'}</Button></>}
      >
        {used ? (
          <div className="space-y-4 text-sm">
            <p>This category is used by <strong>{used}</strong> recipe{used === 1 ? '' : 's'}. Choose where to move {used === 1 ? 'it' : 'them'} before deleting.</p>
            <SelectField label="Move recipes to" required placeholder="Select a category" value={target} onChange={(e) => { setTarget(e.target.value); setTargetErr(''); }} error={targetErr} options={categories.filter((c) => c.id !== deleting?.id).map((c) => ({ value: c.id, label: c.name }))} />
          </div>
        ) : (
          <p className="text-sm">This category isn’t used by any recipes and will be permanently deleted.</p>
        )}
      </Modal>
    </div>
  );
}
