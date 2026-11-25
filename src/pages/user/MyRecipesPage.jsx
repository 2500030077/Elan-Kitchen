import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, Eye, BookOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RecipeImage from '../../components/common/RecipeImage';
import { StatusBadge } from '../../components/common/Badge';
import { RatingSummary } from '../../components/common/StarRating';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

export default function MyRecipesPage() {
  usePageTitle('My Recipes');
  const { user } = useAuth();
  const { allRecipes } = useRecipes();
  const [tab, setTab] = useState('all');
  const [toDelete, setToDelete] = useState(null);

  const mine = useMemo(
    () => allRecipes.filter((r) => r.authorId === user.id).sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)),
    [allRecipes, user.id],
  );
  const list = tab === 'all' ? mine : mine.filter((r) => r.status === tab);
  const count = (k) => (k === 'all' ? mine.length : mine.filter((r) => r.status === k).length);

  return (
    <div>
      <PageHeader eyebrow="Your kitchen" title="My recipes" description="Track the moderation status of everything you’ve submitted." actions={<Button icon={PlusCircle} to="/user/recipes/new">Submit recipe</Button>} />
      {mine.length === 0 ? (
        <EmptyState icon={BookOpen} title="You haven’t submitted any recipes yet" description="Share a dish you love. Once approved by our editors it will be published to the community." action={<Button icon={PlusCircle} to="/user/recipes/new">Submit your first recipe</Button>} />
      ) : (
        <>
          <div role="tablist" aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`chip min-h-[38px] ${tab === t.key ? 'chip-active' : 'hover:border-forest/40'}`}>
                {t.label} <span className={`ml-1 rounded-full px-1.5 text-xs ${tab === t.key ? 'bg-white/20' : 'bg-ivory-200'}`}>{count(t.key)}</span>
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="rounded-card border border-dashed border-ivory-300 p-10 text-center text-sm text-muted">No {tab} recipes.</p>
          ) : (
            <ul className="space-y-4">
              {list.map((r) => (
                <li key={r.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <RecipeImage src={r.image} alt={r.title} width={300} className="aspect-[4/3] w-full shrink-0 rounded-lg sm:w-36" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-muted">Submitted {formatDate(r.submittedAt || r.createdAt)}</span>
                    </div>
                    <h2 className="mt-1.5 truncate text-xl font-semibold">{r.title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span>{r.cuisine} · {r.categoryName}</span>
                      {r.status === 'approved' && <RatingSummary rating={r.rating} count={r.reviewCount} />}
                      {r.status === 'approved' && <span>{r.views} views · {r.favoriteCount} saves</span>}
                    </div>
                    {r.status === 'rejected' && r.rejectionReason && (
                      <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span><strong>Moderator feedback:</strong> {r.rejectionReason}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <Link to={`/recipes/${r.id}`} className="btn btn-secondary btn-sm flex-1"><Eye className="h-4 w-4" aria-hidden="true" /> View</Link>
                    <Link to={`/user/recipes/${r.id}/edit`} className="btn btn-secondary btn-sm flex-1"><Pencil className="h-4 w-4" aria-hidden="true" /> Edit</Link>
                    <button type="button" className="btn btn-secondary btn-sm flex-1 text-danger" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          try {
            recipeService.deleteRecipe(user, toDelete.id);
            toast.success(`Deleted “${toDelete.title}”`);
          } catch (e) {
            toast.error(e.message);
          }
          setToDelete(null);
        }}
        title="Delete this recipe?"
        message={<>“<strong>{toDelete?.title}</strong>” will be permanently deleted, along with its reviews and any saves, collection entries and meal-plan slots that reference it. This cannot be undone.</>}
        confirmLabel="Delete recipe"
      />
    </div>
  );
}
