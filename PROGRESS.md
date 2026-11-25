# PROGRESS.md — Élan Kitchen

_Last updated: 25 Nov 2026_

## Current phase
Phases 1–11 complete. Project is feature-complete and verified; in maintenance/hand-off.

## Completed modules
- Setup: Vite/React/Tailwind/ESLint/Vitest configs, folder structure, code-split routes.
- Design system, shared components, layouts (Public/User/Admin), navigation + mobile drawer.
- Storage service (CRUD, validation/repair, quota errors, memory fallback), seed data (30 approved + 3 pending + 1 rejected recipes, 10 users, reviews, collections, meal plans, logs).
- Auth: PBKDF2 signup/login, sessions (7-day), revalidation, blocked/deleted invalidation, route guards.
- Public pages, Explore, Recipe detail (scaling, cooking mode, share, print, reviews, related).
- User module: dashboard, favorites, collections, editor, my recipes, meal planner, shopping list, profile.
- Admin Studio: overview + charts, users, recipes, categories, reviews, activity log.
- Docs: README, CONTRIBUTING, TEAM_CONTRIBUTIONS (template), EVALUATION_CHECKLIST, TESTING, CLAUDE.md.

## Pending
- Team must create real GitHub branches/commits/PRs/reviews and fill `TEAM_CONTRIBUTIONS.md` (Criterion 5).
- Optional: initial commit (git initialised, nothing committed).

## Key decisions
- Deleting a user keeps their approved recipes, credited to "Élan Community"; pending/rejected are deleted.
- Corrupt storage keys are backed up to `<key>__corrupt_backup` and reset to `[]`; admin restored if missing.
- Admins are redirected away from member routes; favorites/collections/reviews are member-only.
- Seed photos are hotlinked from the Unsplash CDN, with a bundled SVG fallback.
- Session invalidation clears storage silently; `AuthContext.revalidate` shows the reason toast.

## Known issues
- `npm audit` advisories in dev tooling only.
- Not yet tested: screen readers, Firefox/Safari, meal-planner picker modal and password-change form (manual).
- Editing context files during `npm run dev` can throw HMR "must be used within Provider" errors; a full reload clears them.

## Test & build status
- `npm run lint`: clean. `npm test`: 44/44 pass. `npm run build`: success. `npm run preview`: deep links 200.
- 30 manual scenarios: all pass (see `TESTING.md`; #25 fixed during testing).

## Important locations
Services `src/services/`, seed `src/data/`, routes `src/routes/`, constants `src/utils/constants.js`, tests `tests/`, launch config `../.claude/launch.json`.

## Next task
Team: commit the initial code, push the five feature branches, and start the PR/review workflow per `CONTRIBUTING.md`.
