import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, BookOpen, CheckCircle2, Hourglass, XCircle, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { useRecipes } from '../../context/RecipeContext';
import { getActivityLogs } from '../../services/activityService';
import { computeAdminStats, cuisinePopularity, registrationTrend, statusDistribution, submissionTrend, topRatedRecipes } from '../../services/analyticsService';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import RecipeImage from '../../components/common/RecipeImage';
import PageHeader from '../../components/common/PageHeader';
import usePageTitle from '../../hooks/usePageTitle';
import { timeAgo } from '../../utils/helpers';

const C = { forest: '#214E34', gold: '#C6A66B', terracotta: '#C96D4B', sage: '#7FA88C', grid: '#ECE6D9', text: '#6B7280' };
const STATUS_COLORS = { approved: C.forest, pending: C.gold, rejected: C.terracotta };
const axis = { stroke: C.text, fontSize: 12, tickLine: false, axisLine: false };
const tooltipStyle = { contentStyle: { borderRadius: 10, border: '1px solid #E8E1D2', fontSize: 13 }, cursor: { fill: 'rgba(33,78,52,0.06)' } };

export default function AdminDashboardPage() {
  usePageTitle('Studio Overview');
  const { users, allRecipes, reviews, version } = useRecipes();

  const d = useMemo(() => {
    const plain = allRecipes;
    return {
      stats: computeAdminStats({ users, recipes: plain, reviews }),
      reg: registrationTrend(users),
      subs: submissionTrend(plain),
      dist: statusDistribution(plain),
      cuisines: cuisinePopularity(plain),
      top: topRatedRecipes(plain, reviews, 6),
      logs: getActivityLogs().slice(0, 7),
      pending: plain.filter((r) => r.status === 'pending').sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)).slice(0, 5),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, allRecipes, reviews, version]);
  const s = d.stats;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Élan Kitchen Studio" title="Overview" description="Live statistics calculated from the data stored in this browser." />

      <section aria-label="Key statistics" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Registered users" value={s.totalUsers} icon={Users} to="/admin/users" />
        <StatCard label="Active users" value={s.activeUsers} icon={UserCheck} tone="green" to="/admin/users" />
        <StatCard label="Blocked users" value={s.blockedUsers} icon={UserX} tone="red" to="/admin/users" />
        <StatCard label="Total recipes" value={s.totalRecipes} icon={BookOpen} tone="gold" to="/admin/recipes" />
        <StatCard label="Approved" value={s.approved} icon={CheckCircle2} tone="green" to="/admin/recipes" />
        <StatCard label="Pending review" value={s.pending} icon={Hourglass} tone="gold" to="/admin/recipes" hint={s.pending ? 'Awaiting moderation' : 'Queue is clear'} />
        <StatCard label="Rejected" value={s.rejected} icon={XCircle} tone="terracotta" to="/admin/recipes" />
        <StatCard label="Total reviews" value={s.totalReviews} icon={MessageSquare} to="/admin/reviews" />
        <StatCard label="Average rating" value={s.totalReviews ? s.averageRating.toFixed(1) : '—'} icon={Star} tone="gold" hint={`Across ${s.ratedRecipeCount} rated recipes`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User registrations" description="New member sign-ups, last 6 months">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.reg} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.forest} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C.forest} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="month" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="users" name="New users" stroke={C.forest} strokeWidth={2} fill="url(#regFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Recipe submissions" description="Submitted vs approved, last 6 months">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.subs} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="month" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="submitted" name="Submitted" fill={C.gold} radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill={C.forest} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Approval distribution" description="Current status of all recipes" empty={s.totalRecipes ? null : 'No recipes yet'}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.dist} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
                  {d.dist.map((e) => <Cell key={e.key} fill={STATUS_COLORS[e.key]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Popular cuisines" description="Approved recipes per cuisine" empty={d.cuisines.length ? null : 'No approved recipes yet'}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.cuisines} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" allowDecimals={false} {...axis} />
                <YAxis type="category" dataKey="cuisine" width={100} {...axis} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Recipes" fill={C.sage} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Top-rated recipes" description="Average rating (minimum one review)" className="xl:col-span-2" empty={d.top.length ? null : 'No reviews yet'}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.top} layout="vertical" margin={{ top: 0, right: 24, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} {...axis} />
                <YAxis type="category" dataKey="title" width={170} {...axis} />
                <Tooltip {...tooltipStyle} formatter={(v, n, p) => [`${v} ★ (${p.payload.reviewCount} reviews)`, 'Rating']} />
                <Bar dataKey="rating" name="Rating" fill={C.forest} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="queue-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="queue-heading" className="font-sans text-base font-semibold">Moderation queue</h2>
            <Link to="/admin/recipes?status=pending" className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">Review all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
          {d.pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No recipes awaiting review. 🎉</p>
          ) : (
            <ul className="divide-y divide-ivory-200">
              {d.pending.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <RecipeImage src={r.image} alt="" width={120} className="h-12 w-12 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted">by {r.authorName} · {timeAgo(r.submittedAt)}</p>
                  </div>
                  <Link to="/admin/recipes?status=pending" className="btn btn-secondary btn-sm">Review</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5" aria-labelledby="activity-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="activity-heading" className="font-sans text-base font-semibold">Recent activity</h2>
            <Link to="/admin/activity" className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">Full log <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
          {d.logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No administrative activity yet.</p>
          ) : (
            <ol className="space-y-3">
              {d.logs.map((l) => (
                <li key={l.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <div className="min-w-0">
                    <p><span className="font-semibold">{l.action}</span> — <span className="text-charcoal/80">{l.entityName}</span></p>
                    <p className="text-xs text-muted">{l.adminName} · {timeAgo(l.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
