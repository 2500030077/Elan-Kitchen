import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Check, X, Pencil, Trash2, Eye, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import PageHeader from '../../components/common/PageHeader';
import RecipeImage from '../../components/common/RecipeImage';
import { StatusBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { TextAreaField } from '../../components/forms/FormField';
import usePageTitle from '../../hooks/usePageTitle';
import { CUISINES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];

export default function AdminRecipesPage() {
  usePageTitle('Recipe Management');
  const { user } = useAuth();
  const { allRecipes, categories } = useRecipes();
  const [sp, setSp] = useSearchParams();
  const status = STATUSES.includes(sp.get('status')) ? sp.get('status') : 'all';
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [deleting, setDeleting] = useState(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allRecipes
      .filter((r) => (status === 'all' || r.status === status) && (!cuisine || r.cuisine === cuisine) && (!category || r.categoryId === category))
      .filter((r) => !term || `${r.title} ${r.authorName}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const order = { pending: 0, rejected: 1, approved: 2 };
        return order[a.status] - order[b.status] || new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
      });
  }, [allRecipes, status, cuisine, category, q]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, s === 'all' ? allRecipes.length : allRecipes.filter((r) => r.status === s).length])), [allRecipes]);

  const approve = (r) => {
    try {
      recipeService.approveRecipe(user, r.id);
      toast.success(`Approved “${r.title}” — now live`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const confirmReject = () => {
    try {
      recipeService.rejectRecipe(user, rejecting.id, reason);
      toast.success(`Rejected “${rejecting.title}”`);
      setRejecting(null);
    } catch (e) {
      setReasonErr(e.errors?.reason || e.message);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Studio" title="Recipe management" description="Moderate submissions, edit content and keep the catalogue tidy. Only approved recipes appear publicly." />

      <div role="tablist" aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => setSp(s === 'all' ? {} : { status: s })}
            className={`chip min-h-[38px] capitalize ${status === s ? 'chip-active' : 'hover:border-forest/40'}`}
          >
            {s} <span className={`ml-1 rounded-full px-1.5 text-xs ${status === s ? 'bg-white/20' : 'bg-ivory-200'}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_200px]">
        <label className="relative">
          <span className="sr-only">Search recipes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input pl-9" placeholder="Search by title or author" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="input" value={cuisine} onChange={(e) => setCuisine(e.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {CUISINES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ChefHat} title="No recipes found" description="Try a different status, search term or filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <caption className="sr-only">Recipes ({list.length})</caption>
            <thead>
              <tr>
                <th scope="col">Recipe</th>
                <th scope="col">Author</th>
                <th scope="col">Cuisine / Category</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">Rating</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-ivory/60">
                  <td>
                    <div className="flex items-center gap-3">
                      <RecipeImage src={r.image} alt="" width={120} className="h-11 w-11 shrink-0 rounded-md" />
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-semibold">{r.title}</p>
                        {r.status === 'rejected' && <p className="max-w-[220px] truncate text-xs text-red-700" title={r.rejectionReason}>{r.rejectionReason}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{r.authorName}</td>
                  <td className="whitespace-nowrap text-muted">{r.cuisine}<br /><span className="text-xs">{r.categoryName}</span></td>
                  <td className="whitespace-nowrap text-muted">{formatDate(r.submittedAt || r.createdAt)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="whitespace-nowrap">{r.reviewCount ? `${r.rating.toFixed(1)} ★ (${r.reviewCount})` : '—'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link to={`/recipes/${r.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-forest-50 hover:text-forest" aria-label={`View ${r.title}`} title="View"><Eye className="h-4 w-4" /></Link>
                      {r.status !== 'approved' && (
                        <button type="button" onClick={() => approve(r)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-success hover:bg-green-50" aria-label={`Approve ${r.title}`} title="Approve"><Check className="h-4 w-4" /></button>
                      )}
                      {r.status !== 'rejected' && (
                        <button type="button" onClick={() => { setRejecting(r); setReason(''); setReasonErr(''); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-terracotta-dark hover:bg-terracotta-light" aria-label={`Reject ${r.title}`} title="Reject"><X className="h-4 w-4" /></button>
                      )}
                      <Link to={`/admin/recipes/${r.id}/edit`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-forest-50 hover:text-forest" aria-label={`Edit ${r.title}`} title="Edit"><Pencil className="h-4 w-4" /></Link>
                      <button type="button" onClick={() => setDeleting(r)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger" aria-label={`Delete ${r.title}`} title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject recipe"
        description={rejecting?.title}
        footer={<><Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" onClick={confirmReject}>Reject recipe</Button></>}
      >
        <TextAreaField
          label="Reason for rejection"
          required
          rows={4}
          maxLength={500}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setReasonErr(''); }}
          error={reasonErr}
          hint="The author sees this message in My Recipes. Be specific and constructive (min. 10 characters)."
          data-autofocus
        />
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          try {
            recipeService.deleteRecipe(user, deleting.id);
            toast.success(`Deleted “${deleting.title}”`);
          } catch (e) {
            toast.error(e.message);
          }
          setDeleting(null);
        }}
        title="Delete recipe permanently?"
        message={<>“<strong>{deleting?.title}</strong>” and its reviews will be deleted, and it will be removed from members’ favorites, collections and meal plans. This cannot be undone.</>}
        confirmLabel="Delete recipe"
      />
    </div>
  );
}
