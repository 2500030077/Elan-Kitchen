# Contributing to Élan Kitchen

This guide describes how our five-member team collaborates on Élan Kitchen. Everyone works from their **own GitHub account** so the commit history honestly reflects each person's contributions.

## 1. Getting set up

```bash
git clone <repository-url>
cd elan-kitchen
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
```

All three must pass.

## 2. Branch naming

| Type | Pattern | Example |
| --- | --- | --- |
| Feature area (long-lived per member) | `feature/<area>` | `feature/admin-module` |
| Individual task | `feature/<area>-<short-task>` | `feature/user-module-shopping-list` |
| Bug fix | `fix/<short-description>` | `fix/blocked-session-toast` |
| Documentation | `docs/<topic>` | `docs/testing-results` |
| Refactor / chore | `chore/<topic>` | `chore/eslint-config` |

Assigned feature branches:

| Member | Responsibility | Branch |
| --- | --- | --- |
| Member 1 | Project architecture — Vite/React configuration, folder structure, routing, shared components, layouts | `feature/project-architecture` |
| Member 2 | UI & authentication — brand design system, homepage, navigation, login, signup, form validation, responsive layouts | `feature/ui-authentication` |
| Member 3 | Local Storage — `storageService`, CRUD, auth persistence, seed data, data validation, error handling | `feature/local-storage` |
| Member 4 | User module — recipe discovery, submissions, favorites, collections, ratings & reviews, meal planner, shopping list | `feature/user-module` |
| Member 5 | Admin module — Studio dashboard, user management, recipe moderation, categories, review moderation, analytics, activity logs | `feature/admin-module` |

`main` is protected: it only changes through reviewed pull requests.

## 3. Commit message standard

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary, ≤ 72 chars>

<optional body: what and why, wrapped at 72 chars>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`.
Scopes: `auth`, `storage`, `recipes`, `explore`, `planner`, `shopping`, `admin`, `ui`, `routing`, `seed`, `docs`.

Examples:

```
feat(planner): add week navigation to meal planner
fix(auth): invalidate sessions of blocked users on navigation
test(storage): cover quota exceeded handling
docs(readme): document local storage schema
```

Guidelines:
- Commit small, logical units of work; avoid “misc fixes” mega-commits.
- Never commit `node_modules/`, `dist/`, `.env*` or editor settings.
- Do not rewrite shared history (`git push --force` on shared branches is not allowed).

## 4. Pull request workflow

1. Sync your branch: `git fetch origin && git rebase origin/main` (or merge `main` into your branch).
2. Run `npm run lint && npm test && npm run build`.
3. Push and open a PR into `main` using this template:

   ```markdown
   ## Summary
   What does this change and why?

   ## Screenshots
   (UI changes at 375px and 1440px)

   ## Testing
   - [ ] npm run lint
   - [ ] npm test
   - [ ] npm run build
   - [ ] Manual steps performed: …

   ## Related
   Closes #<issue>
   ```

4. Request review from **at least one** other member, ideally the owner of any area you touched.
5. Address review comments with new commits (do not force-push during review).
6. Merge with **Squash and merge** once approved and checks pass; delete the branch.

## 5. Code review process

Reviewers check:

- **Correctness** — does it work for guests, members and admins? Are edge cases handled (empty states, invalid input, missing IDs)?
- **Data integrity** — all storage goes through `storageService`; deletes keep relationships consistent.
- **Security posture** — no plaintext passwords; role checks in services as well as routes.
- **Consistency** — reuses existing components (`Button`, `Modal`, `FormField`, …) and brand tokens rather than duplicating them.
- **Accessibility** — labels, focus states, keyboard support, `aria-*` attributes, alt text.
- **Responsiveness** — no horizontal overflow at 375 / 768 / 1024 / 1440 px.
- **Tests & docs** — new logic has tests where practical; README/TESTING updated.

Use GitHub's “Request changes” for blocking issues and “Comment” for suggestions. Be specific and kind.

## 6. Testing expectations

- Service-layer logic (storage, auth, recipes, planner, analytics) needs Vitest unit tests in `tests/`.
- UI changes are verified manually in the browser at the four target widths and logged in `TESTING.md` with real results. **Never mark a test as passed unless you actually ran it.**
- Before merging, the full suite must be green.

## 7. Handling merge conflicts

1. Update your local `main`: `git checkout main && git pull`.
2. Rebase your branch: `git checkout <branch> && git rebase main`.
3. For each conflict, open the file, keep the correct combination of both changes, remove the conflict markers, then `git add <file>` and `git rebase --continue`.
4. Re-run `npm run lint && npm test && npm run build`.
5. Push with `git push --force-with-lease` (only on your own task branch).
6. If a conflict touches another member's area, resolve it together on a call or in the PR thread.

Common hotspots: `src/routes/AppRoutes.jsx`, `src/utils/constants.js`, `src/data/seedData.js` and `package.json`. Keep edits to these files small and coordinate in the team channel.

## 8. Recording contributions

After each merged PR, update [TEAM_CONTRIBUTIONS.md](TEAM_CONTRIBUTIONS.md) with links to your **real** commits, PRs and reviews.
