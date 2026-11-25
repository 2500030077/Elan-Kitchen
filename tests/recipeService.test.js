import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { __resetBackend } from '../src/services/storageService';
import { initializeApp } from '../src/services/initService';
import recipeService, { DEFAULT_FILTERS } from '../src/services/recipeService';
import userService from '../src/services/userService';
import plannerService from '../src/services/plannerService';
import { computeAdminStats } from '../src/services/analyticsService';
import { STORAGE_KEYS } from '../src/utils/constants';
import { getWeekStart } from '../src/utils/helpers';

const K = STORAGE_KEYS;
let snapshot;
const users = () => JSON.parse(localStorage.getItem(K.USERS));
const admin = () => users().find((u) => u.role === 'admin');
const demo = () => users().find((u) => u.email === 'demo@elankitchen.example');
const other = () => users().find((u) => u.email === 'priya.sharma@elankitchen.example');
const sampleRecipe = (categoryId) => ({
  title: 'Test Lemon Rice',
  description: 'A bright and simple South Indian lemon rice for testing.',
  cuisine: 'Indian',
  categoryId,
  dietary: ['Vegan'],
  difficulty: 'Easy',
  prepTime: 5,
  cookTime: 10,
  servings: 2,
  image: 'https://images.unsplash.com/photo-1',
  ingredients: [{ name: 'Rice', quantity: 200, unit: 'g' }, { name: 'Lemon', quantity: 1, unit: 'piece' }],
  steps: ['Cook rice.', 'Add lemon.'],
  tags: ['Rice'],
});

beforeAll(async () => {
  localStorage.clear();
  __resetBackend();
  const res = await initializeApp();
  expect(res.seeded).toBe(true);
  snapshot = new Map(localStorage.map);
});

beforeEach(() => {
  localStorage.map = new Map(snapshot);
  __resetBackend();
});

describe('initialisation', () => {
  it('seeds at least 30 approved recipes, categories and demo accounts', () => {
    const recipes = recipeService.getRecipes();
    expect(recipes.filter((r) => r.status === 'approved').length).toBeGreaterThanOrEqual(30);
    expect(recipes.some((r) => r.status === 'pending')).toBe(true);
    expect(admin()).toBeTruthy();
    expect(demo()).toBeTruthy();
    expect(localStorage.getItem(K.USERS)).not.toContain('ElanAdmin@123');
  });

  it('does not reseed or overwrite data on subsequent launches', async () => {
    const before = recipeService.getRecipes().length;
    recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    const res = await initializeApp();
    expect(res.seeded).toBe(false);
    expect(recipeService.getRecipes().length).toBe(before + 1);
  });

  it('restores an admin account if none exists', async () => {
    localStorage.setItem(K.USERS, JSON.stringify(users().filter((u) => u.role !== 'admin')));
    const res = await initializeApp();
    expect(res.repaired).toContain('admin account');
    expect(admin()).toBeTruthy();
  });
});

