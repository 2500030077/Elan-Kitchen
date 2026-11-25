/**
 * Weekly meal planner and shopping list generation.
 */
import { MEAL_SLOTS, STORAGE_KEYS, WEEK_DAYS } from '../utils/constants';
import { generateId } from '../utils/helpers';
import storage from './storageService';
import { DomainError } from './recipeService';

const K = STORAGE_KEYS;

export const emptySlots = () =>
  Object.fromEntries(WEEK_DAYS.map((d) => [d, Object.fromEntries(MEAL_SLOTS.map((s) => [s.key, null]))]));

export const getMealPlan = (userId, weekStart) => {
  const plan = storage.findOne(K.MEAL_PLANS, (p) => p.userId === userId && p.weekStart === weekStart);
  if (!plan) return { userId, weekStart, slots: emptySlots() };
  return { ...plan, slots: { ...emptySlots(), ...plan.slots } };
};

export const getUpcomingPlans = (userId, fromWeek) =>
  storage
    .filterBy(K.MEAL_PLANS, (p) => p.userId === userId && p.weekStart >= fromWeek)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

export const setMealSlot = (userId, weekStart, day, slot, recipeId) => {
  if (!userId) throw new DomainError('You must be signed in.', 'UNAUTHENTICATED');
  if (!WEEK_DAYS.includes(day) || !MEAL_SLOTS.some((s) => s.key === slot)) throw new DomainError('Invalid meal slot.', 'VALIDATION');
  if (recipeId && !storage.findById(K.RECIPES, recipeId)) throw new DomainError('Recipe not found.', 'NOT_FOUND');
  const existing = storage.findOne(K.MEAL_PLANS, (p) => p.userId === userId && p.weekStart === weekStart);
  if (existing) {
    return storage.update(K.MEAL_PLANS, existing.id, (p) => {
      const slots = { ...emptySlots(), ...p.slots };
      slots[day] = { ...slots[day], [slot]: recipeId || null };
      return { ...p, slots };
    });
  }
  const slots = emptySlots();
  slots[day][slot] = recipeId || null;
  return storage.create(K.MEAL_PLANS, { userId, weekStart, slots });
};

export const clearWeek = (userId, weekStart) => {
  storage.removeWhere(K.MEAL_PLANS, (p) => p.userId === userId && p.weekStart === weekStart);
};

/* ---------- shopping list ---------- */

const UNIT_CONVERSIONS = { kg: { base: 'g', factor: 1000 }, l: { base: 'ml', factor: 1000 } };

const normaliseName = (name) =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Convert to a base unit only between strictly compatible metric units. */
const toBase = (qty, unit) => {
  const conv = UNIT_CONVERSIONS[unit];
  if (conv && qty !== null) return { qty: qty * conv.factor, unit: conv.base };
  return { qty, unit: unit || '' };
};

const fromBase = (qty, unit) => {
  if (qty === null) return { qty, unit };
  if (unit === 'g' && qty >= 1000) return { qty: qty / 1000, unit: 'kg' };
  if (unit === 'ml' && qty >= 1000) return { qty: qty / 1000, unit: 'l' };
  return { qty, unit };
};

/**
 * Aggregate ingredients from the planned recipes. Ingredients are merged only
 * when name AND (compatible) unit match — e.g. 200 g + 0.5 kg butter = 700 g,
 * but 2 tbsp butter stays a separate line from 700 g butter.
 */
