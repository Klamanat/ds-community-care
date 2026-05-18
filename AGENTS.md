# DS Community Care — AI Agent Instructions

โปรเจกต์ Employee Engagement Platform สำหรับทีม **Digital Solutions**

---

## 🔧 Tech Stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| **Frontend** | Vue 3 (Composition API, `<script setup>`) + Vite 5                  |
| **State**    | Pinia (setup store syntax — `defineStore('name', () => { ... })`)   |
| **Routing**  | Vue Router 4 (`createWebHashHistory`)                               |
| **Styling**  | Tailwind CSS v3 + `app/src/styles/global.css` (custom classes)      |
| **Backend**  | Supabase (PostgreSQL + RLS + RPC + Storage)                         |
| **Auth**     | Supabase Auth (email-password with `empCode@ds-community.internal`) |
| **Deploy**   | Vercel (SPA)                                                        |

> Full spec: [spec.md](./spec.md) · Plan: [PLAN.md](./PLAN.md) · Risk analysis: [risk-analysis.md](./risk-analysis.md)

---

## 🏛 Architecture

```
Vue 3 SPA (hash routing)
  ├── Pinia stores (in `core/stores/` or `features/*/*.store.js`)
  │     └── Service layer (in `core/services/` or `features/*/*Service.js`)
  │           └── Supabase client (singleton: `core/services/supabase.js`)
  └── Image cache: Edge Function → Supabase Storage → Drive (3-tier)
```

- **CORS:** Prod uses Vercel rewrites (`/supabase/*` → Supabase URL). Dev uses `.env` + `VITE_SUPABASE_URL`.
- **Auth:** 2-step login (empCode → passcode), Supabase session-based. Admin panel separate.

---

## 📁 Directory Structure (app/src/)

```
src/
├── core/
│   ├── stores/         # Core Pinia stores (ui, userAuth, admin, cardConfig)
│   ├── services/       # Core services (supabase client, api, imageService, edgeFunctions)
│   ├── layout/         # App shell components (AppHeader, AppSidebar, AppBottomNav)
│   ├── composables/    # useRipple, useConfetti, useFadeIn, useImageCompress
│   ├── constants/      # mentalCardColors
│   └── utils/          # cache.js (lsGet/lsSet/lsDel), date.js
├── features/           # Feature modules (feature-first)
│   ├── empathy/        # empathy.store.js + empathyService.js + modals
│   ├── activities/     # activities.store.js + activitiesService.js + ActivityTicketModal
│   ├── birthday/
│   ├── rewards/
│   ├── training/       # + training/ sub-views
│   ├── ...             # announcements, blog, gifts, ideas, mental, notifications, plans, team
├── shared/components/  # BaseModal, SkeletonCard, EmptyState, AdminCardMenu
├── components/home/    # BdayBanner, ConsultCards, EmpathyBoard, EmpathyCard, MonthsGrid
├── views/              # Page-level views (HomeView, StarView, BdayView, etc.)
│   └── admin/          # Admin views + AdminLayout + admin.css
├── router/index.js     # Hash routing, lazy-loaded, 3 layout tiers
└── styles/global.css   # All global CSS + Tailwind directives
```

---

## 📐 Key Conventions

### Naming

| What           | Convention                | Example                                   |
| -------------- | ------------------------- | ----------------------------------------- |
| Pinia stores   | `*.store.js` (kebab-case) | `activities.store.js`, `notif.store.js`   |
| Services       | `*Service.js`             | `empathyService.js`, `userAuthService.js` |
| Vue components | PascalCase `.vue`         | `BdayBanner.vue`, `BaseModal.vue`         |
| Views          | PascalCase `*View.vue`    | `HomeView.vue`, `UserLoginView.vue`       |
| Composables    | `use*` prefix             | `useRipple.js`, `useConfetti.js`          |

### Imports

- **Relative imports** throughout (no `@` alias)
- Services imported as namespace: `import * as svc from './xxxService.js'`
- Stores use named exports: `import { useEmpathyStore } from '...'` or `import { useUiStore } from '../../core/stores/ui.js'`

### Pinia Store Pattern

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as svc from './xxxService.js'

export const useXxxStore = defineStore('xxx', () => {
  const all = ref([])
  const isLoading = ref(false)
  const lastFetched = ref(null)

  async function load(force = false) { ... }
  function localAdd(item) { ... }

  return { all, isLoading, lastFetched, load, localAdd }
})
```

### Service Pattern

```js
import { supabase } from "../../core/services/supabase.js";

export async function fetchAll() {
  const { data, error } = await supabase.from("table").select("*");
  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    /* snake_case → camelCase */
  }));
}
```

### Vue Component Pattern

```vue
<script setup>
import { ref } from 'vue'
import { useUiStore } from '../../core/stores/ui.js'
import * as svc from './xxxService.js'

defineProps({ ... })
const ui = useUiStore()
</script>
```

- All components use `<script setup>` + Composition API
- Tailwind utility classes heavily; `<style scoped>` for custom CSS only
- BaseModal provides bottom-sheet Teleport shell; modals triggered via `ui.openModal('modal-xxx')`

### Routing

- Hash history (`/#/login`, `/#/admin/employees`)
- 3 layout tiers via `route.meta`: `authLayout` (login), `adminLayout` (admin panel), default (main app)
- All routes lazy-loaded

---

## 🚀 Commands

| Command           | Location    | Purpose                                                                |
| ----------------- | ----------- | ---------------------------------------------------------------------- |
| `npm run dev`     | `app/`      | Start Vite dev server                                                  |
| `npm run build`   | `app/`      | Production build to `app/dist/`                                        |
| `npm run preview` | `app/`      | Preview production build                                               |
| ESLint            | root        | `eslint` config in `.eslintrc.cjs`                                     |
| Prettier          | root        | `prettier` config in `.prettierrc` (no semi, single quotes, 100 width) |
| Supabase          | `supabase/` | DB migrations, RLS, RPC in `supabase/migrations/`                      |

---

## ⚠️ Key Pitfalls & Notes

1. **Supabase URL strategy:** Dev uses `VITE_SUPABASE_URL` env var. Prod uses `window.location.origin + '/supabase'` (Vercel proxy). See `core/services/supabase.js`.
2. **CORS:** Not an issue on prod (same-origin via Vercel rewrites). Dev needs env vars.
3. **Auth:** User auth uses Supabase email-password with `empCode@ds-community.internal` format. Login via `userAuthService.js` / `userAuth.js` store. Admin auth is separate.
4. **Image cache:** 3-tier: Edge Function cache → localStorage (`lsGet`/`lsSet`) → in-memory Map. Images are lazy-fetched after render.
5. **Modal remount:** Modals use `:key="ui.modalKeys['modal-xxx']"` to force remount on every open, resetting state.
6. **Store caching:** Common pattern: `lsGet`/`lsSet` with TTL + `lastFetched` ref for in-memory debounce (e.g., 30s).
7. **Snake→Camel mapping:** Done in service layer, not stores.
8. **Optimistic updates:** Store updates state first → calls API → reverts on error (likes, comments).
