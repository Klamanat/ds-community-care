---
name: sa
description: System analysis for ds-community-care. Audits the full project state — files, stores, services, GAS handlers, migration status, and known issues. Invoke when you need a health check or before starting new work.
disable-model-invocation: true
---

## Live State
- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Recent commits: !`git log --oneline -5`

## Task

Perform a full system analysis of the `ds-community-care` Vue 3 + Vite project. Report findings in structured sections.

---

### 1. File Inventory
Check that all expected files exist:

**Stores** (`app/src/stores/`): ui.js, empathy.js, birthday.js, team.js, ideas.js
**Services** (`app/src/services/`): api.js, empathyService.js, birthdayService.js, teamService.js, ideaService.js, giftService.js
**Views** (`app/src/views/`): HomeView, StarView, NotifView, SettingsView, IdeaView, BdayView, CultureView
**Components** (`app/src/components/`): layout/, shared/, home/, modals/
**GAS** (`gas/`): Code.gs, Utils.gs, Employees.gs, Birthdays.gs, Empathy.gs, Ideas.gs
**Config**: app/src/router/index.js, app/src/main.js, app/src/App.vue, app/src/styles/global.css

Report: ✅ present / ❌ missing for each group.

---

### 2. Store ↔ Service Wiring
For each store, verify:
- Store imports the correct service
- `loadX()` / `fetchX()` functions exist and call the right service method
- Optimistic update pattern is followed (local state update → GAS call → revert on error)
- `lastFetched` cache guard is present

Report any broken wiring or missing patterns.

---

### 3. GAS Handler Coverage
Read `gas/Code.gs` and list all `action` cases in `doGet()`.
Cross-reference against what each service calls via `gasGet(action, params)`.
Report: any service calls with no matching GAS handler (❌ unhandled action).

---

### 4. Router Coverage
Read `app/src/router/index.js`.
Verify each route has a corresponding view file.
Check that `App.vue` imports/uses all modals referenced in the router or UI store.

---

### 5. Environment & Config
Check:
- `app/.env` or `app/.env.local` exists and has `VITE_GAS_URL`
- `app/vite.config.js` proxy is set up for `/gas` (if applicable)
- `app/package.json` has correct scripts: `dev`, `build`

---

### 6. Known Bug Audit
Re-verify these previously fixed bugs are still correct:
- `empathyService.js`: toggleLike calls action `'toggleLike'` and sends `userKey`
- `teamService.js`: fetchTeam sends `{ inTeam: 'true' }` (not `{ filter: 'inTeam' }`)
- `EmpathyBoard.vue`: has `onMounted(() => empathy.loadPosts())`
- `StarView.vue`: has `onMounted(() => team.loadStarGang())`
- `team.js` store: has `loadStarGang()` function
- `gas/Code.gs`: handles `addTeamMember` and `joinStarGang` actions

Report ✅ confirmed / ❌ regressed for each.

---

### 7. Migration Status
Based on findings above, update the migration checklist:
- Phase 0: Vite setup, CSS, images, routes
- Phase 1: App shell
- Phase 2: Static views + modals
- Phase 2.5: GAS backend files
- Phase 3: Google Sheets seed + GAS deploy (external)
- Phase 4: Data-connected stores
- Phase 5: Write ops
- Phase 6: Composables, error toasts, deploy

---

### 8. Summary & Recommendations
- List critical issues (blockers)
- List warnings (non-blocking but should fix)
- Suggest the next 3 concrete actions to advance the migration
