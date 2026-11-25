import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';
import { Stars } from '../../components/common/StarRating';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';

export default function AdminReviewsPage() {
  usePageTitle('Review Moderation');
  const { user } = useAuth();
  const { reviews, users, recipeMap } = useRecipes();
  const [q, setQ] = useState('');
  const [rating, setRating] = useState('');
  const [deleting, setDeleting] = useState(null);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reviews
      .map((r) => ({ ...r, recipe: recipeMap.get(r.recipeId), author: userMap.get(r.userId) }))
      .filter((r) => !rating || r.rating === Number(rating))
      .filter((r) => !term || `${r.comment} ${r.recipe?.title || ''} ${r.author?.name || ''} ${r.author?.email || ''}`.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [reviews, recipeMap, userMap, q, rating]);

  return (
    <div>
      <PageHeader eyebrow="Studio" title="Review moderation" description={`${reviews.length} reviews. Removing a review immediately recalculates the recipe’s rating.`} />
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="relative">
          <span className="sr-only">Search reviews</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input pl-9" placeholder="Search comment, recipe or reviewer" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="input" value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Filter by rating">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
        </select>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No reviews found" description="Try a different search or rating filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <caption className="sr-only">Reviews ({rows.length})</caption>
            <thead>
              <tr>
                <th scope="col">Recipe</th>
                <th scope="col">Reviewer</th>
                <th scope="col">Rating</th>
                <th scope="col">Comment</th>
                <th scope="col">Date</th>
                <th scope="col" className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ivory/60">
                  <td className="max-w-[200px]">{r.recipe ? <Link to={`/recipes/${r.recipe.id}`} className="font-semibold hover:text-forest">{r.recipe.title}</Link> : <span className="text-muted">Deleted recipe</span>}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={r.author?.name || '?'} src={r.author?.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="whitespace-nowrap font-medium">{r.author?.name || 'Former member'}</p>
                        <p className="truncate text-xs text-muted">{r.author?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><Stars value={r.rating} size="h-3.5 w-3.5" /></td>
                  <td className="min-w-[260px] max-w-md text-charcoal/80">{r.comment}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(r.updatedAt)}</td>
                  <td className="text-right">
                    <button type="button" onClick={() => setDeleting(r)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger" aria-label={`Delete review by ${r.author?.name || 'member'}`} title="Delete review"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          try {
            recipeService.deleteReview(user, deleting.id);
            toast.success('Review removed and rating recalculated');
          } catch (e) {
            toast.error(e.message);
          }
          setDeleting(null);
        }}
        title="Remove this review?"
        message={<>The {deleting?.rating}★ review by <strong>{deleting?.author?.name || 'this member'}</strong> on “{deleting?.recipe?.title}” will be deleted and logged in the activity log.</>}
        confirmLabel="Remove review"
      />
    </div>
  );
}
