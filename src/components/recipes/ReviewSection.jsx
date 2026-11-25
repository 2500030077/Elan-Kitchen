import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import { Stars, StarInput } from '../common/StarRating';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import { TextAreaField } from '../forms/FormField';
import { timeAgo } from '../../utils/helpers';

function Distribution({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));
  return (
    <ul className="space-y-1.5" aria-label="Rating distribution">
      {counts.map(({ s, n }) => (
        <li key={s} className="flex items-center gap-2 text-xs text-muted">
          <span className="w-8">{s} ★</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-ivory-200">
            <span className="block h-full rounded-full bg-gold" style={{ width: reviews.length ? `${(n / reviews.length) * 100}%` : 0 }} />
          </span>
          <span className="w-6 text-right">{n}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReviewSection({ recipe }) {
  const { user, isAdmin } = useAuth();
  const { reviews: allReviews, users } = useRecipes();
  const location = useLocation();
  const reviews = useMemo(
    () => allReviews.filter((r) => r.recipeId === recipe.id).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [allReviews, recipe.id],
  );
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const mine = user ? reviews.find((r) => r.userId === user.id) : null;
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);

  const startEdit = () => {
    setRating(mine?.rating || 0);
    setComment(mine?.comment || '');
    setErrors({});
    setEditing(true);
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!rating) errs.rating = 'Select a star rating.';
    if (comment.trim().length < 10) errs.comment = 'Write at least 10 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      recipeService.upsertReview(user, recipe.id, { rating, comment });
      toast.success(mine ? 'Your review was updated' : 'Thanks for your review!');
      setEditing(false);
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    }
  };

  const confirmDelete = () => {
    try {
      recipeService.deleteReview(user, toDelete.id);
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.message);
    }
    setToDelete(null);
    setEditing(false);
  };

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const isOwn = user && recipe.authorId === user.id;
  const canReview = user && !isAdmin && !isOwn && recipe.status === 'approved';

  return (
    <section aria-labelledby="reviews-heading" className="no-print">
      <h2 id="reviews-heading" className="text-2xl font-semibold sm:text-3xl">Ratings &amp; reviews</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="card h-fit p-5">
          <p className="font-display text-5xl font-semibold">{reviews.length ? avg.toFixed(1) : '—'}</p>
          <Stars value={avg} className="mt-2" />
          <p className="mt-1 text-sm text-muted">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
          <div className="mt-4"><Distribution reviews={reviews} /></div>
        </div>
        <div>
          {!user && (
            <div className="mb-6 rounded-card border border-ivory-300 bg-white p-5 text-sm">
              <Link to="/login" state={{ from: location }} className="font-semibold text-forest underline-offset-2 hover:underline">Sign in</Link> to rate and review this recipe.
            </div>
          )}
          {isOwn && <p className="mb-6 rounded-card border border-ivory-300 bg-white p-4 text-sm text-muted">This is your recipe — reviews come from other members.</p>}
          {canReview && !editing && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-ivory-300 bg-white p-5">
              <p className="text-sm">{mine ? 'You reviewed this recipe.' : 'Cooked this? Share how it went.'}</p>
              <Button variant={mine ? 'secondary' : 'primary'} icon={mine ? Pencil : MessageSquare} onClick={startEdit}>
                {mine ? 'Edit your review' : 'Write a review'}
              </Button>
            </div>
          )}
          {canReview && editing && (
            <form onSubmit={submit} className="card mb-6 space-y-4 p-5" noValidate>
              <div>
                <p id="rating-label" className="label">Your rating</p>
                <StarInput value={rating} onChange={setRating} error={errors.rating} />
              </div>
              <TextAreaField label="Your review" value={comment} onChange={(e) => setComment(e.target.value)} error={errors.comment} maxLength={1000} hint={`${comment.length}/1000 characters`} placeholder="What did you love? Any tweaks?" />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{mine ? 'Update review' : 'Post review'}</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                {mine && <Button variant="ghost" className="ml-auto text-danger" icon={Trash2} onClick={() => setToDelete(mine)}>Delete</Button>}
              </div>
            </form>
          )}
          {reviews.length === 0 ? (
            <p className="rounded-card border border-dashed border-ivory-300 p-8 text-center text-sm text-muted">No reviews yet. Be the first to share your experience.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => {
                const author = userMap.get(r.userId);
                return (
                  <li key={r.id} className="card p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={author?.name || 'Member'} src={author?.avatar} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">{author?.name || 'Former member'}{r.userId === user?.id && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}</p>
                          <span className="text-xs text-muted">{timeAgo(r.updatedAt)}{r.updatedAt !== r.createdAt ? ' · edited' : ''}</span>
                        </div>
                        <Stars value={r.rating} size="h-3.5 w-3.5" className="mt-1" />
                        <p className="mt-2 text-[15px] leading-relaxed text-charcoal/90">{r.comment}</p>
                        {r.userId === user?.id && !editing && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="ghost" icon={Pencil} onClick={startEdit}>Edit</Button>
                            <Button size="sm" variant="ghost" icon={Trash2} className="text-danger" onClick={() => setToDelete(r)}>Delete</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} title="Delete your review?" message="Your rating and comment will be removed and the recipe’s average rating will update." confirmLabel="Delete review" />
    </section>
  );
}
