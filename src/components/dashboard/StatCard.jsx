import { Link } from 'react-router-dom';

export default function StatCard({ label, value, icon: Icon, tone = 'forest', to, hint }) {
  const tones = {
    forest: 'bg-forest-50 text-forest',
    gold: 'bg-gold-light/50 text-gold-dark',
    terracotta: 'bg-terracotta-light text-terracotta-dark',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && (
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-charcoal">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  if (to) return <Link to={to} className="card block p-5 transition-shadow hover:shadow-lift">{body}</Link>;
  return <div className="card p-5">{body}</div>;
}
