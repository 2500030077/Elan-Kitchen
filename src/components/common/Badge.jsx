const TONES = {
  neutral: 'bg-ivory-200 text-charcoal border-ivory-300',
  green: 'bg-forest-50 text-forest border-forest-100',
  gold: 'bg-gold-light/50 text-gold-dark border-gold-light',
  terracotta: 'bg-terracotta-light text-terracotta-dark border-terracotta-light',
  red: 'bg-red-50 text-red-700 border-red-100',
  success: 'bg-green-50 text-green-800 border-green-100',
};

export default function Badge({ tone = 'neutral', children, className = '', icon: Icon }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

const STATUS = {
  approved: { tone: 'success', label: 'Approved' },
  pending: { tone: 'gold', label: 'Pending review' },
  rejected: { tone: 'red', label: 'Rejected' },
  active: { tone: 'success', label: 'Active' },
  blocked: { tone: 'red', label: 'Blocked' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { tone: 'neutral', label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
