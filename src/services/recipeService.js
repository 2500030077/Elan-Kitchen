/**
 * Recipe domain service: recipes, moderation, reviews, favorites,
 * collections and categories. Maintains referential integrity on delete.
 */
import { ACTIVITY_ACTIONS, RECIPE_STATUS, ROLES, STORAGE_KEYS } from '../utils/constants';
import { average, generateId, nowISO, slugify, totalTime } from '../utils/helpers';
import { validateRecipe } from '../utils/validation';
import storage, { StorageError } from './storageService';
import { logActivity } from './activityService';

const K = STORAGE_KEYS;

export class DomainError extends Error {
  constructor(message, code = 'DOMAIN_ERROR', errors) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.errors = errors;
  }
}

const requireUser = (actor) => {
  if (!actor?.id) throw new DomainError('You must be signed in to do that.', 'UNAUTHENTICATED');
};
const requireAdmin = (actor) => {
  if (actor?.role !== ROLES.ADMIN) throw new DomainError('Administrator access is required.', 'FORBIDDEN');
};

/* =========================================================
 * Recipes
 * ======================================================= */

export const getRecipes = () => storage.getAll(K.RECIPES);
export const getRecipeById = (id) => storage.findById(K.RECIPES, id);
export const getApprovedRecipes = () => getRecipes().filter((r) => r.status === RECIPE_STATUS.APPROVED);

/** Can `actor` view this recipe? Approved → everyone; otherwise author or admin. */
export const canViewRecipe = (recipe, actor) => {
  if (!recipe) return false;
  if (recipe.status === RECIPE_STATUS.APPROVED) return true;
  if (!actor) return false;
  return actor.role === ROLES.ADMIN || recipe.authorId === actor.id;
};

/** Ratings are always derived from reviews so they can never drift. */
export const computeRatings = (reviews) => {
  const map = new Map();
  reviews.forEach((rv) => {
    if (!map.has(rv.recipeId)) map.set(rv.recipeId, []);
    map.get(rv.recipeId).push(Number(rv.rating) || 0);
  });
  const out = new Map();
  map.forEach((ratings, id) => out.set(id, { rating: Math.round(average(ratings) * 10) / 10, reviewCount: ratings.length }));
  return out;
};

/** Attach derived fields (rating, reviewCount, favoriteCount, authorName, categoryName). */
export const enrichRecipes = (recipes, { reviews = [], favorites = [], users = [], categories = [] } = {}) => {
  const ratings = computeRatings(reviews);
  const favCounts = new Map();
  favorites.forEach((f) => favCounts.set(f.recipeId, (favCounts.get(f.recipeId) || 0) + 1));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const catMap = new Map(categories.map((c) => [c.id, c]));
  return recipes.map((r) => {
    const stats = ratings.get(r.id) || { rating: 0, reviewCount: 0 };
    const author = userMap.get(r.authorId);
    return {
      ...r,
      rating: stats.rating,
      reviewCount: stats.reviewCount,
      favoriteCount: favCounts.get(r.id) || 0,
      authorName: author?.name || r.authorName || 'Élan Community',
      authorAvatar: author?.avatar || '',
      categoryName: catMap.get(r.categoryId)?.name || 'Uncategorised',
      totalTime: totalTime(r),
      popularity: (r.views || 0) + (favCounts.get(r.id) || 0) * 5 + stats.reviewCount * 3,
    };
  });
};

