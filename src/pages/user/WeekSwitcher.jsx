import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatDate, parseDateKey } from '../../utils/helpers';

export default function WeekSwitcher({ week, prev, next, today, isCurrent }) {
  const start = parseDateKey(week);
  const end = parseDateKey(addDays(week, 6));
  const label = `${formatDate(start.toISOString(), { day: 'numeric', month: 'short' })} – ${formatDate(end.toISOString(), { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-ivory-300 bg-white">
        <button type="button" onClick={prev} className="inline-flex h-10 w-10 items-center justify-center rounded-l-lg hover:bg-forest-50" aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-[190px] px-2 text-center text-sm font-semibold" aria-live="polite">{label}</span>
        <button type="button" onClick={next} className="inline-flex h-10 w-10 items-center justify-center rounded-r-lg hover:bg-forest-50" aria-label="Next week"><ChevronRight className="h-4 w-4" /></button>
      </div>
      {!isCurrent && <button type="button" onClick={today} className="btn btn-ghost btn-sm">This week</button>}
    </div>
  );
}
