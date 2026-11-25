# Evaluation Checklist — Élan Kitchen

Maps each academic criterion (Level 1 — Excellent) to the implemented features, the source files and the steps to verify them. Test IDs refer to [TESTING.md](TESTING.md).

---

## Criterion 1 — React + Vite setup (10 marks)

| Requirement | Implementation | Source files | How to verify |
| --- | --- | --- | --- |
| Correct React + Vite configuration | React 18.3 + Vite 5.4 with `@vitejs/plugin-react`, vendor chunk splitting | `vite.config.js`, `package.json`, `index.html`, `src/main.jsx` | `npm run dev` → app at `localhost:5173` |
| Proper folder organisation | Modular `components/ layouts/ pages/ context/ hooks/ services/ routes/ data/ utils/` | `src/` | Compare with README → Folder structure |
| Compatible dependencies | Pinned stable versions, single lockfile | `package.json`, `package-lock.json` | `npm install` (Test #1) |
| Dev server runs | Vite dev server | — | `npm run dev` |
| Production build | Code-split build, route-level lazy loading | `src/routes/AppRoutes.jsx` | `npm run build` and `npm run preview` (Test #30) |
| No application-breaking errors | ESLint clean, error boundaries per route | `eslint.config.js`, `src/components/common/ErrorBoundary.jsx` | `npm run lint`; check DevTools console |

## Criterion 2 — UI design, navigation, login & signup (10 marks)

| Requirement | Implementation | Source files | How to verify |
| --- | --- | --- | --- |
| Premium, consistent brand | Forest/ivory/gold/terracotta palette, Playfair Display + Inter, soft shadows, SVG leaf+fork logo and favicon | `tailwind.config.js`, `src/index.css`, `src/components/common/Logo.jsx`, `public/favicon.svg` | Browse home, explore, detail |
| Responsive layouts | Mobile drawer, mobile tab nav, responsive grids and tables | `components/navigation/*`, `layouts/*` | Test #29 at 375/768/1024/1440 |
| Seamless navigation | React Router with nested layouts, active states, breadcrumbs, scroll restoration, URL-driven filters | `routes/AppRoutes.jsx`, `components/common/ScrollToTop.jsx`, `pages/public/ExplorePage.jsx` | Use back/forward after filtering |
| Functional signup | Name, email, password + confirm, visibility toggle, strength meter, terms, inline errors, duplicate check | `pages/auth/SignupPage.jsx`, `components/forms/PasswordField.jsx`, `PasswordStrength.jsx`, `utils/validation.js` | Tests #3–#5 |
| Functional login | Visibility toggle, invalid-credential and blocked-account messages, demo credentials panel | `pages/auth/LoginPage.jsx`, `services/authService.js` | Tests #6–#7, #24 |
| Meaningful error handling | Inline field errors, alerts, toasts, empty states, 404, “recipe not found” | `components/common/EmptyState.jsx`, `pages/public/NotFoundPage.jsx` | Visit `/nope`, `/recipes/xyz` |
| Protected routes | Member and admin guards with re-validation on navigation; guest-only login/signup | `routes/ProtectedRoute.jsx`, `routes/AdminRoute.jsx` | Test #10 |
| Accessibility | Labels, `aria-*`, focus-visible rings, skip link, accessible modals (focus trap, Esc), keyboard star rating, reduced motion | `components/common/Modal.jsx`, `StarRating.jsx`, `index.css` | Tab through forms and modals |

## Criterion 3 — Local Storage integration (10 marks)

| Requirement | Implementation | Source files | How to verify |
| --- | --- | --- | --- |
| Centralised storage service | `create / read / update / remove / findById / filterBy / removeWhere / updateWhere`, change events | `services/storageService.js` | `tests/storageService.test.js` |
| Namespaced keys | All 15 `elan_*` keys | `utils/constants.js` | DevTools → Application → Local Storage |
| UUIDs and ISO timestamps | `crypto.randomUUID()`, `createdAt` / `updatedAt` | `utils/helpers.js`, `storageService.create/update` | Inspect any record |
| Persistent sessions | `elan_session` with expiry, re-validated on navigation, focus and cross-tab events | `services/authService.js`, `context/AuthContext.jsx` | Test #8 |
| Hashed passwords | PBKDF2-SHA-256, 120k iterations, per-user salt, Web Crypto | `services/authService.js` | Inspect `elan_users`; Test #3 |
| Seed only on first launch | `elan_initialized` flag + existing-data guard; schema version | `services/initService.js`, `data/seedData.js`, `data/seedRecipes.js` | Test #2; reload → data unchanged |
| Data validation and repair | Invalid JSON / non-array keys backed up and reset; id-less records dropped; admin restored | `storageService.validateStoredData`, `initService.ensureAdminExists` | Test #28 |
| Quota and unavailable storage | Typed `QUOTA_EXCEEDED` error + toast; in-memory fallback | `storageService.write`, `context/AppContext.jsx` | `tests/storageService.test.js` quota test |
| Relationship integrity | Recipe delete cascades to favorites, reviews, collections, meal plans, recently viewed; user delete cleans personal data | `recipeService.cascadeDeleteRecipe`, `userService.deleteUser` | `tests/recipeService.test.js` cascade + user tests |
| User isolation | All personal records keyed by `userId`; ownership checks in services | `recipeService`, `plannerService`, `userService` | Collections test (other user cannot delete) |

## Criterion 4 — Admin & user module functionality (10 marks)

**User module**

| Feature | Source files | Verify |
| --- | --- | --- |
| Dashboard (stats, upcoming meals, recently viewed, favorites, recommendations, quick actions) | `pages/user/DashboardPage.jsx` | Log in as demo |
| Favorites with search | `pages/user/FavoritesPage.jsx`, `components/recipes/FavoriteButton.jsx` | Test #17 |
| Collections CRUD + covers | `pages/user/CollectionsPage.jsx`, `CollectionDetailPage.jsx`, `CollectionFormModal.jsx` | Test #18 |
| Recipe submission / edit (dynamic fields, image upload + compression) | `components/forms/RecipeForm.jsx`, `ImageInput.jsx`, `utils/image.js`, `pages/user/RecipeEditorPage.jsx` | Tests #12–#13 |
| My Recipes with status and rejection reason | `pages/user/MyRecipesPage.jsx` | Log in as demo → My Recipes |
| Ratings & reviews (one per user, edit/delete) | `components/recipes/ReviewSection.jsx`, `recipeService.upsertReview` | Tests #19–#20 |
| Serving scaling + cooking mode | `pages/public/RecipeDetailPage.jsx`, `components/recipes/CookingMode.jsx` | Detail page → ± servings, Start cooking |
| Weekly meal planner | `pages/user/MealPlannerPage.jsx`, `services/plannerService.js` | Test #21 |
| Shopping list | `pages/user/ShoppingListPage.jsx`, `plannerService.aggregateIngredients` | Test #22 |
| Profile & settings | `pages/user/ProfilePage.jsx`, `userService.updateProfile`, `authService.changePassword` | Test #23 |

**Admin module (Élan Kitchen Studio)**

| Feature | Source files | Verify |
| --- | --- | --- |
| Dynamic statistics + 5 Recharts charts | `pages/admin/AdminDashboardPage.jsx`, `services/analyticsService.js` | Test #26 |
| User management (search, filter, view, block/unblock/delete, self-protection) | `pages/admin/AdminUsersPage.jsx`, `services/userService.js` | Test #24 |
| Recipe moderation (approve, reject with reason, edit, delete, filters) | `pages/admin/AdminRecipesPage.jsx`, `recipeService.approveRecipe/rejectRecipe` | Tests #14–#16 |
| Category management (duplicates, counts, reassign-before-delete) | `pages/admin/AdminCategoriesPage.jsx`, `recipeService.*Category` | Test #27 |
| Review moderation | `pages/admin/AdminReviewsPage.jsx` | Delete a review → rating updates |
| Activity logs | `pages/admin/AdminActivityPage.jsx`, `services/activityService.js` | Approve/reject → see log |
| Role-based behaviour | Admin-only routes, admins cannot self-register, member-only actions hidden for admins | `routes/AdminRoute.jsx`, `authService.signup` | Test #10; `cannot self-register as admin` unit test |

## Criterion 5 — Team collaboration (target 10 marks)

> This criterion depends on **genuine team activity on GitHub**, which cannot be produced by code generation. The repository contains the scaffolding; the team must supply the evidence.

| Requirement | Provided in repository | Team must do |
| --- | --- | --- |
| Clearly distributed responsibilities | Five areas with owners and branch names in `README.md` and `CONTRIBUTING.md` | Assign real names |
| GitHub branches | Branch naming convention and the five feature branch names | Create and push branches from each member's account |
| Meaningful commits | Conventional Commits standard with examples | Commit work in small, descriptive commits |
| Pull requests | PR workflow and template | Open PRs from feature branches into `main` |
| Code reviews | Review checklist | Each member reviews at least one other PR |
| Individual contributions | `TEAM_CONTRIBUTIONS.md` template | Fill in links to real commits, PRs and reviews |
| Project documentation | `README.md`, `CONTRIBUTING.md`, `TESTING.md`, this checklist | Keep updated; append re-test results |

---

### Quick demo script for evaluators (≈5 minutes)

1. `npm install && npm run dev` → open `http://localhost:5173`.
2. Browse home → Explore → filter *Indian + Vegetarian + Under 1 hour* → open a recipe → change servings → Start cooking.
3. Log in as **demo@elankitchen.example / ElanUser@123** → Dashboard → submit a recipe → see it Pending in My Recipes → open Meal Planner and Shopping List.
4. Log out, log in as **admin@elankitchen.example / ElanAdmin@123** → Overview charts → Recipes → approve the new recipe → check Activity log.
5. Log out → Explore shows the newly approved recipe publicly.
