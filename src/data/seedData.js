/**
 * Builds the initial dataset written on the very first launch.
 * Relationships are wired with generated UUIDs; timestamps are relative
 * to "now" so analytics charts show a realistic recent history.
 */
import { ACTIVITY_ACTIONS, DEMO_ACCOUNTS, ROLES, USER_STATUS } from '../utils/constants';
import { addDays, generateId, getWeekStart, slugify } from '../utils/helpers';
import { SEED_MODERATION_RECIPES, SEED_RECIPES } from './seedRecipes';

export const SEED_CATEGORIES = [
  { slug: 'main-course', name: 'Main Course', description: 'Hearty curries, roasts and centre-of-the-table dishes.' },
  { slug: 'breakfast', name: 'Breakfast', description: 'Morning favourites, from dosas to overnight oats.' },
  { slug: 'appetizers', name: 'Appetizers', description: 'Small plates and starters to begin a meal.' },
  { slug: 'salads-bowls', name: 'Salads & Bowls', description: 'Fresh salads and wholesome grain bowls.' },
  { slug: 'rice-noodles', name: 'Rice & Noodles', description: 'Biryanis, risottos, fried rice and noodles.' },
  { slug: 'pasta-pizza', name: 'Pasta & Pizza', description: 'Italian classics and comforting bakes.' },
  { slug: 'desserts', name: 'Desserts', description: 'Cakes, sweets and indulgent treats.' },
  { slug: 'beverages', name: 'Beverages', description: 'Smoothies, shakes and warming drinks.' },
  { slug: 'soups', name: 'Soups', description: 'Broths, bisques and warming bowls.' },
];