const normaliseRecipeInput = (data) => ({
  title: data.title.trim(),
  description: data.description.trim(),
  cuisine: data.cuisine,
  categoryId: data.categoryId,
  dietary: [...new Set(data.dietary || [])],
  difficulty: data.difficulty,
  prepTime: Number(data.prepTime),
  cookTime: Number(data.cookTime),
  servings: Number(data.servings),
  image: data.image,
  ingredients: (data.ingredients || [])
    .filter((i) => i.name?.trim())
    .map((i) => ({
      id: i.id || generateId(),
      name: i.name.trim(),
      quantity: i.quantity === '' || i.quantity === null || i.quantity === undefined ? null : Number(i.quantity),
      unit: i.unit || '',
    })),
  steps: (data.steps || []).map((s) => s.trim()).filter(Boolean),
  nutrition: {
    calories: data.nutrition?.calories === '' || data.nutrition?.calories == null ? null : Number(data.nutrition.calories),
    protein: data.nutrition?.protein === '' || data.nutrition?.protein == null ? null : Number(data.nutrition.protein),
    carbs: data.nutrition?.carbs === '' || data.nutrition?.carbs == null ? null : Number(data.nutrition.carbs),
    fat: data.nutrition?.fat === '' || data.nutrition?.fat == null ? null : Number(data.nutrition.fat),
  },
  tags: [...new Set((data.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 10),
});

export const createRecipe = (actor, data) => {
  requireUser(actor);
  const errors = validateRecipe(data);
  if (Object.keys(errors).length) throw new DomainError('Please fix the highlighted fields.', 'VALIDATION', errors);
  if (!storage.findById(K.CATEGORIES, data.categoryId)) throw new DomainError('Selected category no longer exists.', 'VALIDATION', { categoryId: 'Select a valid category.' });
  return storage.create(K.RECIPES, {
    ...normaliseRecipeInput(data),
    authorId: actor.id,
    status: RECIPE_STATUS.PENDING,
    rejectionReason: '',
    views: 0,
    submittedAt: nowISO(),
    reviewedAt: null,
  });
};

/**
 * Update a recipe. Owners editing an approved/rejected recipe send it back
 * to Pending for moderation. Admin edits keep the current status.
 */
export const updateRecipe = (actor, id, data) => {
  requireUser(actor);
  const recipe = getRecipeById(id);
  if (!recipe) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  const isAdmin = actor.role === ROLES.ADMIN;
  if (!isAdmin && recipe.authorId !== actor.id) throw new DomainError('You can only edit your own recipes.', 'FORBIDDEN');
  const errors = validateRecipe(data);
  if (Object.keys(errors).length) throw new DomainError('Please fix the highlighted fields.', 'VALIDATION', errors);
  const patch = normaliseRecipeInput(data);
  if (!isAdmin) {
    patch.status = RECIPE_STATUS.PENDING;
    patch.rejectionReason = '';
    patch.submittedAt = nowISO();
  }
  const updated = storage.update(K.RECIPES, id, patch);
  if (isAdmin) {
    logActivity(actor, { action: ACTIVITY_ACTIONS.RECIPE_EDITED, entityType: 'Recipe', entityId: id, entityName: updated.title });
  }
  return updated;
};

/** Remove a recipe and every record that references it. */
export const cascadeDeleteRecipe = (recipeId) => {
  storage.remove(K.RECIPES, recipeId);
  storage.removeWhere(K.FAVORITES, (f) => f.recipeId === recipeId);
  storage.removeWhere(K.REVIEWS, (r) => r.recipeId === recipeId);
  storage.updateWhere(
    K.COLLECTIONS,
    (c) => (c.recipeIds || []).includes(recipeId),
    (c) => ({ ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) }),
  );
  storage.updateWhere(
    K.MEAL_PLANS,
    (p) => Object.values(p.slots || {}).some((day) => Object.values(day || {}).includes(recipeId)),
    (p) => {
      const slots = {};
      Object.entries(p.slots || {}).forEach(([day, meals]) => {
        slots[day] = {};
        Object.entries(meals || {}).forEach(([slot, rid]) => {
          slots[day][slot] = rid === recipeId ? null : rid;
        });
      });
      return { ...p, slots };
    },
  );
  storage.updateWhere(
    K.RECENTLY_VIEWED,
    (rv) => (rv.recipeIds || []).includes(recipeId),
    (rv) => ({ ...rv, recipeIds: rv.recipeIds.filter((id) => id !== recipeId) }),
  );
};

export const deleteRecipe = (actor, id) => {
  requireUser(actor);
  const recipe = getRecipeById(id);
  if (!recipe) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  const isAdmin = actor.role === ROLES.ADMIN;
  if (!isAdmin && recipe.authorId !== actor.id) throw new DomainError('You can only delete your own recipes.', 'FORBIDDEN');
  cascadeDeleteRecipe(id);
  if (isAdmin) {
    logActivity(actor, { action: ACTIVITY_ACTIONS.RECIPE_DELETED, entityType: 'Recipe', entityId: id, entityName: recipe.title });
  }
  return true;
};

export const approveRecipe = (admin, id) => {
  requireAdmin(admin);
  const recipe = getRecipeById(id);
  if (!recipe) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  const updated = storage.update(K.RECIPES, id, { status: RECIPE_STATUS.APPROVED, rejectionReason: '', reviewedAt: nowISO(), publishedAt: recipe.publishedAt || nowISO() });
  logActivity(admin, { action: ACTIVITY_ACTIONS.RECIPE_APPROVED, entityType: 'Recipe', entityId: id, entityName: recipe.title });
  return updated;
};

export const rejectRecipe = (admin, id, reason) => {
  requireAdmin(admin);
  const trimmed = (reason || '').trim();
  if (trimmed.length < 10) throw new DomainError('Please give a rejection reason of at least 10 characters.', 'VALIDATION', { reason: 'Reason must be at least 10 characters.' });
  const recipe = getRecipeById(id);
  if (!recipe) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  const updated = storage.update(K.RECIPES, id, { status: RECIPE_STATUS.REJECTED, rejectionReason: trimmed, reviewedAt: nowISO() });
  logActivity(admin, { action: ACTIVITY_ACTIONS.RECIPE_REJECTED, entityType: 'Recipe', entityId: id, entityName: recipe.title, details: trimmed });
  return updated;
};

export const incrementViews = (id) => {
  try {
    const recipe = getRecipeById(id);
    if (!recipe) return;
    const all = getRecipes().map((r) => (r.id === id ? { ...r, views: (r.views || 0) + 1 } : r));
    // silent: view counts should not trigger app-wide re-renders on every page view
    storage.write(K.RECIPES, all, { silent: true });
  } catch (e) {
    if (!(e instanceof StorageError)) throw e;
  }
};

/* =========================================================
 * Search & filtering (pure — used by Explore and unit tests)
 * ======================================================= */

export const DEFAULT_FILTERS = {
  q: '',
  ingredient: '',
  cuisines: [],
  dietary: [],
  difficulty: [],
  maxTime: '',
  categoryId: '',
  minRating: 0,
  sort: 'newest',
};

export const filterRecipes = (recipes, f = DEFAULT_FILTERS) => {
  const q = (f.q || '').trim().toLowerCase();
  const ing = (f.ingredient || '').trim().toLowerCase();
  const ingTerms = ing ? ing.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const out = recipes.filter((r) => {
    if (q) {
      const hay = `${r.title} ${r.description} ${(r.tags || []).join(' ')} ${r.cuisine}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (ingTerms.length) {
      const names = (r.ingredients || []).map((i) => i.name.toLowerCase());
      if (!ingTerms.every((t) => names.some((n) => n.includes(t)))) return false;
    }
    if (f.cuisines?.length && !f.cuisines.includes(r.cuisine)) return false;
    if (f.dietary?.length && !f.dietary.every((d) => (r.dietary || []).includes(d))) return false;
    if (f.difficulty?.length && !f.difficulty.includes(r.difficulty)) return false;
    if (f.categoryId && r.categoryId !== f.categoryId) return false;
    if (f.maxTime) {
      const t = totalTime(r);
      const limit = Number(f.maxTime);
      if (limit === 61 ? t <= 60 : t > limit) return false;
    }
    if (f.minRating && (r.rating || 0) < Number(f.minRating)) return false;
    return true;
  });
  const sorters = {
    newest: (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt),
    popular: (a, b) => (b.popularity || 0) - (a.popularity || 0),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0),
    time: (a, b) => totalTime(a) - totalTime(b),
  };
  return out.sort(sorters[f.sort] || sorters.newest);
};

/* =========================================================
 * Reviews
 * ======================================================= */

export const getReviews = () => storage.getAll(K.REVIEWS);
export const getReviewsForRecipe = (recipeId) =>
  getReviews()
    .filter((r) => r.recipeId === recipeId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

/** Create or update the current user's single review for a recipe. */
export const upsertReview = (actor, recipeId, { rating, comment }) => {
  requireUser(actor);
  const recipe = getRecipeById(recipeId);
  if (!recipe) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  if (recipe.status !== RECIPE_STATUS.APPROVED) throw new DomainError('Only approved recipes can be reviewed.', 'FORBIDDEN');
  if (recipe.authorId === actor.id) throw new DomainError('You cannot review your own recipe.', 'FORBIDDEN');
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw new DomainError('Choose a rating from 1 to 5 stars.', 'VALIDATION', { rating: 'Select a star rating.' });
  const text = (comment || '').trim();
  if (text.length < 10) throw new DomainError('Reviews should be at least 10 characters.', 'VALIDATION', { comment: 'Write at least 10 characters.' });
  if (text.length > 1000) throw new DomainError('Reviews must be 1000 characters or fewer.', 'VALIDATION', { comment: 'Keep it under 1000 characters.' });
  const existing = storage.findOne(K.REVIEWS, (rv) => rv.recipeId === recipeId && rv.userId === actor.id);
  if (existing) return storage.update(K.REVIEWS, existing.id, { rating: r, comment: text });
  return storage.create(K.REVIEWS, { recipeId, userId: actor.id, rating: r, comment: text });
};

export const deleteReview = (actor, reviewId) => {
  requireUser(actor);
  const review = storage.findById(K.REVIEWS, reviewId);
  if (!review) throw new DomainError('Review not found.', 'NOT_FOUND');
  const isAdmin = actor.role === ROLES.ADMIN;
  if (!isAdmin && review.userId !== actor.id) throw new DomainError('You can only delete your own review.', 'FORBIDDEN');
  storage.remove(K.REVIEWS, reviewId);
  if (isAdmin && review.userId !== actor.id) {
    const recipe = getRecipeById(review.recipeId);
    logActivity(actor, {
      action: ACTIVITY_ACTIONS.REVIEW_DELETED,
      entityType: 'Review',
      entityId: reviewId,
      entityName: recipe ? `Review on “${recipe.title}”` : 'Review',
      details: `${review.rating}★ — ${review.comment.slice(0, 80)}`,
    });
  }
  return true;
};

/* =========================================================
 * Favorites
 * ======================================================= */

export const getFavoriteIds = (userId) => storage.filterBy(K.FAVORITES, (f) => f.userId === userId).map((f) => f.recipeId);

export const isFavorite = (userId, recipeId) => !!storage.findOne(K.FAVORITES, (f) => f.userId === userId && f.recipeId === recipeId);

/** Toggle a favorite. Returns true if now favourited. Duplicates are impossible. */
export const toggleFavorite = (actor, recipeId) => {
  requireUser(actor);
  const existing = storage.findOne(K.FAVORITES, (f) => f.userId === actor.id && f.recipeId === recipeId);
  if (existing) {
    storage.remove(K.FAVORITES, existing.id);
    return false;
  }
  if (!getRecipeById(recipeId)) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  storage.create(K.FAVORITES, { userId: actor.id, recipeId });
  return true;
};

/* =========================================================
 * Collections
 * ======================================================= */

export const getCollections = (userId) =>
  storage.filterBy(K.COLLECTIONS, (c) => c.userId === userId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const getOwnedCollection = (actor, id) => {
  requireUser(actor);
  const c = storage.findById(K.COLLECTIONS, id);
  if (!c || c.userId !== actor.id) throw new DomainError('Collection not found.', 'NOT_FOUND');
  return c;
};

const validateCollection = (actor, { name, description }, ignoreId) => {
  const n = (name || '').trim();
  if (!n) throw new DomainError('Collection name is required.', 'VALIDATION', { name: 'Collection name is required.' });
  if (n.length > 50) throw new DomainError('Collection name must be 50 characters or fewer.', 'VALIDATION', { name: 'Keep the name under 50 characters.' });
  if ((description || '').length > 200) throw new DomainError('Description must be 200 characters or fewer.', 'VALIDATION', { description: 'Keep it under 200 characters.' });
  const dup = getCollections(actor.id).find((c) => c.id !== ignoreId && c.name.toLowerCase() === n.toLowerCase());
  if (dup) throw new DomainError('You already have a collection with this name.', 'VALIDATION', { name: 'You already have a collection with this name.' });
  return n;
};

export const createCollection = (actor, { name, description = '', coverImage = '' }) => {
  requireUser(actor);
  const n = validateCollection(actor, { name, description });
  return storage.create(K.COLLECTIONS, { userId: actor.id, name: n, description: description.trim(), coverImage, recipeIds: [] });
};

export const updateCollection = (actor, id, { name, description = '', coverImage = '' }) => {
  getOwnedCollection(actor, id);
  const n = validateCollection(actor, { name, description }, id);
  return storage.update(K.COLLECTIONS, id, { name: n, description: description.trim(), coverImage });
};

export const deleteCollection = (actor, id) => {
  getOwnedCollection(actor, id);
  return storage.remove(K.COLLECTIONS, id);
};

export const addRecipeToCollection = (actor, collectionId, recipeId) => {
  const c = getOwnedCollection(actor, collectionId);
  if (!getRecipeById(recipeId)) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  if ((c.recipeIds || []).includes(recipeId)) throw new DomainError(`Already in “${c.name}”.`, 'DUPLICATE');
  return storage.update(K.COLLECTIONS, collectionId, { recipeIds: [...(c.recipeIds || []), recipeId] });
};

export const removeRecipeFromCollection = (actor, collectionId, recipeId) => {
  const c = getOwnedCollection(actor, collectionId);
  return storage.update(K.COLLECTIONS, collectionId, { recipeIds: (c.recipeIds || []).filter((id) => id !== recipeId) });
};

/* =========================================================
 * Categories
 * ======================================================= */

export const getCategories = () => storage.getAll(K.CATEGORIES).sort((a, b) => a.name.localeCompare(b.name));

const validateCategory = ({ name, description }, ignoreId) => {
  const n = (name || '').trim();
  if (!n) throw new DomainError('Category name is required.', 'VALIDATION', { name: 'Category name is required.' });
  if (n.length < 2 || n.length > 40) throw new DomainError('Category name must be 2–40 characters.', 'VALIDATION', { name: 'Use 2–40 characters.' });
  if ((description || '').length > 160) throw new DomainError('Description must be 160 characters or fewer.', 'VALIDATION', { description: 'Keep it under 160 characters.' });
  const dup = getCategories().find((c) => c.id !== ignoreId && c.name.trim().toLowerCase() === n.toLowerCase());
  if (dup) throw new DomainError('A category with this name already exists.', 'DUPLICATE', { name: 'A category with this name already exists.' });
  return n;
};

export const createCategory = (admin, { name, description = '' }) => {
  requireAdmin(admin);
  const n = validateCategory({ name, description });
  const cat = storage.create(K.CATEGORIES, { name: n, slug: slugify(n), description: description.trim() });
  logActivity(admin, { action: ACTIVITY_ACTIONS.CATEGORY_CREATED, entityType: 'Category', entityId: cat.id, entityName: n });
  return cat;
};

export const updateCategory = (admin, id, { name, description = '' }) => {
  requireAdmin(admin);
  const existing = storage.findById(K.CATEGORIES, id);
  if (!existing) throw new DomainError('Category not found.', 'NOT_FOUND');
  const n = validateCategory({ name, description }, id);
  const cat = storage.update(K.CATEGORIES, id, { name: n, slug: slugify(n), description: description.trim() });
  logActivity(admin, {
    action: ACTIVITY_ACTIONS.CATEGORY_UPDATED,
    entityType: 'Category',
    entityId: id,
    entityName: n,
    details: existing.name !== n ? `Renamed from “${existing.name}”` : 'Description updated',
  });
  return cat;
};

export const countRecipesInCategory = (id) => getRecipes().filter((r) => r.categoryId === id).length;

/**
 * Delete a category. If recipes use it, `reassignTo` must name another
 * category; those recipes are moved before deletion.
 */
export const deleteCategory = (admin, id, reassignTo) => {
  requireAdmin(admin);
  const cat = storage.findById(K.CATEGORIES, id);
  if (!cat) throw new DomainError('Category not found.', 'NOT_FOUND');
  const count = countRecipesInCategory(id);
  let details = '';
  if (count > 0) {
    if (!reassignTo || reassignTo === id) {
      throw new DomainError(`This category is used by ${count} recipe(s). Reassign them before deleting.`, 'IN_USE');
    }
    const target = storage.findById(K.CATEGORIES, reassignTo);
    if (!target) throw new DomainError('Target category not found.', 'NOT_FOUND');
    storage.updateWhere(K.RECIPES, (r) => r.categoryId === id, (r) => ({ ...r, categoryId: reassignTo }));
    details = `${count} recipe(s) moved to “${target.name}”`;
  }
  storage.remove(K.CATEGORIES, id);
  logActivity(admin, { action: ACTIVITY_ACTIONS.CATEGORY_DELETED, entityType: 'Category', entityId: id, entityName: cat.name, details });
  return true;
};

const recipeService = {
  getRecipes,
  getRecipeById,
  getApprovedRecipes,
  canViewRecipe,
  computeRatings,
  enrichRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  cascadeDeleteRecipe,
  approveRecipe,
  rejectRecipe,
  incrementViews,
  filterRecipes,
  getReviews,
  getReviewsForRecipe,
  upsertReview,
  deleteReview,
  getFavoriteIds,
  isFavorite,
  toggleFavorite,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  countRecipesInCategory,
};

export default recipeService;
