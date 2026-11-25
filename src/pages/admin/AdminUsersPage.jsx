import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Ban, CircleCheck, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import userService from '../../services/userService';
import storage from '../../services/storageService';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge, { StatusBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import usePageTitle from '../../hooks/usePageTitle';
import { STORAGE_KEYS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export default function AdminUsersPage() {
  usePageTitle('User Management');
  const { user: admin } = useAuth();
  const { users, allRecipes, reviews, favorites } = useRecipes();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, user }

  const recipeCount = useMemo(() => {
    const m = new Map();
    allRecipes.forEach((r) => m.set(r.authorId, (m.get(r.authorId) || 0) + 1));
    return m;
  }, [allRecipes]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => (!status || u.status === status) && (!role || u.role === role))
      .filter((u) => !term || `${u.name} ${u.email} ${u.id}`.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [users, q, status, role]);

  const act = () => {
    const { type, user: u } = confirm;
    try {
      if (type === 'block') {
        userService.blockUser(admin, u.id);
        toast.success(`${u.name} has been blocked and signed out`);
      } else if (type === 'unblock') {
        userService.unblockUser(admin, u.id);
        toast.success(`${u.name} can sign in again`);
      } else if (type === 'delete') {
        userService.deleteUser(admin, u.id);
        toast.success(`${u.name}’s account was deleted`);
        setViewing(null);
      }
    } catch (e) {
      toast.error(e.message);
    }
    setConfirm(null);
  };

  const details = viewing && {
    recipes: allRecipes.filter((r) => r.authorId === viewing.id),
    reviews: reviews.filter((r) => r.userId === viewing.id).length,
    favorites: favorites.filter((f) => f.userId === viewing.id).length,
    collections: storage.filterBy(STORAGE_KEYS.COLLECTIONS, (c) => c.userId === viewing.id).length,
  };

  const canModerate = (u) => u.id !== admin.id && u.role !== 'admin';

  return (
    <div>
      <PageHeader eyebrow="Studio" title="User management" description={`${users.length} accounts · ${users.filter((u) => u.status === 'blocked').length} blocked`} />
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_170px_170px]">
        <label className="relative">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input pl-9" placeholder="Search by name, email or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="user">Members</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <caption className="sr-only">Users ({list.length})</caption>
            <thead>
              <tr>
                <th scope="col">User ID</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Registered</th>
                <th scope="col">Status</th>
                <th scope="col">Recipes</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-ivory/60">
                  <td><code className="text-xs text-muted" title={u.id}>{u.id.slice(0, 8)}</code></td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatar} size="sm" />
                      <span className="whitespace-nowrap font-semibold">{u.name}{u.id === admin.id && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}</span>
                    </div>
                  </td>
                  <td className="text-muted">{u.email}</td>
                  <td>{u.role === 'admin' ? <Badge tone="gold">Admin</Badge> : <Badge>Member</Badge>}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td className="text-center">{recipeCount.get(u.id) || 0}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setViewing(u)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-forest-50 hover:text-forest" aria-label={`View ${u.name}`} title="View details"><Eye className="h-4 w-4" /></button>
                      {canModerate(u) && (u.status === 'blocked' ? (
                        <button type="button" onClick={() => setConfirm({ type: 'unblock', user: u })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-success hover:bg-green-50" aria-label={`Unblock ${u.name}`} title="Unblock"><CircleCheck className="h-4 w-4" /></button>
                      ) : (
                        <button type="button" onClick={() => setConfirm({ type: 'block', user: u })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-terracotta-dark hover:bg-terracotta-light" aria-label={`Block ${u.name}`} title="Block"><Ban className="h-4 w-4" /></button>
                      ))}
                      {canModerate(u) && (
                        <button type="button" onClick={() => setConfirm({ type: 'delete', user: u })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger" aria-label={`Delete ${u.name}`} title="Delete"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="User details" size="lg"
        footer={viewing && canModerate(viewing) ? (
          <>
            {viewing.status === 'blocked'
              ? <Button variant="secondary" icon={CircleCheck} onClick={() => setConfirm({ type: 'unblock', user: viewing })}>Unblock</Button>
              : <Button variant="secondary" icon={Ban} onClick={() => setConfirm({ type: 'block', user: viewing })}>Block</Button>}
            <Button variant="danger" icon={Trash2} onClick={() => setConfirm({ type: 'delete', user: viewing })}>Delete account</Button>
          </>
        ) : <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>}
      >
        {viewing && (
          <div>
            <div className="flex items-center gap-4">
              <Avatar name={viewing.name} src={viewing.avatar} size="lg" />
              <div className="min-w-0">
                <p className="text-xl font-semibold">{viewing.name}</p>
                <p className="truncate text-sm text-muted">{viewing.email}</p>
                <div className="mt-1.5 flex gap-2"><StatusBadge status={viewing.status} />{viewing.role === 'admin' ? <Badge tone="gold">Admin</Badge> : <Badge>Member</Badge>}</div>
              </div>
            </div>
            {viewing.bio && <p className="mt-4 text-sm italic text-charcoal/80">“{viewing.bio}”</p>}
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Recipes', details.recipes.length], ['Reviews', details.reviews], ['Favorites', details.favorites], ['Collections', details.collections]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-ivory p-3 text-center">
                  <dd className="font-display text-2xl font-semibold">{v}</dd>
                  <dt className="text-xs text-muted">{l}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">ID <code>{viewing.id}</code> · Registered {formatDate(viewing.createdAt)} · Last updated {formatDate(viewing.updatedAt)}</p>
            {details.recipes.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 font-sans text-sm font-semibold">Submitted recipes</h3>
                <ul className="divide-y divide-ivory-200 rounded-lg border border-ivory-200">
                  {details.recipes.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <Link to={`/recipes/${r.id}`} className="truncate font-medium hover:text-forest">{r.title}</Link>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        tone={confirm?.type === 'unblock' ? 'primary' : 'danger'}
        title={confirm?.type === 'delete' ? 'Delete this account?' : confirm?.type === 'block' ? 'Block this user?' : 'Unblock this user?'}
        confirmLabel={confirm?.type === 'delete' ? 'Delete account' : confirm?.type === 'block' ? 'Block user' : 'Unblock user'}
        message={
          confirm?.type === 'delete' ? (
            <><strong>{confirm.user.name}</strong>’s account, favorites, collections, reviews, meal plans and shopping lists will be permanently deleted. Their pending and rejected recipes are deleted; approved recipes stay published and are credited to “Élan Community”. This cannot be undone.</>
          ) : confirm?.type === 'block' ? (
            <><strong>{confirm.user.name}</strong> will be signed out immediately and won’t be able to log in until unblocked. Their content remains visible.</>
          ) : (
            <><strong>{confirm?.user.name}</strong> will be able to sign in again.</>
          )
        }
      />
    </div>
  );
}