describe('recipe lifecycle & moderation', () => {
  it('new submissions are pending and hidden until approved', () => {
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    expect(r.status).toBe('pending');
    expect(recipeService.getApprovedRecipes().some((x) => x.id === r.id)).toBe(false);
    expect(recipeService.canViewRecipe(r, null)).toBe(false);
    expect(recipeService.canViewRecipe(r, demo())).toBe(true);
    recipeService.approveRecipe(admin(), r.id);
    expect(recipeService.getApprovedRecipes().some((x) => x.id === r.id)).toBe(true);
  });

  it('requires a rejection reason and stores it', () => {
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    expect(() => recipeService.rejectRecipe(admin(), r.id, '')).toThrow();
    const rejected = recipeService.rejectRecipe(admin(), r.id, 'Needs clearer cooking steps please.');
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toMatch(/clearer/);
    const logs = JSON.parse(localStorage.getItem(K.ACTIVITY_LOGS));
    expect(logs[0].action).toBe('Recipe rejected');
  });

  it('owner edits of an approved recipe return it to pending', () => {
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    recipeService.approveRecipe(admin(), r.id);
    const edited = recipeService.updateRecipe(demo(), r.id, { ...sampleRecipe(r.categoryId), title: 'Edited Lemon Rice' });
    expect(edited.status).toBe('pending');
  });

  it('non-owners cannot edit or delete', () => {
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    expect(() => recipeService.updateRecipe(other(), r.id, sampleRecipe(r.categoryId))).toThrow(/own/);
    expect(() => recipeService.deleteRecipe(other(), r.id)).toThrow(/own/);
  });

  it('non-admins cannot approve', () => {
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    expect(() => recipeService.approveRecipe(demo(), r.id)).toThrow(/Administrator/);
  });

  it('deleting a recipe cascades to favorites, reviews, collections and meal plans', () => {
    const target = recipeService.getApprovedRecipes().find((r) => r.title === 'Butter Chicken');
    const has = (key, pred) => JSON.parse(localStorage.getItem(key)).some(pred);
    expect(has(K.FAVORITES, (f) => f.recipeId === target.id)).toBe(true);
    expect(has(K.COLLECTIONS, (c) => c.recipeIds.includes(target.id))).toBe(true);
    recipeService.deleteRecipe(admin(), target.id);
    expect(has(K.FAVORITES, (f) => f.recipeId === target.id)).toBe(false);
    expect(has(K.REVIEWS, (f) => f.recipeId === target.id)).toBe(false);
    expect(has(K.COLLECTIONS, (c) => c.recipeIds.includes(target.id))).toBe(false);
    expect(has(K.MEAL_PLANS, (p) => JSON.stringify(p.slots).includes(target.id))).toBe(false);
  });
});

describe('reviews & ratings', () => {
  it('one review per user per recipe, editable, and averages recompute', () => {
    const recipe = recipeService.getApprovedRecipes().find((r) => r.authorId !== demo().id && r.authorId !== other().id);
    const fresh = () => recipeService.getReviewsForRecipe(recipe.id).filter((r) => r.userId !== demo().id && r.userId !== other().id);
    // reset to known state
    JSON.parse(localStorage.getItem(K.REVIEWS)).filter((r) => r.recipeId === recipe.id).forEach((r) => recipeService.deleteReview(admin(), r.id));
    expect(fresh()).toHaveLength(0);
    recipeService.upsertReview(demo(), recipe.id, { rating: 5, comment: 'Wonderful, would cook again.' });
    recipeService.upsertReview(other(), recipe.id, { rating: 2, comment: 'Not really my taste, sorry.' });
    let stats = recipeService.computeRatings(recipeService.getReviews()).get(recipe.id);
    expect(stats).toEqual({ rating: 3.5, reviewCount: 2 });
    recipeService.upsertReview(demo(), recipe.id, { rating: 4, comment: 'Updated: still very good indeed.' });
    stats = recipeService.computeRatings(recipeService.getReviews()).get(recipe.id);
    expect(stats).toEqual({ rating: 3, reviewCount: 2 });
    const mine = recipeService.getReviewsForRecipe(recipe.id).find((r) => r.userId === demo().id);
    recipeService.deleteReview(demo(), mine.id);
    stats = recipeService.computeRatings(recipeService.getReviews()).get(recipe.id);
    expect(stats).toEqual({ rating: 2, reviewCount: 1 });
  });

  it('cannot review pending or own recipes', () => {
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    expect(() => recipeService.upsertReview(other(), r.id, { rating: 5, comment: 'Lovely dish indeed.' })).toThrow(/approved/);
    recipeService.approveRecipe(admin(), r.id);
    expect(() => recipeService.upsertReview(demo(), r.id, { rating: 5, comment: 'Lovely dish indeed.' })).toThrow(/own/);
  });
});

