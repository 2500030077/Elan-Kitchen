import { useEffect, useMemo, useState } from 'react';
import { Search, History } from 'lucide-react';
import { getActivityLogs } from '../../services/activityService';
import storage from '../../services/storageService';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import usePageTitle from '../../hooks/usePageTitle';
import { ACTIVITY_ACTIONS, STORAGE_KEYS } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';

const toneFor = (action) => {
  if (/approved|unblocked|created/i.test(action)) return 'success';
  if (/rejected|blocked/i.test(action)) return 'terracotta';
  if (/deleted|removed/i.test(action)) return 'red';
  return 'neutral';
};

export default function AdminActivityPage() {
  usePageTitle('Activity Log');
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  useEffect(() => storage.subscribe((e) => e.key === STORAGE_KEYS.ACTIVITY_LOGS && setTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const logs = useMemo(() => getActivityLogs(), [tick]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return logs.filter((l) => (!action || l.action === action) && (!term || `${l.entityName} ${l.adminName} ${l.details}`.toLowerCase().includes(term)));
  }, [logs, q, action]);

  return (
    <div>
      <PageHeader eyebrow="Studio" title="Activity log" description="A record of moderation and administrative actions, newest first." />
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <span className="sr-only">Search activity</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input pl-9" placeholder="Search entity, administrator or details" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="input" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
          <option value="">All actions</option>
          {Object.values(ACTIVITY_ACTIONS).map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={History} title="No activity recorded" description="Approvals, rejections, user and category changes will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <caption className="sr-only">Activity log ({rows.length})</caption>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Affected entity</th>
                <th scope="col">Details</th>
                <th scope="col">Administrator</th>
                <th scope="col">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-ivory/60">
                  <td className="whitespace-nowrap"><Badge tone={toneFor(l.action)}>{l.action}</Badge></td>
                  <td><span className="text-xs uppercase tracking-wide text-muted">{l.entityType}</span><br /><span className="font-medium">{l.entityName}</span></td>
                  <td className="max-w-sm text-muted">{l.details || '—'}</td>
                  <td className="whitespace-nowrap">{l.adminName}</td>
                  <td className="whitespace-nowrap text-muted"><time dateTime={l.createdAt}>{formatDateTime(l.createdAt)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