export const aggregateIngredients = (recipeIds, recipesById) => {
  const map = new Map();
  recipeIds.forEach((rid) => {
    const recipe = recipesById.get(rid);
    if (!recipe) return;
    (recipe.ingredients || []).forEach((ing) => {
      const name = normaliseName(ing.name);
      if (!name) return;
      const { qty, unit } = toBase(ing.quantity === null || ing.quantity === undefined ? null : Number(ing.quantity), ing.unit);
      const key = `${name}|${unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity = existing.quantity === null || qty === null ? existing.quantity ?? qty : existing.quantity + qty;
        if (!existing.recipes.includes(recipe.title)) existing.recipes.push(recipe.title);
      } else {
        map.set(key, { key, name: ing.name.replace(/,.*$/, '').trim(), quantity: qty, unit, recipes: [recipe.title] });
      }
    });
  });
  return [...map.values()]
    .map((item) => {
      const { qty, unit } = fromBase(item.quantity, item.unit);
      return { ...item, quantity: qty === null ? null : Math.round(qty * 100) / 100, unit };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getPlannedRecipeIds = (plan) =>
  Object.values(plan.slots || {}).flatMap((day) => Object.values(day || {}).filter(Boolean));

export const getShoppingState = (userId, weekStart) =>
  storage.findOne(K.SHOPPING_LISTS, (s) => s.userId === userId && s.weekStart === weekStart) || {
    userId,
    weekStart,
    checked: {},
    removed: [],
    customItems: [],
  };

const saveShoppingState = (userId, weekStart, updater) => {
  const existing = storage.findOne(K.SHOPPING_LISTS, (s) => s.userId === userId && s.weekStart === weekStart);
  const base = existing || { checked: {}, removed: [], customItems: [] };
  const next = updater({ checked: {}, removed: [], customItems: [], ...base });
  if (existing) return storage.update(K.SHOPPING_LISTS, existing.id, next);
  return storage.create(K.SHOPPING_LISTS, { ...next, userId, weekStart });
};

export const toggleShoppingItem = (userId, weekStart, key) =>
  saveShoppingState(userId, weekStart, (s) => ({ ...s, checked: { ...s.checked, [key]: !s.checked[key] } }));

export const removeShoppingItem = (userId, weekStart, key) =>
  saveShoppingState(userId, weekStart, (s) => {
    if (key.startsWith('custom:')) return { ...s, customItems: s.customItems.filter((c) => `custom:${c.id}` !== key) };
    return { ...s, removed: [...new Set([...s.removed, key])] };
  });

export const addCustomItem = (userId, weekStart, { name, quantity, unit }) => {
  const n = (name || '').trim();
  if (!n) throw new DomainError('Item name is required.', 'VALIDATION', { name: 'Enter an item name.' });
  if (n.length > 60) throw new DomainError('Item name is too long.', 'VALIDATION', { name: 'Keep it under 60 characters.' });
  const q = quantity === '' || quantity === undefined || quantity === null ? null : Number(quantity);
  if (q !== null && (Number.isNaN(q) || q <= 0)) throw new DomainError('Quantity must be a positive number.', 'VALIDATION', { quantity: 'Use a positive number.' });
  return saveShoppingState(userId, weekStart, (s) => ({ ...s, customItems: [...s.customItems, { id: generateId(), name: n, quantity: q, unit: unit || '' }] }));
};

export const clearCompleted = (userId, weekStart) =>
  saveShoppingState(userId, weekStart, (s) => {
    const checkedKeys = Object.keys(s.checked).filter((k) => s.checked[k]);
    return {
      ...s,
      removed: [...new Set([...s.removed, ...checkedKeys.filter((k) => !k.startsWith('custom:'))])],
      customItems: s.customItems.filter((c) => !s.checked[`custom:${c.id}`]),
      checked: {},
    };
  });

export const resetShoppingList = (userId, weekStart) =>
  storage.removeWhere(K.SHOPPING_LISTS, (s) => s.userId === userId && s.weekStart === weekStart);

const plannerService = {
  getMealPlan,
  getUpcomingPlans,
  setMealSlot,
  clearWeek,
  aggregateIngredients,
  getPlannedRecipeIds,
  getShoppingState,
  toggleShoppingItem,
  removeShoppingItem,
  addCustomItem,
  clearCompleted,
  resetShoppingList,
};

export default plannerService;
