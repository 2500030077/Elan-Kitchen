# Testing — Élan Kitchen

This document records the test cases for the 30 required scenarios, what was expected and what **actually** happened when they were run.

- **Test run date:** 25 Nov 2026
- **Run by:** AI coding assistant during initial development (team members should re-run and append their own results below)
- **Environment:** macOS, Node.js 24.4.1, npm 11.5.1, Vite 5.4 dev server (`localhost:5173`) and `vite preview` (`localhost:4173`), Chromium-based in-app browser
- **Method key:** **A** = automated Vitest test, **M** = manual browser test, **A+M** = both

## Automated tests

```bash
npm test
```

Result of the latest run:

```
 ✓ tests/validation.test.js (7 tests)
 ✓ tests/storageService.test.js (6 tests)
 ✓ tests/recipeService.test.js (22 tests)
 ✓ tests/authService.test.js (9 tests)
 Test Files  4 passed (4)
      Tests  44 passed (44)
```

Also run: `npm run lint` → no errors or warnings. `npm run build` → success (built in ~1.5 s).

## Scenario results

| # | Scenario | Steps | Expected result | Actual result | Method | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Fresh application installation | `npm install` in a clean folder | Dependencies install with no unresolved peers | Installed successfully. `npm audit` reports advisories in dev tooling (see Known issues) | M | ✅ Pass |
| 2 | First-time seed initialisation | Open app with empty storage | 30+ approved recipes, categories, demo accounts seeded once; `elan_initialized=true` | 30 approved + 3 pending + 1 rejected recipes, 9 categories, 10 users seeded; homepage sections populated. Test “does not reseed or overwrite data” passes | A+M | ✅ Pass |
| 3 | Successful user registration | Signup with valid name, new email, `TestCook123`, accept terms | Account created as `user`, session started, redirect to dashboard | Redirected to `/user/dashboard`; stored role `user`; hash present; plaintext not stored | A+M | ✅ Pass |
| 4 | Duplicate email prevention | Signup with `DEMO@elankitchen.example` | “An account with this email already exists.” (case-insensitive) | Inline error shown; unit test confirms service rejects `COOK@example.COM` vs `cook@example.com` | A+M | ✅ Pass |
| 5 | Invalid signup validation | Submit weak password, mismatched confirm, unchecked terms | Inline errors for each field | Errors shown: password length, mismatch, terms; strength meter showed “Too weak” | A+M | ✅ Pass |
| 6 | Successful login | Log in with each demo account | Member → `/user/dashboard`, admin → `/admin/dashboard` | Both redirected correctly with welcome toast | A+M | ✅ Pass |
| 7 | Invalid password handling | Log in with demo email + `WrongPass1` | Generic “Invalid email or password.” | Alert shown; no session created | A+M | ✅ Pass |
| 8 | Login persistence after refresh | Log in, reload `/user/recipes` | Still signed in | Page reloaded signed in; `elan_session` intact | M | ✅ Pass |
| 9 | Logout | Use account menu → Log out | Session cleared, return to home | `elan_session` = null, redirected to `/` | A+M | ✅ Pass |
| 10 | Unauthorised admin route prevention | As guest open `/user/dashboard`; as member open `/admin/users` | Guest → login; member → own dashboard with notice | Guest redirected to `/login`; member redirected to `/user/dashboard` with “That area is restricted to administrators.” | M | ✅ Pass |
| 11 | Recipe search and filtering | Search “paneer”; apply Indian + Vegetarian + Under 1 hour + sort by rating | Combined filters narrow results; count updates | “paneer” → 2 results; combined filters → 6 correct recipes; filters reflected in URL and chips | A+M | ✅ Pass |
| 12 | Recipe submission | Submit empty form, then complete “Lemon Coriander Soup” | Validation errors, then saved as Pending | 11 field errors on empty submit; valid submit saved as Pending and listed in My Recipes | A+M | ✅ Pass |
| 13 | Recipe editing and deletion | Owner edits approved “Lemon Coriander Soup” title; deletes it from My Recipes; non-owner edit/delete via service | Edit → Pending; delete asks for confirmation and cascades; non-owner blocked | UI edit saved new title and status changed approved → pending (live-recipe warning shown). UI delete showed confirmation, removed the recipe and another member’s favourite of it. Non-owner checks pass in unit tests | A+M | ✅ Pass |
| 14 | Admin recipe approval | Admin approves “Lemon Coriander Soup” | Status Approved, logged | Toast “now live”; activity log entry “Recipe approved” | A+M | ✅ Pass |
| 15 | Admin recipe rejection | Reject “Basil Pesto Pasta” with empty reason, then with reason | Empty reason blocked; reason stored and logged | “Reason must be at least 10 characters.”; then rejected and logged with the reason | A+M | ✅ Pass |
| 16 | Public visibility of approved recipes | Check Explore after approval | Newly approved recipe appears; pending ones do not | Explore count rose from 30 to 31 and included the soup; pending recipes return “not found” for guests | A+M | ✅ Pass |
| 17 | Favourite recipe persistence | Toggle heart three times; reload | One favourite, no duplicates, persists | One favourite stored, button `aria-pressed=true`; demo favourites still shown after reload | A+M | ✅ Pass |
| 18 | Collection creation and deletion | Create “Sunday Brunch”; delete a collection | Created and listed; deletion removes it | Created via modal with toast; deleted “Quick Breakfasts” via options menu + confirmation (5 → 4 cards, removed from storage) | A+M | ✅ Pass |
| 19 | Rating and review updates | Edit demo review on Paneer Butter Masala to 3★ | Review updated, marked “edited” | Updated instantly, “just now · edited” | A+M | ✅ Pass |
| 20 | Dynamic average rating calculation | Same as #19; unit test with add/edit/delete | Average recalculates immediately | Summary changed 5.0 → 3.0; unit test checks 3.5 → 3 → 2 sequence | A+M | ✅ Pass |
| 21 | Meal plan persistence | View seeded plan after reload; assign/clear via service | Plan persists per user/week | Seeded 10 meals displayed after reload; set/clear verified in unit tests. Picking a recipe through the modal was not manually exercised | A+M | ✅ Pass |
| 22 | Shopping list generation | Open shopping list for current week | Ingredients aggregated; incompatible units separate | 78 items; e.g. 700 g + 700 g chicken thighs → 1.4 kg; “200 g” and “6” cherry tomatoes kept separate; unit test checks kg/g merge vs tbsp | A+M | ✅ Pass |
| 23 | Profile updates | Change email to another member’s address; then update name | Duplicate email rejected; name saved | “Another account already uses this email.”; name saved as “Aarav K. Mehta” and sidebar updated immediately | A+M | ✅ Pass |
| 24 | User blocking and unblocking | Admin blocks demo member; blocked login attempt | Status blocked; login refused | Status `blocked`; login shows “This account has been blocked…”. Unblock verified in unit tests | A+M | ✅ Pass |
| 25 | Blocked user session invalidation | Member signed in; account becomes blocked; navigate | Signed out with message | **Initially failed:** redirect worked but the explanatory toast was missing. Fixed in `AuthContext`/`authService`; re-test redirected to `/login`, session cleared, toast “Your account has been blocked…” | A+M | ✅ Pass (after fix) |
| 26 | Admin analytics updates | Compare stats before/after submitting a recipe | Pending count increments; charts from data | Unit test confirms +1 pending; dashboard showed 9 stats and 5 rendered charts | A+M | ✅ Pass |
| 27 | Category management | Duplicate name; delete in-use “Soups”; reassign | Duplicate blocked; in-use deletion requires reassignment | Delete dialog required a target (“Choose a category…”); duplicate/reassign/unused delete verified in unit tests | A+M | ✅ Pass |
| 28 | Invalid Local Storage data handling | Set `elan_recipes` to `{this is not json`, reload | No crash; key repaired and backed up | App loaded; `elan_recipes` reset to `[]`; raw value kept in `elan_recipes__corrupt_backup`; other data intact | A+M | ✅ Pass |
| 29 | Responsive mobile navigation | 375 px: open menu; check overflow at 375/768/1024/1440 | Drawer works; no horizontal overflow | Drawer opened with links and actions; `scrollWidth == viewport` on tested pages at all four widths; admin tables scroll inside their container | M | ✅ Pass |
| 30 | Successful production build | `npm run build`, `npm run preview` | Build succeeds; deep links served | Build succeeded; preview returned 200 for `/`, `/explore`, `/admin/users`, `/recipes/abc` | M | ✅ Pass |

## Additional checks performed

| Check | Result |
| --- | --- |
| Nonexistent recipe ID (`/recipes/does-not-exist`) | “We couldn’t find that recipe” empty state |
| Unknown route | Custom 404 “This dish isn’t on the menu” |
| Serving scaling (Paneer 4 → 6 servings) | 400 g → 600 g; count items round sensibly |
| Admin cannot block/delete own account | No action buttons rendered for own row; service also throws |
| Console errors on homepage | None |

## Known issues / not yet verified

- `npm audit` reports advisories in development-only dependencies (Vite/esbuild dev server). They do not affect the static production build; upgrade when moving to Vite 6+.
- Screen-reader testing with a real assistive technology (VoiceOver/NVDA) has **not** been performed; accessibility was checked via semantics, labels and keyboard paths only.
- Cross-browser testing beyond Chromium (Firefox, Safari) has **not** been performed.
- Picking a recipe through the meal-planner modal and the password-change form were not exercised manually (both are covered by unit tests).

## Re-test log (team)

| Date | Tester | Scenarios | Result | Notes |
| --- | --- | --- | --- | --- |
| | | | | |
