/**
 * Pure analytics helpers for the admin dashboard. Every number is
 * derived from the records passed in — nothing is hardcoded.
 */
import { RECIPE_STATUS, ROLES, USER_STATUS } from '../utils/constants';
import { average } from '../utils/helpers';
import { computeRatings } from './recipeService';

const monthKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Last `n` calendar months, oldest first, as { key, label }. */
export const lastMonths = (n = 6, now = new Date()) => {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d.toISOString()), label: d.toLocaleDateString('en-GB', { month: 'short' }) });
  }
  return out;
};

const countByMonth = (items, dateField, months) => {
  const counts = Object.fromEntries(months.map((m) => [m.key, 0]));
  items.forEach((it) => {
    const k = monthKey(it[dateField]);
    if (k in counts) counts[k] += 1;
  });
  return counts;
};

export const computeAdminStats = ({ users = [], recipes = [], reviews = [] }) => {
  const members = users.filter((u) => u.role !== ROLES.ADMIN);
  const ratings = computeRatings(reviews);
  const ratedRecipes = [...ratings.values()];
  return {
    totalUsers: members.length,
    activeUsers: members.filter((u) => u.status === USER_STATUS.ACTIVE).length,
    blockedUsers: members.filter((u) => u.status === USER_STATUS.BLOCKED).length,
    totalRecipes: recipes.length,
    approved: recipes.filter((r) => r.status === RECIPE_STATUS.APPROVED).length,
    pending: recipes.filter((r) => r.status === RECIPE_STATUS.PENDING).length,
    rejected: recipes.filter((r) => r.status === RECIPE_STATUS.REJECTED).length,
    totalReviews: reviews.length,
    averageRating: reviews.length ? Math.round(average(reviews.map((r) => Number(r.rating) || 0)) * 10) / 10 : 0,
    ratedRecipeCount: ratedRecipes.length,
  };
};

export const registrationTrend = (users, months = lastMonths(6)) => {
  const counts = countByMonth(users.filter((u) => u.role !== ROLES.ADMIN), 'createdAt', months);
  return months.map((m) => ({ month: m.label, users: counts[m.key] }));
};

export const submissionTrend = (recipes, months = lastMonths(6)) => {
  const submitted = countByMonth(recipes.map((r) => ({ ...r, d: r.submittedAt || r.createdAt })), 'd', months);
  const approved = countByMonth(
    recipes.filter((r) => r.status === RECIPE_STATUS.APPROVED).map((r) => ({ d: r.reviewedAt || r.publishedAt || r.createdAt })),
    'd',
    months,
  );
  return months.map((m) => ({ month: m.label, submitted: submitted[m.key], approved: approved[m.key] }));
};

export const statusDistribution = (recipes) => [
  { name: 'Approved', value: recipes.filter((r) => r.status === RECIPE_STATUS.APPROVED).length, key: 'approved' },
  { name: 'Pending', value: recipes.filter((r) => r.status === RECIPE_STATUS.PENDING).length, key: 'pending' },
  { name: 'Rejected', value: recipes.filter((r) => r.status === RECIPE_STATUS.REJECTED).length, key: 'rejected' },
];

export const cuisinePopularity = (recipes) => {
  const counts = new Map();
  recipes
    .filter((r) => r.status === RECIPE_STATUS.APPROVED)
    .forEach((r) => counts.set(r.cuisine, (counts.get(r.cuisine) || 0) + 1));
  return [...counts.entries()].map(([cuisine, count]) => ({ cuisine, count })).sort((a, b) => b.count - a.count);
};

export const topRatedRecipes = (recipes, reviews, limit = 5) => {
  const ratings = computeRatings(reviews);
  return recipes
    .filter((r) => r.status === RECIPE_STATUS.APPROVED && ratings.has(r.id))
    .map((r) => ({ id: r.id, title: r.title, ...ratings.get(r.id) }))
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
};

export default { computeAdminStats, registrationTrend, submissionTrend, statusDistribution, cuisinePopularity, topRatedRecipes, lastMonths };
