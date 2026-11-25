# Élan Kitchen

> **Discover. Create. Savor.**

Élan Kitchen is a community-driven culinary platform where people discover, create, save, organise, rate, review and share recipes, and plan their meals for the week. It is a **frontend-only React application**: every feature runs in the browser and persists to **Local Storage**. There is no backend server or external database.

---

## Contents

1. [Project objectives](#project-objectives)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Getting started](#getting-started)
5. [Demo credentials](#demo-credentials)
6. [Architecture overview](#architecture-overview)
7. [Folder structure](#folder-structure)
8. [User module](#user-module)
9. [Admin module (Élan Kitchen Studio)](#admin-module-élan-kitchen-studio)
10. [Local Storage schema](#local-storage-schema)
11. [Testing](#testing)
12. [Team responsibilities & GitHub workflow](#team-responsibilities--github-workflow)
13. [Academic evaluation mapping](#academic-evaluation-mapping)
14. [Security limitations](#security-limitations)
15. [Future enhancements](#future-enhancements)

---

## Project objectives

- Deliver a polished, editorial-style recipe platform that feels like a commercial product.
- Demonstrate a well-structured React + Vite codebase with reusable components, context-based state and a service layer.
- Implement complete CRUD, authentication, role-based access and moderation on top of Local Storage.
- Meet all five academic evaluation criteria (see [EVALUATION_CHECKLIST.md](EVALUATION_CHECKLIST.md)).

## Features

**Public (guests)**
- Landing page with hero search, live community stats, popular cuisines, trending, quick & easy, healthy and featured community recipes, “how it works” and a sign-up call to action. All sections are computed from stored data.
- Explore page: search by name **and** by ingredients (comma-separated), filters for cuisine, dietary preference, difficulty, total time, category and minimum rating (all combinable), four sort orders, active-filter chips, “Clear all”, result count, “Load more” pagination, empty state and a mobile filter drawer. Filters live in the URL, so results can be shared and browser back/forward works.
- Recipe detail: hero image, author, rating summary, prep/cook/total time, difficulty, servings, dietary badges, ingredients that **rescale with servings**, step-by-step method, nutrition per serving, tags, ratings & reviews, related recipes, Share (Web Share API or clipboard), Print (print stylesheet) and a full-screen **Cooking mode** with step progress and an ingredient checklist.
- About, Contact (messages are saved locally; the page says so), Privacy and a custom 404.

**Registered users**
- Dashboard: greeting, counts (saved, collections, submitted, approved, pending), quick actions, upcoming meals, recently viewed, favorites and preference-based recommendations.
- Favorites (search & sort), Collections (create, rename, describe, pick a cover from recipes / URL / upload, add/remove recipes, delete).
- Recipe submission with dynamic ingredients and steps, reorderable steps, image URL **or** compressed local upload (JPG/PNG/WebP, ≤ 5 MB), optional nutrition and tags. New and edited recipes go to **Pending**.
- My Recipes with status tabs, submission date, rating, rejection feedback, edit and delete.
- One rating and review per recipe (edit/delete own); averages are always derived from reviews.
- Weekly meal planner (7 days × breakfast/lunch/snack/dinner) with week navigation, replace/remove and clear-week confirmation.
- Shopping list generated from the selected week: aggregation of matching ingredients (g↔kg and ml↔l convert; incompatible units are never merged), checkboxes, custom items, remove, clear completed, reset and print.
- Profile & settings: name, email (duplicate-checked), bio, profile picture upload, dietary and cuisine preferences, password change (requires current password), logout.

**Administrators** – see [Admin module](#admin-module-élan-kitchen-studio).

## Technology stack

| Concern | Choice |
| --- | --- |
| UI library | React 18.3 |
| Build tool / dev server | Vite 5.4 |
| Routing | React Router DOM 6.28 |
| Styling | Tailwind CSS 3.4 (custom brand theme) |
| Icons | Lucide React |
| Animation | Framer Motion 11 (respects `prefers-reduced-motion`) |
| Notifications | React Hot Toast |
| Charts | Recharts 2.13 |
| State | React Context API (`AppContext`, `AuthContext`, `RecipeContext`) |
| Persistence | Browser Local Storage via `storageService` |
| Password hashing | Web Crypto API — PBKDF2-SHA-256, 120,000 iterations, random 16-byte salt |
| Fonts | Playfair Display & Inter (self-hosted via `@fontsource`) |
| Tests | Vitest |
| Linting | ESLint 9 (flat config) with React, Hooks and Refresh plugins |

## Getting started

Requirements: **Node.js 18+** (developed on Node 24) and npm.

```bash
npm install
npm run dev       # start the dev server at http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

Additional commands:

```bash
npm run lint      # ESLint over the whole project
npm test          # run the Vitest unit test suite once
npm run test:watch
```

On first launch the app seeds its data (≈1 second while demo passwords are hashed). Subsequent launches never overwrite your data. To start completely fresh, clear this site’s storage in your browser’s developer tools.

> The app uses `crypto.subtle`, which browsers only expose in a secure context. `localhost` counts as secure; if you host it elsewhere, use HTTPS.

## Demo credentials

These accounts are created on first launch, with passwords hashed through the same PBKDF2 path as normal sign-ups. They are for **local academic demonstrations only** and are also shown on the login page.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@elankitchen.example` | `ElanAdmin@123` |
| Registered user | `demo@elankitchen.example` | `ElanUser@123` |

Other seeded community members (Priya, Marco, Aiko, Sofia, Daniel, Meera, Zara, and the blocked account Liam) use the password `Community@123`.

## Architecture overview

```
 UI (pages + components)
        │  read derived data / call actions
        ▼
 Context layer ── AppContext   (boot, storage health, UI state)
                  AuthContext  (session, login/signup/logout, revalidation)
                  RecipeContext(recipes, reviews, favorites, collections, categories, users)
        │  call domain services
        ▼
 Service layer ── authService · recipeService · userService · plannerService
                  activityService · analyticsService · initService
        │  CRUD through one gateway
        ▼
 storageService ── JSON (de)serialisation, validation & repair, quota errors,
                   in-memory fallback, change events
        ▼
 window.localStorage (elan_* keys)
```

- **Single gateway to storage.** Only `storageService` touches `localStorage`. It emits `change` events that contexts subscribe to, so the UI re-renders after any write; it also listens for cross-tab `storage` events.
- **Derived data.** Ratings, review counts, favourite counts and popularity are computed from reviews and favourites, so they can never drift out of sync.
- **Referential integrity.** Deleting a recipe removes its favourites, reviews, collection references, meal-plan slots and recently-viewed entries. Deleting a user removes their personal data and handles their recipes (see [User management](#admin-module-élan-kitchen-studio)).
- **Route protection.** `ProtectedRoute` (members) and `AdminRoute` (administrators) re-validate the session on every navigation. Blocked or deleted accounts are signed out immediately with an explanatory message.
- **Code splitting.** Every route except the landing page is lazy-loaded; React, Recharts and Framer Motion are split into separate vendor chunks.
- **Resilience.** Error boundaries per route, graceful image fallbacks, invalid-JSON recovery, quota-exceeded toasts and an in-memory fallback when Local Storage is unavailable.

## Folder structure

```
elan-kitchen/
├── public/
│   ├── images/fallback-dish.svg     # graceful image fallback
│   └── favicon.svg                  # leaf + fork brand mark
├── src/
│   ├── components/
│   │   ├── common/      # Button, Modal, ConfirmDialog, EmptyState, Skeleton, RecipeImage,
│   │   │                # StarRating, Badge, Avatar, Logo, ErrorBoundary, PageHeader…
│   │   ├── recipes/     # RecipeCard, RecipeGrid, RecipeFilters, ReviewSection, CookingMode,
│   │   │                # FavoriteButton, AddToCollectionModal, RecipePickerModal, RecipeSection
│   │   ├── forms/       # FormField, PasswordField, PasswordStrength, ImageInput, TagInput, RecipeForm
│   │   ├── navigation/  # Navbar, UserMenu, Footer, SidebarNav (+ MobileTabNav)
│   │   └── dashboard/   # StatCard, ChartCard
│   ├── layouts/         # PublicLayout, UserLayout, AdminLayout
│   ├── pages/
│   │   ├── public/      # Home, Explore, RecipeDetail, About, Contact, Privacy, NotFound
│   │   ├── auth/        # Login, Signup
│   │   ├── user/        # Dashboard, Favorites, Collections, CollectionDetail, MyRecipes,
│   │   │                # RecipeEditor, MealPlanner, ShoppingList, Profile
│   │   └── admin/       # AdminDashboard, AdminUsers, AdminRecipes, AdminCategories,
│   │                    # AdminReviews, AdminActivity
│   ├── context/         # AppContext, AuthContext, RecipeContext
│   ├── hooks/           # usePageTitle, useDebounce, useRequireAuthAction
│   ├── services/        # storage, auth, recipe, user, planner, activity, analytics, init
│   ├── routes/          # AppRoutes, ProtectedRoute, AdminRoute
│   ├── data/            # seedData.js, seedRecipes.js
│   ├── utils/           # constants, validation, helpers, image
│   ├── App.jsx · main.jsx · index.css
├── tests/               # Vitest unit tests + Local Storage test setup
├── CONTRIBUTING.md · TEAM_CONTRIBUTIONS.md · EVALUATION_CHECKLIST.md · TESTING.md
├── eslint.config.js · tailwind.config.js · postcss.config.js · vite.config.js
└── index.html · package.json
```

## User module

| Route | Purpose |
| --- | --- |
| `/user/dashboard` | Personal overview, stats, upcoming meals, recently viewed, favorites, recommendations |
| `/user/favorites` | Saved recipes with search and sort |
| `/user/collections`, `/user/collections/:id` | Themed collections with cover images |
| `/user/recipes` | Submission status tracking (Pending / Approved / Rejected + feedback) |
| `/user/recipes/new`, `/user/recipes/:id/edit` | Recipe editor (editing an approved recipe re-queues it for review) |
| `/user/meal-planner` | Weekly planner, `?week=YYYY-MM-DD` for other weeks |
| `/user/shopping-list` | Aggregated list for the selected week |
| `/user/profile` | Profile, preferences, password, logout |

## Admin module (Élan Kitchen Studio)

| Route | Purpose |
| --- | --- |
| `/admin/dashboard` | 9 live statistics, 5 Recharts charts (registrations, submissions vs approvals, status distribution, popular cuisines, top-rated), moderation queue, recent activity |
| `/admin/recipes` | Search; filter by status, cuisine and category; approve; reject with a **mandatory reason**; edit (`/admin/recipes/:id/edit`); delete |
| `/admin/users` | Search and filter; user ID, name, email, role, registration date, status, recipe count; details modal; block, unblock and delete regular users. Admins cannot block or delete themselves or other admins. |
| `/admin/categories` | Create, rename and describe categories; case-insensitive duplicate prevention; recipe counts; deleting a category in use requires reassigning its recipes first |
| `/admin/reviews` | Search and filter by rating; delete inappropriate reviews (ratings recalculate instantly) |
| `/admin/activity` | Log of approvals, rejections, deletions, edits, user and category changes and review moderation, with administrator, entity, details and timestamp |

**When a user is deleted:** their favourites, collections, reviews, meal plans, shopping lists, preferences and recently-viewed history are removed; their pending and rejected recipes are deleted with full cascade; their approved recipes stay published under “Élan Community” so other members’ favourites and plans keep working.

## Local Storage schema

All keys are namespaced with `elan_`. Records use `crypto.randomUUID()` IDs and ISO-8601 `createdAt` / `updatedAt` timestamps.

| Key | Shape |
| --- | --- |
| `elan_users` | `{ id, name, email, passwordHash, passwordSalt, passwordIterations, role: 'user'\|'admin', status: 'active'\|'blocked', avatar, bio, createdAt, updatedAt }[]` |
| `elan_session` | `{ token, userId, role, createdAt, expiresAt }` (7-day expiry) |
| `elan_recipes` | `{ id, title, description, cuisine, categoryId, dietary[], difficulty, prepTime, cookTime, servings, image, ingredients: [{ id, name, quantity\|null, unit }], steps[], nutrition: { calories, protein, carbs, fat }, tags[], authorId, status, rejectionReason, views, submittedAt, reviewedAt, publishedAt, createdAt, updatedAt }[]` |
| `elan_favorites` | `{ id, userId, recipeId, createdAt }[]` |
| `elan_collections` | `{ id, userId, name, description, coverImage, recipeIds[], createdAt, updatedAt }[]` |
| `elan_reviews` | `{ id, recipeId, userId, rating (1–5), comment, createdAt, updatedAt }[]` (unique per user+recipe) |
| `elan_categories` | `{ id, name, slug, description, createdAt, updatedAt }[]` |
| `elan_meal_plans` | `{ id, userId, weekStart: 'YYYY-MM-DD' (Monday), slots: { Monday: { breakfast, lunch, snack, dinner }, … } }[]` |
| `elan_shopping_lists` | `{ id, userId, weekStart, checked: { [itemKey]: bool }, removed: itemKey[], customItems: [{ id, name, quantity, unit }] }[]` |
| `elan_recently_viewed` | `{ id, userId, recipeIds[] }[]` (most recent first, max 12) |
| `elan_preferences` | `{ id, userId, dietary[], cuisines[] }[]` |
| `elan_activity_logs` | `{ id, adminId, adminName, action, entityType, entityId, entityName, details, createdAt }[]` (newest first, max 500) |
| `elan_contact_messages` | `{ id, userId\|null, name, email, subject, message, createdAt }[]` |
| `elan_initialized` | `true` once seeding has completed |
| `elan_schema_version` | `1` (used for future migrations) |

**Initialisation rules** (`services/initService.js`): seed data is written only when `elan_initialized` is absent **and** no user/recipe data exists. Every later launch validates each collection key. Invalid JSON or non-array values are backed up to `<key>__corrupt_backup` and reset to `[]`, and records without an `id` are dropped. If no administrator account exists, the demo admin is restored.

## Testing

```bash
npm test
```

44 automated Vitest tests cover the storage CRUD layer, invalid-JSON and quota handling, authentication (hashing, duplicates, blocking, sessions, password change), recipe moderation and permissions, cascade deletes, reviews and dynamic averages, favourites, collections, search and filters, categories, user management, the meal planner, shopping-list aggregation and analytics. The full manual test log is in [TESTING.md](TESTING.md).

## Team responsibilities & GitHub workflow

| Member | Area | Branch |
| --- | --- | --- |
| Member 1 | Project architecture: Vite config, folder structure, routing, shared components | `feature/project-architecture` |
| Member 2 | UI & authentication: brand design, homepage, navigation, login/signup, validation, responsive layouts | `feature/ui-authentication` |
| Member 3 | Local Storage: storage service, CRUD, auth persistence, seed data, validation, error handling | `feature/local-storage` |
| Member 4 | User module: discovery, submissions, favorites, collections, reviews, meal planner, shopping list | `feature/user-module` |
| Member 5 | Admin module: dashboard, user management, moderation, categories, reviews, analytics, activity logs | `feature/admin-module` |

The workflow (branch naming, Conventional Commits, pull requests, reviews, merge-conflict handling) is described in [CONTRIBUTING.md](CONTRIBUTING.md). Record each member’s real contributions in [TEAM_CONTRIBUTIONS.md](TEAM_CONTRIBUTIONS.md). Each member must commit from their own GitHub account; this repository deliberately contains no fabricated history.

## Academic evaluation mapping

See [EVALUATION_CHECKLIST.md](EVALUATION_CHECKLIST.md) for a criterion-by-criterion mapping to features, source files and verification steps.

## Security limitations

This project implements **academic demonstration authentication**, not production-grade security:

- Local Storage is fully readable and writable by anyone with access to the browser (or by any script on the same origin). A user could edit their own role or status in DevTools; client-side route guards cannot prevent that.
- PBKDF2 hashing prevents casual exposure of passwords, but the hashes and salts are still stored client-side and could be attacked offline.
- There is no email verification, password recovery, rate limiting or server-side session invalidation.
- Uploaded images are stored as data URLs and count against the ~5 MB Local Storage quota.

A production version would move authentication, authorisation and persistence to a server with a real database, HTTPS-only cookies and server-side validation.

## Future enhancements

- Server API and database with real authentication (OAuth / passwordless) and authorisation.
- Image hosting/CDN with automatic resizing instead of data URLs.
- Unit conversion across systems (cups ↔ ml) and pantry-aware shopping lists.
- Recipe import from URLs, nutrition auto-calculation and allergen tagging.
- Social features: follow cooks, comments on reviews, notifications.
- Component and end-to-end tests (React Testing Library, Playwright) running in CI.
- Internationalisation and a dark theme.

---

Food photography: [Unsplash](https://unsplash.com/license) contributors, loaded from the Unsplash image CDN as recommended by Unsplash’s guidelines. Every image falls back to a bundled illustration if it cannot load.