/** Community members. `password` is only used to derive a hash at seed time. */
export const SEED_USERS = [
  { key: 'admin', name: 'Élan Studio Admin', email: DEMO_ACCOUNTS.admin.email, password: DEMO_ACCOUNTS.admin.password, role: ROLES.ADMIN, daysAgo: 200 },
  { key: 'demo', name: 'Aarav Mehta', email: DEMO_ACCOUNTS.user.email, password: DEMO_ACCOUNTS.user.password, role: ROLES.USER, daysAgo: 150, bio: 'Weekend cook, spice collector and dosa perfectionist.' },
  { key: 'priya', name: 'Priya Sharma', email: 'priya.sharma@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 175, bio: 'Home chef sharing recipes from my grandmother’s kitchen in Delhi.' },
  { key: 'marco', name: 'Marco Bellini', email: 'marco.bellini@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 172, bio: 'Pasta maker from Bologna. Butter is a food group.' },
  { key: 'aiko', name: 'Aiko Tanaka', email: 'aiko.tanaka@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 148, bio: 'Bento enthusiast and noodle obsessive.' },
  { key: 'sofia', name: 'Sofia Laurent', email: 'sofia.laurent@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 128, bio: 'Plant-forward Mediterranean cooking.' },
  { key: 'daniel', name: 'Daniel Brooks', email: 'daniel.brooks@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 138, bio: 'Meal-prep coach and brownie baker.' },
  { key: 'meera', name: 'Meera Nair', email: 'meera.nair@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 42 },
  { key: 'liam', name: 'Liam O’Connor', email: 'liam.oconnor@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 25, status: USER_STATUS.BLOCKED },
  { key: 'zara', name: 'Zara Ahmed', email: 'zara.ahmed@elankitchen.example', password: 'Community@123', role: ROLES.USER, daysAgo: 9 },
];

const REVIEW_TEXTS = {
  5: [
    'Absolutely delicious — the whole family asked for seconds. The instructions were clear and easy to follow.',
    'Restaurant quality at home. I will be making this again this weekend!',
    'Perfectly balanced flavours. This is now part of my regular rotation.',
    'Flawless recipe. Timings were spot on and the result looked just like the photo.',
  ],
  4: [
    'Really good! I added a little extra spice and it was fantastic.',
    'Lovely dish, came together quickly. Next time I will double the sauce.',
    'Great weeknight option — tasty and not too complicated.',
  ],
  3: [
    'Nice flavours, but it took longer than the stated time for me.',
    'Good base recipe. I needed to adjust the seasoning to my taste.',
  ],
  2: ['It was okay, but a bit too rich for me. Might try with less cream next time.'],
};

const daysAgoISO = (days, hourOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10 + (hourOffset % 9), (hourOffset * 7) % 60, 0, 0);
  return d.toISOString();
};

/**
 * @param {(user) => Promise<object>} buildUser async factory that returns a full
 *        user record (with hashed password) — injected so seeding uses exactly
 *        the same derivation path as signup.
 */
export const buildSeedData = async (buildUser) => {
  /* ---- categories ---- */
  const categories = SEED_CATEGORIES.map((c, i) => ({
    id: generateId(),
    name: c.name,
    slug: c.slug || slugify(c.name),
    description: c.description,
    createdAt: daysAgoISO(200 - i),
    updatedAt: daysAgoISO(200 - i),
  }));
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  /* ---- users (PBKDF2 hashes) ---- */
  const users = [];
  const userByKey = {};
  for (const u of SEED_USERS) {
    const createdAt = daysAgoISO(u.daysAgo, users.length);
    const record = await buildUser({ name: u.name, email: u.email, password: u.password, role: u.role, createdAt });
    record.status = u.status || USER_STATUS.ACTIVE;
    record.bio = u.bio || '';
    users.push(record);
    userByKey[u.key] = record;
  }
  const admin = userByKey.admin;

  /* ---- recipes ---- */
  const toRecipe = (r, idx, status = 'approved') => {
    const createdAt = daysAgoISO(r.daysAgo, idx);
    const reviewed = status !== 'pending' ? daysAgoISO(Math.max(r.daysAgo - 1, 0), idx + 2) : null;
    const [calories, protein, carbs, fat] = r.nutrition || [];
    return {
      id: generateId(),
      title: r.title,
      description: r.description,
      cuisine: r.cuisine,
      categoryId: catBySlug[r.category],
      dietary: r.dietary,
      difficulty: r.difficulty,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      image: r.image,
      ingredients: r.ingredients.map(([quantity, unit, name]) => ({ id: generateId(), name, quantity, unit })),
      steps: r.steps,
      nutrition: { calories: calories ?? null, protein: protein ?? null, carbs: carbs ?? null, fat: fat ?? null },
      tags: r.tags || [],
      authorId: userByKey[r.author].id,
      status,
      rejectionReason: r.rejectionReason || '',
      views: r.views || 0,
      submittedAt: createdAt,
      reviewedAt: reviewed,
      publishedAt: status === 'approved' ? reviewed : null,
      createdAt,
      updatedAt: reviewed || createdAt,
    };
  };
  const approved = SEED_RECIPES.map((r, i) => toRecipe(r, i));
  const moderation = SEED_MODERATION_RECIPES.map((r, i) => toRecipe(r, i + 40, r.status));
  const recipes = [...approved, ...moderation];
  const recipeByKey = Object.fromEntries([...SEED_RECIPES, ...SEED_MODERATION_RECIPES].map((r, i) => [r.key, recipes[i]]));

  /* ---- reviews: deterministic spread, one per user per recipe, never own recipe ---- */
  const reviewers = ['demo', 'priya', 'marco', 'aiko', 'sofia', 'daniel', 'meera', 'zara'];
  const ratingCycle = [5, 4, 5, 3, 4, 5, 4, 5, 2, 4, 5, 3];
  const reviews = [];
  let n = 0;
  approved.forEach((recipe, ri) => {
    const count = 1 + (ri % 4); // 1–4 reviews per recipe
    let added = 0;
    for (let k = 0; k < reviewers.length && added < count; k += 1) {
      const reviewer = userByKey[reviewers[(ri + k * 3) % reviewers.length]];
      if (reviewer.id === recipe.authorId) continue;
      if (reviews.some((rv) => rv.userId === reviewer.id && rv.recipeId === recipe.id)) continue;
      const rating = ratingCycle[n % ratingCycle.length];
      const texts = REVIEW_TEXTS[rating];
      const created = daysAgoISO(Math.max(1, Math.floor(SEED_RECIPES[ri].daysAgo * (0.2 + (k % 3) * 0.2))), n);
      reviews.push({
        id: generateId(),
        recipeId: recipe.id,
        userId: reviewer.id,
        rating,
        comment: texts[n % texts.length],
        createdAt: created,
        updatedAt: created,
      });
      n += 1;
      added += 1;
    }
  });

  /* ---- demo member data ---- */
  const demo = userByKey.demo;
  const favKeys = ['butter-chicken', 'margherita-pizza', 'thai-green-curry', 'tiramisu', 'quinoa-salad', 'dal-makhani'];
  const favorites = favKeys.map((k, i) => ({ id: generateId(), userId: demo.id, recipeId: recipeByKey[k].id, createdAt: daysAgoISO(30 - i * 3), updatedAt: daysAgoISO(30 - i * 3) }));
  // a few favourites from other members so popularity varies
  [['priya', 'margherita-pizza'], ['marco', 'butter-chicken'], ['aiko', 'chocolate-brownie'], ['sofia', 'butter-chicken'], ['daniel', 'paneer-butter-masala'], ['meera', 'masala-dosa'], ['zara', 'tiramisu']].forEach(([u, k], i) =>
    favorites.push({ id: generateId(), userId: userByKey[u].id, recipeId: recipeByKey[k].id, createdAt: daysAgoISO(20 - i), updatedAt: daysAgoISO(20 - i) }),
  );

  const col = (name, description, keys, cover, days) => ({
    id: generateId(),
    userId: demo.id,
    name,
    description,
    coverImage: recipeByKey[cover].image,
    recipeIds: keys.map((k) => recipeByKey[k].id),
    createdAt: daysAgoISO(days),
    updatedAt: daysAgoISO(days - 1),
  });
  const collections = [
    col('Weekend Specials', 'Slow, celebratory cooking for lazy weekends.', ['hyderabadi-veg-biryani', 'classic-lasagna', 'chole-bhature', 'blueberry-cheesecake'], 'hyderabadi-veg-biryani', 40),
    col('Healthy Living', 'Light, nourishing meals packed with veg and protein.', ['quinoa-salad', 'grilled-chicken-bowl', 'greek-salad', 'garlic-butter-salmon'], 'quinoa-salad', 35),
    col('Quick Breakfasts', 'On the table in 15 minutes or less.', ['avocado-toast', 'overnight-oats', 'mango-smoothie'], 'avocado-toast', 28),
    col('Family Favorites', 'Crowd-pleasers everyone at home loves.', ['butter-chicken', 'margherita-pizza', 'chocolate-brownie'], 'margherita-pizza', 22),
    col('Indian Classics', 'Timeless dishes from across India.', ['paneer-butter-masala', 'dal-makhani', 'masala-dosa', 'palak-paneer', 'gulab-jamun'], 'paneer-butter-masala', 15),
  ];

  const week = getWeekStart();
  const plan = (day, slot) => ({ day, slot });
  const planEntries = [
    [plan('Monday', 'breakfast'), 'overnight-oats'],
    [plan('Monday', 'dinner'), 'palak-paneer'],
    [plan('Tuesday', 'lunch'), 'quinoa-salad'],
    [plan('Tuesday', 'dinner'), 'teriyaki-chicken'],
    [plan('Wednesday', 'breakfast'), 'avocado-toast'],
    [plan('Wednesday', 'dinner'), 'thai-green-curry'],
    [plan('Thursday', 'snack'), 'mango-smoothie'],
    [plan('Friday', 'dinner'), 'margherita-pizza'],
    [plan('Saturday', 'lunch'), 'butter-chicken'],
    [plan('Sunday', 'breakfast'), 'masala-dosa'],
  ];
  const slots = {};
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((d) => {
    slots[d] = { breakfast: null, lunch: null, snack: null, dinner: null };
  });
  planEntries.forEach(([p, k]) => {
    slots[p.day][p.slot] = recipeByKey[k].id;
  });
  const mealPlans = [{ id: generateId(), userId: demo.id, weekStart: week, slots, createdAt: daysAgoISO(2), updatedAt: daysAgoISO(1) }];
  const nextWeekSlots = JSON.parse(JSON.stringify(slots));
  Object.keys(nextWeekSlots).forEach((d) => {
    nextWeekSlots[d] = { breakfast: null, lunch: null, snack: null, dinner: null };
  });
  nextWeekSlots.Monday.dinner = recipeByKey['dal-makhani'].id;
  nextWeekSlots.Wednesday.lunch = recipeByKey['grilled-chicken-bowl'].id;
  mealPlans.push({ id: generateId(), userId: demo.id, weekStart: addDays(week, 7), slots: nextWeekSlots, createdAt: daysAgoISO(1), updatedAt: daysAgoISO(1) });

  const recentlyViewed = [
    {
      id: generateId(),
      userId: demo.id,
      recipeIds: ['garlic-butter-salmon', 'korean-bibimbap', 'tiramisu', 'butter-chicken', 'greek-salad'].map((k) => recipeByKey[k].id),
      createdAt: daysAgoISO(3),
      updatedAt: daysAgoISO(0),
    },
  ];

  const preferences = [
    { id: generateId(), userId: demo.id, dietary: ['Vegetarian'], cuisines: ['Indian', 'Italian'], createdAt: daysAgoISO(100), updatedAt: daysAgoISO(100) },
  ];

  /* ---- activity history for the admin console ---- */
  const log = (days, action, entityType, entity, details = '') => ({
    id: generateId(),
    adminId: admin.id,
    adminName: admin.name,
    action,
    entityType,
    entityId: entity.id,
    entityName: entity.title || entity.name,
    details,
    createdAt: daysAgoISO(days),
  });
  const activityLogs = [
    log(11, ACTIVITY_ACTIONS.RECIPE_REJECTED, 'Recipe', recipeByKey['masala-chai-blend'], recipeByKey['masala-chai-blend'].rejectionReason),
    log(19, ACTIVITY_ACTIONS.RECIPE_APPROVED, 'Recipe', recipeByKey['gulab-jamun']),
    log(24, ACTIVITY_ACTIONS.USER_BLOCKED, 'User', { id: userByKey.liam.id, name: `${userByKey.liam.name} (${userByKey.liam.email})` }),
    log(29, ACTIVITY_ACTIONS.RECIPE_APPROVED, 'Recipe', recipeByKey['overnight-oats']),
    log(34, ACTIVITY_ACTIONS.RECIPE_APPROVED, 'Recipe', recipeByKey['strawberry-milkshake']),
    log(39, ACTIVITY_ACTIONS.RECIPE_APPROVED, 'Recipe', recipeByKey['garlic-butter-salmon']),
    log(60, ACTIVITY_ACTIONS.CATEGORY_CREATED, 'Category', { id: categories.find((c) => c.slug === 'soups').id, name: 'Soups' }),
  ];

  return {
    users,
    categories,
    recipes,
    reviews,
    favorites,
    collections,
    mealPlans,
    shoppingLists: [],
    recentlyViewed,
    preferences,
    activityLogs,
    contactMessages: [],
  };
};
