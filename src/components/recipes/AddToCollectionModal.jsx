import { useState } from 'react';
import { Check, FolderPlus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { TextField } from '../forms/FormField';
import RecipeImage from '../common/RecipeImage';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';

export default function AddToCollectionModal({ open, onClose, recipe }) {
  const { user } = useAuth();
  const { collections } = useRecipes();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const toggle = (c) => {
    try {
      if (c.recipeIds.includes(recipe.id)) {
        recipeService.removeRecipeFromCollection(user, c.id, recipe.id);
        toast.success(`Removed from “${c.name}”`);
      } else {
        recipeService.addRecipeToCollection(user, c.id, recipe.id);
        toast.success(`Added to “${c.name}”`);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const create = (e) => {
    e.preventDefault();
    try {
      const c = recipeService.createCollection(user, { name, coverImage: recipe.image });
      recipeService.addRecipeToCollection(user, c.id, recipe.id);
      toast.success(`Created “${c.name}” and added this recipe`);
      setName('');
      setError('');
    } catch (err) {
      setError(err.errors?.name || err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add to collection" description={recipe?.title} footer={<Button onClick={onClose}>Done</Button>}>
      {collections.length === 0 ? (
        <p className="mb-4 text-sm text-muted">You have no collections yet — create your first one below.</p>
      ) : (
        <ul className="mb-5 max-h-72 space-y-2 overflow-y-auto">
          {collections.map((c) => {
            const inIt = c.recipeIds.includes(recipe.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c)}
                  aria-pressed={inIt}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${inIt ? 'border-forest bg-forest-50' : 'border-ivory-300 hover:border-forest/40'}`}
                >
                  <RecipeImage src={c.coverImage} alt="" width={120} className="h-12 w-12 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="text-xs text-muted">{c.recipeIds.length} recipe{c.recipeIds.length === 1 ? '' : 's'}</span>
                  </span>
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${inIt ? 'bg-forest text-white' : 'border border-ivory-300 text-muted'}`}>
                    {inIt ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={create} className="flex items-start gap-2" noValidate>
        <TextField className="flex-1" label="New collection" placeholder="e.g. Sunday Brunch" value={name} onChange={(e) => setName(e.target.value)} error={error} maxLength={50} />
        <Button type="submit" variant="secondary" icon={FolderPlus} className="mt-[30px]">Create</Button>
      </form>
    </Modal>
  );
}
