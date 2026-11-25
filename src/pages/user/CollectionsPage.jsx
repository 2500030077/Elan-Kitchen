import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, FolderHeart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RecipeImage from '../../components/common/RecipeImage';
import CollectionFormModal from './CollectionFormModal';
import usePageTitle from '../../hooks/usePageTitle';
import { timeAgo } from '../../utils/helpers';

export default function CollectionsPage() {
  usePageTitle('Collections');
  const { user } = useAuth();
  const { collections, getRecipe, approvedRecipes, favoriteIds } = useRecipes();
  const [modal, setModal] = useState(null); // { initial }
  const [toDelete, setToDelete] = useState(null);
  const [menu, setMenu] = useState(null);

  const favImages = approvedRecipes.filter((r) => favoriteIds.has(r.id)).map((r) => r.image);

  const save = (form) => {
    if (modal.initial) {
      recipeService.updateCollection(user, modal.initial.id, form);
      toast.success('Collection updated');
    } else {
      recipeService.createCollection(user, form);
      toast.success(`Created “${form.name.trim()}”`);
    }
    setModal(null);
  };

  return (
    <div>
      <PageHeader eyebrow="Your kitchen" title="Collections" description="Group recipes into themed menus — weeknights, festivals, meal prep and more." actions={<Button icon={FolderPlus} onClick={() => setModal({ initial: null })}>New collection</Button>} />
      {collections.length === 0 ? (
        <EmptyState icon={FolderHeart} title="Start your first collection" description="Collections help you organise recipes for occasions like “Quick Breakfasts” or “Family Favorites”." action={<Button icon={FolderPlus} onClick={() => setModal({ initial: null })}>Create a collection</Button>} />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((c) => {
            const covers = c.recipeIds.map(getRecipe).filter(Boolean).slice(0, 3);
            return (
              <li key={c.id} className="group relative overflow-hidden rounded-card border border-ivory-300 bg-white shadow-soft transition-shadow hover:shadow-lift">
                <div className="grid aspect-[16/10] grid-cols-3 grid-rows-2 gap-0.5">
                  <RecipeImage src={c.coverImage || covers[0]?.image} alt="" width={600} className="col-span-2 row-span-2" />
                  <RecipeImage src={covers[1]?.image || c.coverImage} alt="" width={240} />
                  <RecipeImage src={covers[2]?.image || covers[0]?.image || c.coverImage} alt="" width={240} />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold">
                    <Link to={`/user/collections/${c.id}`} className="after:absolute after:inset-0 after:content-['']">{c.name}</Link>
                  </h2>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>}
                  <p className="mt-3 text-xs text-muted">{c.recipeIds.length} recipe{c.recipeIds.length === 1 ? '' : 's'} · updated {timeAgo(c.updatedAt)}</p>
                </div>
                <div className="absolute right-3 top-3 z-10">
                  <button type="button" onClick={() => setMenu(menu === c.id ? null : c.id)} aria-haspopup="menu" aria-expanded={menu === c.id} aria-label={`Options for ${c.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menu === c.id && (
                    <div role="menu" className="absolute right-0 mt-1 w-40 overflow-hidden rounded-lg border border-ivory-300 bg-white py-1 shadow-lift">
                      <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-forest-50" onClick={() => { setMenu(null); setModal({ initial: c }); }}>
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit / rename
                      </button>
                      <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-red-50" onClick={() => { setMenu(null); setToDelete(c); }}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <CollectionFormModal
        open={!!modal}
        onClose={() => setModal(null)}
        initial={modal?.initial}
        onSave={save}
        recipeImages={modal?.initial ? modal.initial.recipeIds.map(getRecipe).filter(Boolean).map((r) => r.image) : favImages}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          recipeService.deleteCollection(user, toDelete.id);
          toast.success(`Deleted “${toDelete.name}”`);
          setToDelete(null);
        }}
        title="Delete collection?"
        message={<>“<strong>{toDelete?.name}</strong>” will be deleted. The recipes themselves stay in Élan Kitchen and in your favorites.</>}
        confirmLabel="Delete collection"
      />
    </div>
  );
}
