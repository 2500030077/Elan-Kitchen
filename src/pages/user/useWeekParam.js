import { useSearchParams } from 'react-router-dom';
import { addDays, getWeekStart, parseDateKey } from '../../utils/helpers';

/** Week selection stored in ?week=YYYY-MM-DD (always normalised to Monday). */
export default function useWeekParam() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('week');
  const valid = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(parseDateKey(raw).getTime());
  const week = valid ? getWeekStart(parseDateKey(raw)) : getWeekStart();
  const setWeek = (w) => {
    const next = new URLSearchParams(sp);
    if (w === getWeekStart()) next.delete('week');
    else next.set('week', w);
    setSp(next);
  };
  return { week, setWeek, prev: () => setWeek(addDays(week, -7)), next: () => setWeek(addDays(week, 7)), today: () => setWeek(getWeekStart()), isCurrent: week === getWeekStart() };
}
