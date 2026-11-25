# CLAUDE.md — Élan Kitchen

On resume: read this file and `PROGRESS.md` first. Do not rebuild completed modules.

## Objective
Premium, fully functional community recipe platform "Élan Kitchen — Discover. Create. Savor." Frontend-only; all data in Local Storage. Targets Level 1 on all 5 academic criteria.

## Mandatory stack
React 18 + Vite 5, JS (ES6+), Tailwind 3, React Router 6, Lucide, Framer Motion, React Hot Toast, Recharts, Context API, Local Storage, Vitest, ESLint. **No backend, no external DB, no Firebase/Supabase.**

## Brand
Forest `#214E34`, dark `#153524`, ivory `#FAF8F3`, gold `#C6A66B`, terracotta `#C96D4B`, charcoal `#202620`, muted `#6B7280`. Headings Playfair Display, body Inter (self-hosted via @fontsource). Tokens in `tailwind.config.js`; component classes (`btn`, `card`, `input`, `chip`, `table-base`) in `src/index.css`. Editorial look, soft shadows, no heavy gradients/glassmorphism. Gold is decorative only (contrast).

## Architecture conventions
- Only `services/storageService.js` touches `localStorage`; it emits change events that contexts subscribe to.
- Domain logic lives in services (`auth`, `recipe`, `user`, `planner`, `activity`, `analytics`, `init`); services enforce permissions too, not just routes.
- Ratings/counts are derived from reviews/favorites — never stored.
- Deletes must cascade (`recipeService.cascadeDeleteRecipe`, `userService.deleteUser`).
- Contexts: `AppContext` (boot/init), `AuthContext` (session + revalidation), `RecipeContext` (derived data, `version` bump).
- Reuse `components/common` (Button, Modal, ConfirmDialog, EmptyState, RecipeImage, StarRating…) and `components/forms` (FormField, RecipeForm, ImageInput).
- Routes: `routes/AppRoutes.jsx` (lazy pages), `ProtectedRoute` (members; admins redirected), `AdminRoute`.
- IDs `crypto.randomUUID()`, ISO timestamps, keys `elan_*` (`utils/constants.js`).

## Core functionality
Public: home, explore (URL-driven filters), recipe detail (scaling, cooking mode, share, print, reviews), about/contact/privacy/404. Members: dashboard, favorites, collections, submit/edit (→ Pending), my recipes, reviews, meal planner, shopping list, profile. Admin Studio: stats + 5 charts, users, recipe moderation (mandatory reject reason), categories (reassign before delete), reviews, activity log.

## Rules
- PBKDF2 (Web Crypto) password hashing; never plaintext. Admin role never self-registrable.
- Seed only on first launch (`initService`); never reset user data.
- No placeholders, TODOs, lorem ipsum, hardcoded stats, fabricated tests or fabricated Git history.
- Before finishing a change: `npm run lint && npm test && npm run build`. Log real results in `TESTING.md`.
- Docs: README, CONTRIBUTING, TEAM_CONTRIBUTIONS, EVALUATION_CHECKLIST, TESTING.
