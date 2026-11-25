import { FALLBACK_IMAGE } from './constants';

export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers: RFC4122-ish v4 using getRandomValues.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const nowISO = () => new Date().toISOString();

export const normalizeEmail = (email = '') => email.trim().toLowerCase();

export const slugify = (text = '') =>
  text
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', opts);
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (iso) => {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return '';
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(iso);
};

export const formatMinutes = (mins) => {
  const n = Number(mins) || 0;
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

export const totalTime = (recipe) => (Number(recipe?.prepTime) || 0) + (Number(recipe?.cookTime) || 0);

/** Format a numeric quantity nicely (e.g. 0.5 -> ½, 1.333 -> 1⅓). */
export const formatQuantity = (qty) => {
  if (qty === null || qty === undefined || qty === '' || Number.isNaN(Number(qty))) return '';
  const n = Number(qty);
  const whole = Math.floor(n);
  const frac = n - whole;
  const fractions = [
    [0.125, '⅛'],
    [0.25, '¼'],
    [0.333, '⅓'],
    [0.5, '½'],
    [0.667, '⅔'],
    [0.75, '¾'],
  ];
  if (frac < 0.06) return String(whole);
  if (frac > 0.94) return String(whole + 1);
  for (const [v, sym] of fractions) {
    if (Math.abs(frac - v) < 0.05) return whole ? `${whole}${sym}` : sym;
  }
  return String(Math.round(n * 100) / 100);
};

const COUNT_UNITS = new Set(['piece', 'clove', 'slice', 'can', 'bunch']);

export const scaleQuantity = (qty, baseServings, targetServings, unit = '') => {
  if (qty === null || qty === undefined || qty === '') return null;
  const n = Number(qty);
  if (Number.isNaN(n)) return null;
  const base = Number(baseServings) || 1;
  const scaled = (n * Number(targetServings)) / base;
  // Countable items: whole numbers when 3+, otherwise nearest half.
  if (COUNT_UNITS.has(unit)) return scaled >= 3 ? Math.round(scaled) : Math.max(0.5, Math.round(scaled * 2) / 2);
  return scaled;
};

/** Human unit label: hides "piece", pluralises countable units. */
export const unitLabel = (unit, qty) => {
  if (!unit || unit === 'piece') return '';
  const plural = Number(qty) > 1 && ['clove', 'slice', 'can', 'bunch', 'cup', 'pinch'].includes(unit);
  if (!plural) return unit;
  return unit === 'bunch' || unit === 'pinch' ? `${unit}es` : `${unit}s`;
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

/** Build a sized Unsplash URL; passes through data URLs and local paths. */
export const imageUrl = (src, width = 800) => {
  if (!src) return FALLBACK_IMAGE;
  if (src.startsWith('https://images.unsplash.com/')) {
    const base = src.split('?')[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=72`;
  }
  return src;
};

export const average = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Monday of the week containing `date`, as YYYY-MM-DD in local time. */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return toDateKey(d);
};

export const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (dateKey, n) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return toDateKey(date);
};

export const parseDateKey = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const truncate = (text = '', len = 120) => (text.length > len ? `${text.slice(0, len - 1).trimEnd()}…` : text);

export const pluralize = (n, word, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;