describe('favorites & collections', () => {
  it('toggles favorites without duplicates', () => {
    const r = recipeService.getApprovedRecipes()[5];
    const u = other();
    const start = recipeService.getFavoriteIds(u.id).filter((id) => id === r.id).length;
    if (start) recipeService.toggleFavorite(u, r.id);
    expect(recipeService.toggleFavorite(u, r.id)).toBe(true);
    expect(recipeService.getFavoriteIds(u.id).filter((id) => id === r.id)).toHaveLength(1);
    expect(recipeService.toggleFavorite(u, r.id)).toBe(false);
    expect(recipeService.isFavorite(u.id, r.id)).toBe(false);
  });

  it('collections are user-specific and reject duplicates', () => {
    const c = recipeService.createCollection(other(), { name: 'Soups', description: 'Warm bowls' });
    const r = recipeService.getApprovedRecipes()[0];
    recipeService.addRecipeToCollection(other(), c.id, r.id);
    expect(() => recipeService.addRecipeToCollection(other(), c.id, r.id)).toThrow(/Already/);
    expect(() => recipeService.deleteCollection(demo(), c.id)).toThrow(/not found/);
    expect(recipeService.getCollections(demo().id).some((x) => x.id === c.id)).toBe(false);
    recipeService.updateCollection(other(), c.id, { name: 'Soup Season' });
    expect(recipeService.getCollections(other().id).find((x) => x.id === c.id).name).toBe('Soup Season');
    recipeService.deleteCollection(other(), c.id);
    expect(recipeService.getCollections(other().id).some((x) => x.id === c.id)).toBe(false);
  });
});

describe('search & filters', () => {
  const enriched = () => recipeService.enrichRecipes(recipeService.getApprovedRecipes(), { reviews: recipeService.getReviews() });
  it('filters combine (cuisine + dietary + time)', () => {
    const res = recipeService.filterRecipes(enriched(), { ...DEFAULT_FILTERS, cuisines: ['Indian'], dietary: ['Vegetarian'], maxTime: '60' });
    expect(res.length).toBeGreaterThan(0);
    res.forEach((r) => {
      expect(r.cuisine).toBe('Indian');
      expect(r.dietary).toContain('Vegetarian');
      expect(r.prepTime + r.cookTime).toBeLessThanOrEqual(60);
    });
  });
  it('searches by ingredient and name', () => {
    expect(recipeService.filterRecipes(enriched(), { ...DEFAULT_FILTERS, ingredient: 'paneer' }).map((r) => r.title)).toEqual(
      expect.arrayContaining(['Paneer Butter Masala', 'Palak Paneer']),
    );
    expect(recipeService.filterRecipes(enriched(), { ...DEFAULT_FILTERS, q: 'tiramisu' })).toHaveLength(1);
  });
  it('sorts by quickest time', () => {
    const res = recipeService.filterRecipes(enriched(), { ...DEFAULT_FILTERS, sort: 'time' });
    for (let i = 1; i < res.length; i += 1) expect(res[i].totalTime).toBeGreaterThanOrEqual(res[i - 1].totalTime);
  });
});

describe('categories', () => {
  it('prevents duplicates and in-use deletion, supports reassignment', () => {
    expect(() => recipeService.createCategory(admin(), { name: 'desserts' })).toThrow(/exists/);
    const desserts = recipeService.getCategories().find((c) => c.name === 'Desserts');
    const beverages = recipeService.getCategories().find((c) => c.name === 'Beverages');
    expect(() => recipeService.deleteCategory(admin(), desserts.id)).toThrow(/Reassign/);
    const n = recipeService.countRecipesInCategory(desserts.id);
    recipeService.deleteCategory(admin(), desserts.id, beverages.id);
    expect(recipeService.countRecipesInCategory(desserts.id)).toBe(0);
    expect(recipeService.countRecipesInCategory(beverages.id)).toBeGreaterThanOrEqual(n);
    const soups = recipeService.getCategories().find((c) => c.name === 'Soups');
    expect(recipeService.deleteCategory(admin(), soups.id)).toBe(true);
  });
});

