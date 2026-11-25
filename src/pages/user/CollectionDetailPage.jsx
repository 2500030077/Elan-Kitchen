import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderX, Pencil, Plus, Trash2, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import RecipePickerModal from '../../components/recipes/RecipePickerModal';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RecipeImage from '../../components/common/RecipeImage';
import CollectionFormModal from './CollectionFormModal';
import usePageTitle from '../../hooks/usePageTitle';

export default function CollectionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { collections, getRecipe } = useRecipes();
  const navigate = useNavigate();
  const collection = collections.find((c) => c.id === id);
  usePageTitle(collection ? collection.name : 'Collection not found');
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!collection) {
    return (
      <EmptyState icon={FolderX} title="Collection not found" description="It may have been deleted, or it belongs to another member." action={<Button to="/user/collections">Back to collections</Button>} />
    );
  }

  const recipes = collection.recipeIds.map(getRecipe).filter((r) => r && r.status === 'approved');

  const remove = (r) => {
    recipeService.removeRecipeFromCollection(user, collection.id, r.id);
    toast.success(`Removed “${r.title}”`);
  };

  return (
    <div>
      <Link to="/user/collections" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All collections
      </Link>
      <header className="mb-8 overflow-hidden rounded-card border border-ivory-300 bg-white sm:flex">
        <RecipeImage src={collection.coverImage || recipes[0]?.image} alt="" width={700} className="aspect-[16/9] sm:aspect-auto sm:w-72" />
        <div className="flex flex-1 flex-col justify-between gap-4 p-6">
          <div>
            <p className="eyebrow">Collection · {recipes.length} recipe{recipes.length === 1 ? '' : 's'}</p>
            <h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1>
            {collection.description && <p className="mt-2 text-muted">{collection.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={Plus} onClick={() => setPicker(true)}>Add recipes</Button>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" icon={Trash2} className="text-danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
          </div>
        </div>
      </header>
      {recipes.length === 0 ? (
        <EmptyState icon={BookOpen} title="This collection is empty" description="Add recipes from your favorites or the full catalogue." action={<Button icon={Plus} onClick={() => setPicker(true)}>Add recipes</Button>} />
      ) : (
        <RecipeGrid
          recipes={recipes}
          columns="sm:grid-cols-2 xl:grid-cols-3"
          renderFooter={(r) => (
            <button type="button" onClick={() => remove(r)} className="btn btn-secondary btn-sm w-full text-danger" aria-label={`Remove ${r.title} from collection`}>
              <X className="h-4 w-4" aria-hidden="true" /> Remove from collection
            </button>
          )}
        />
      )}
      <RecipePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        title={`Add to “${collection.name}”`}
        description="Choose recipes to add. Already-added recipes are skipped."
        onSelect={(r) => {
          try {
            recipeService.addRecipeToCollection(user, collection.id, r.id);
            toast.success(`Added “${r.title}”`);
          } catch (e) {
            toast.error(e.message);
          }
        }}
      />
      <CollectionFormModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={collection}
        recipeImages={recipes.map((r) => r.image)}
        onSave={(form) => {
          recipeService.updateCollection(user, collection.id, form);
          toast.success('Collection updated');
          setEditing(false);
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          recipeService.deleteCollection(user, collection.id);
          toast.success('Collection deleted');
          navigate('/user/collections', { replace: true });
        }}
        title="Delete this collection?"
        message="The collection will be removed. Recipes remain available in Élan Kitchen."
        confirmLabel="Delete collection"
      />
    </div>
  );
}
