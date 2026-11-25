export const APP_NAME = 'Élan Kitchen';
export const APP_TAGLINE = 'Discover. Create. Savor.';
export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = Object.freeze({
  USERS: 'elan_users',
  SESSION: 'elan_session',
  RECIPES: 'elan_recipes',
  FAVORITES: 'elan_favorites',
  COLLECTIONS: 'elan_collections',
  REVIEWS: 'elan_reviews',
  CATEGORIES: 'elan_categories',
  MEAL_PLANS: 'elan_meal_plans',
  SHOPPING_LISTS: 'elan_shopping_lists',
  RECENTLY_VIEWED: 'elan_recently_viewed',
  PREFERENCES: 'elan_preferences',
  ACTIVITY_LOGS: 'elan_activity_logs',
  CONTACT_MESSAGES: 'elan_contact_messages',
  INITIALIZED: 'elan_initialized',
  SCHEMA_VERSION: 'elan_schema_version',
});

/** Keys whose value must be a JSON array. */
export const COLLECTION_KEYS = [
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.RECIPES,
  STORAGE_KEYS.FAVORITES,
  STORAGE_KEYS.COLLECTIONS,
  STORAGE_KEYS.REVIEWS,
  STORAGE_KEYS.CATEGORIES,
  STORAGE_KEYS.MEAL_PLANS,
  STORAGE_KEYS.SHOPPING_LISTS,
  STORAGE_KEYS.RECENTLY_VIEWED,
  STORAGE_KEYS.PREFERENCES,
  STORAGE_KEYS.ACTIVITY_LOGS,
  STORAGE_KEYS.CONTACT_MESSAGES,
];

export const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });
export const USER_STATUS = Object.freeze({ ACTIVE: 'active', BLOCKED: 'blocked' });
export const RECIPE_STATUS = Object.freeze({ PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' });

export const CUISINES = [
  'Indian',
  'Italian',
  'Asian',
  'Continental',
  'Mediterranean',
  'Middle Eastern',
  'American',
  'Mexican',
];

export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Non-Vegetarian',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
  'High-Protein',
  'Low-Carb',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const TIME_FILTERS = [
  { value: '', label: 'Any time' },
  { value: '15', label: 'Under 15 min' },
  { value: '30', label: 'Under 30 min' },
  { value: '60', label: 'Under 1 hour' },
  { value: '61', label: 'Over 1 hour' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'time', label: 'Quickest to cook' },
];

export const UNITS = ['', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece', 'clove', 'pinch', 'slice', 'can', 'bunch'];

export const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'snack', label: 'Snack' },
  { key: 'dinner', label: 'Dinner' },
];

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const PAGE_SIZE = 12;
export const MAX_RECENTLY_VIEWED = 12;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const FALLBACK_IMAGE = '/images/fallback-dish.svg';

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@elankitchen.example', password: 'ElanAdmin@123' },
  user: { email: 'demo@elankitchen.example', password: 'ElanUser@123' },
};

export const ACTIVITY_ACTIONS = Object.freeze({
  RECIPE_APPROVED: 'Recipe approved',
  RECIPE_REJECTED: 'Recipe rejected',
  RECIPE_DELETED: 'Recipe deleted',
  RECIPE_EDITED: 'Recipe edited',
  USER_BLOCKED: 'User blocked',
  USER_UNBLOCKED: 'User unblocked',
  USER_DELETED: 'User deleted',
  CATEGORY_CREATED: 'Category created',
  CATEGORY_UPDATED: 'Category updated',
  CATEGORY_DELETED: 'Category deleted',
  REVIEW_DELETED: 'Review removed',
});