describe('user management', () => {
  it('admins cannot block or delete themselves', () => {
    expect(() => userService.blockUser(admin(), admin().id)).toThrow(/own/);
    expect(() => userService.deleteUser(admin(), admin().id)).toThrow(/own/);
  });

  it('block/unblock and delete with data cleanup', () => {
    const u = other();
    userService.blockUser(admin(), u.id);
    expect(users().find((x) => x.id === u.id).status).toBe('blocked');
    userService.unblockUser(admin(), u.id);
    expect(users().find((x) => x.id === u.id).status).toBe('active');
    const authored = recipeService.getRecipes().filter((r) => r.authorId === u.id && r.status === 'approved').map((r) => r.id);
    userService.deleteUser(admin(), u.id);
    expect(users().some((x) => x.id === u.id)).toBe(false);
    expect(JSON.parse(localStorage.getItem(K.REVIEWS)).some((r) => r.userId === u.id)).toBe(false);
    authored.forEach((id) => expect(recipeService.getRecipeById(id).authorId).toBeNull());
  });

  it('profile email updates enforce uniqueness', () => {
    expect(() => userService.updateProfile(demo(), { name: 'Aarav', email: 'PRIYA.SHARMA@elankitchen.example' })).toThrow();
    const updated = userService.updateProfile(demo(), { name: 'Aarav M', email: 'demo@elankitchen.example' });
    expect(updated.name).toBe('Aarav M');
  });
});

describe('meal planner & shopping list', () => {
  it('assigns slots, aggregates matching units only, and persists list state', () => {
    const u = other();
    const week = getWeekStart();
    const byTitle = (t) => recipeService.getApprovedRecipes().find((r) => r.title === t);
    plannerService.setMealSlot(u.id, week, 'Monday', 'dinner', byTitle('Paneer Butter Masala').id);
    plannerService.setMealSlot(u.id, week, 'Tuesday', 'dinner', byTitle('Palak Paneer').id);
    const plan = plannerService.getMealPlan(u.id, week);
    expect(plan.slots.Monday.dinner).toBeTruthy();
    const byId = new Map(recipeService.getRecipes().map((r) => [r.id, r]));
    const items = plannerService.aggregateIngredients(plannerService.getPlannedRecipeIds(plan), byId);
    const paneer = items.filter((i) => i.name.toLowerCase().startsWith('paneer'));
    expect(paneer).toHaveLength(1);
    expect(paneer[0]).toMatchObject({ quantity: 650, unit: 'g' });
    // incompatible units stay separate
    const mixed = plannerService.aggregateIngredients(['a', 'b'], new Map([
      ['a', { title: 'A', ingredients: [{ name: 'Butter', quantity: 2, unit: 'tbsp' }] }],
      ['b', { title: 'B', ingredients: [{ name: 'Butter', quantity: 0.5, unit: 'kg' }, { name: 'Butter', quantity: 200, unit: 'g' }] }],
    ]));
    expect(mixed).toHaveLength(2);
    expect(mixed.find((m) => m.unit === 'g')).toMatchObject({ quantity: 700 });
    plannerService.toggleShoppingItem(u.id, week, paneer[0].key);
    expect(plannerService.getShoppingState(u.id, week).checked[paneer[0].key]).toBe(true);
    plannerService.addCustomItem(u.id, week, { name: 'Napkins', quantity: '', unit: '' });
    plannerService.clearCompleted(u.id, week);
    const state = plannerService.getShoppingState(u.id, week);
    expect(state.removed).toContain(paneer[0].key);
    expect(state.customItems).toHaveLength(1);
    plannerService.clearWeek(u.id, week);
    expect(plannerService.getPlannedRecipeIds(plannerService.getMealPlan(u.id, week))).toHaveLength(0);
  });
});

describe('analytics', () => {
  it('derives statistics from stored data', () => {
    const stats = computeAdminStats({ users: users(), recipes: recipeService.getRecipes(), reviews: recipeService.getReviews() });
    expect(stats.totalRecipes).toBe(recipeService.getRecipes().length);
    expect(stats.approved + stats.pending + stats.rejected).toBe(stats.totalRecipes);
    expect(stats.blockedUsers).toBeGreaterThanOrEqual(1);
    const r = recipeService.createRecipe(demo(), sampleRecipe(recipeService.getCategories()[0].id));
    const after = computeAdminStats({ users: users(), recipes: recipeService.getRecipes(), reviews: recipeService.getReviews() });
    expect(after.pending).toBe(stats.pending + 1);
    expect(r).toBeTruthy();
  });
});
