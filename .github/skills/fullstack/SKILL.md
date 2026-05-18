---
name: fullstack
description: >
  Full-stack integration patterns for the DS Community Care app.
  Use this skill when asked about data flow between frontend and backend,
  Pinia store-to-service-to-Supabase patterns, optimistic updates, caching,
  image handling, auth flow, error handling, or modal triggering.
---

# Full-Stack Skill — DS Community Care

## Data Flow Architecture

```
Vue Component
  └─ calls action on Pinia Store (features/*/*.store.js)
       └─ calls service function (features/*/*Service.js or core/services/*.js)
            └─ calls Supabase JS client (core/services/supabase.js)
                 └─ PostgreSQL (RLS enforced) or Edge Function
```

**Key rule:** Components never call services or Supabase directly — always go through a store action.

---

## Store → Service Pattern

### Store calls service via namespace import

```js
// features/empathy/empathy.store.js
import * as svc from "./empathyService.js";

export const useEmpathyStore = defineStore("empathy", () => {
  const all = ref([]);
  const isLoading = ref(false);
  const lastFetched = ref(null);

  async function load(force = false) {
    if (!force && lastFetched.value && Date.now() - lastFetched.value < 30000)
      return;
    isLoading.value = true;
    try {
      const data = await svc.fetchAll();
      all.value = data;
      lastFetched.value = Date.now();
    } catch {
      /* silent or ui.showToast */
    } finally {
      isLoading.value = false;
    }
  }

  return { all, isLoading, load };
});
```

### Service exports standalone async functions

```js
// features/empathy/empathyService.js
import { supabase } from "../../core/services/supabase.js";

export async function fetchAll() {
  const { data, error } = await supabase.from("table").select("*");
  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    // snake_case → camelCase mapping happens HERE, not in store
    id: r.id,
    myField: r.my_field,
  }));
}
```

**Convention:** Services throw errors; stores catch them and handle UI feedback.

---

## Store Caching Strategy

Two-layer caching is used throughout:

### 1. In-memory debounce (`lastFetched`)

```js
if (!force && lastFetched.value && Date.now() - lastFetched.value < 30000)
  return;
```

- Prevents redundant network calls within a short window (30s–60s)
- Store-specific TTL varies by feature (empathy=30s, people=60s)

### 2. localStorage persist (`lsGet`/`lsSet`)

```js
import { lsGet, lsSet, lsDel } from "../../core/utils/cache.js";

// On load: hydrate from cache instantly
const items = ref(lsGet("my_cache_key") || []);

// On successful fetch: persist
lsSet("my_cache_key", data, 60 * 1000); // TTL in ms

// On write: invalidate cache
lsDel("my_cache_key");
```

- TTL is set per key (typically 1–10 minutes)
- `stripBase64(data, 'imgField')` removes base64 image data before caching to keep localStorage small
- Cache keys use `dsc_` prefix (legacy) or descriptive names

---

## Optimistic Update Pattern

Used for all user interactions (likes, comments, joins, submissions):

```js
async function addItem(channelId, text) {
  const ui = useUiStore();

  // 1. Create temp item with unique ID
  const temp = { id: "tmp_" + Date.now(), text, time: "เมื่อกี้" };
  items.value.push(temp);

  try {
    // 2. Call API — get real data back
    const real = await svc.addItem(channelId, text);
    const idx = items.value.findIndex((i) => i.id === temp.id);
    if (idx !== -1) items.value.splice(idx, 1, real);
  } catch {
    // 3. Revert on failure + show toast
    items.value = items.value.filter((i) => i.id !== temp.id);
    ui.showToast("ดำเนินการไม่สำเร็จ");
  }
}
```

**Used in:** empathy likes, empathy comments, activity joins, gift claims, training registration, blog interaction.

---

## Image Handling (3-Tier Cache)

### Image ID Types

| Type                  | Format                             | Resolution                                   |
| --------------------- | ---------------------------------- | -------------------------------------------- |
| Supabase Storage path | `folder/filename.ext`              | Direct public URL via `STORAGE_BASE + path`  |
| Full URL              | `https://...`                      | Return as-is                                 |
| Drive ID              | `1abc2def3...` (no slash, no http) | Edge Function → localStorage → in-memory Map |

### Flow

```
Component needs image
  └─ getCached(imgId)
       ├─ Storage path  → returns public Supabase URL (instant)
       ├─ Full URL      → returns as-is (instant)
       └─ Drive ID      → returns cached value or ''
                            └─ if '' → fetchImages([id]) coalesces with other pending
                                         → Edge Function call
                                         → caches in Map + localStorage
```

### Implementation

- `core/services/imageService.js` — `getCached()`, `fetchImages()`, `forceRefreshImage()`
- Drive IDs are **coalesced** within a 50ms window into a single Edge Function call
- localStorage cache TTL: 60 minutes
- **Lazy-fetch pattern:** Render UI instantly with cached/empty images → fetch in background → update when loaded

```js
// Component/store lazy-fetch pattern:
const imgIds = data.map((p) => p.imgId).filter(Boolean);
if (imgIds.length) {
  fetchImages(imgIds)
    .then((map) => {
      items.value = items.value.map((p) =>
        p.imgId && map[p.imgId] ? { ...p, imgUrl: map[p.imgId] } : p,
      );
    })
    .catch(() => {});
}
```

---

## Modal System

### Triggering a Modal

```js
// In any component or store:
const ui = useUiStore();
ui.openModal("modal-xxx");
```

### Modal Keys (Force Remount)

```html
<!-- In App.vue — :key forces component recreation every open, resetting state -->
<XxxModal :key="ui.modalKeys['modal-xxx'] || 0" />
```

### BaseModal (shared shell)

- Uses Teleport to `<body>`
- Bottom-sheet style: rounded top, full-screen on mobile
- Backdrop: `bg-black/40 backdrop-blur-sm`
- Animation: translate-y transition

### Pre-registered Modals (in App.vue)

| Modal Key               | Component           | Feature               |
| ----------------------- | ------------------- | --------------------- |
| `modal-bday`            | BdayModal           | Birthday wishes       |
| `modal-emp`             | EmpathyModal        | Empathy board         |
| `modal-emp-detail`      | EmpDetailModal      | Employee detail       |
| `modal-financial`       | FinancialModal      | Financial info        |
| `modal-mental`          | MentalModal         | Mental health consult |
| `modal-org`             | OrgModal            | Org chart             |
| `modal-profile`         | ProfileModal        | User profile          |
| `modal-month`           | MonthModal          | Monthly activities    |
| `modal-culture`         | CultureModal        | FIRE culture          |
| `modal-training`        | TrainingModal       | Training courses      |
| `modal-reward`          | RewardModal         | Points & rewards      |
| `modal-announcement`    | AnnouncementModal   | Announcements         |
| `modal-activity-ticket` | ActivityTicketModal | Activity tickets      |
| `modal-notif`           | NotifModal          | Notifications         |
| `modal-blog`            | BlogModal           | Blog posts            |
| `modal-counselor-inbox` | CounselorInboxModal | Counselor inbox       |
| `modal-monthly-plan`    | MonthlyPlanModal    | Monthly plan poster   |

---

## Auth Flow

### User Login (2-step)

```
[Enter emp_code] → checkEmployee(empCode)
  ├─ not_found → generic error (AUTH-02)
  ├─ needs_setup → redirect /set-password → setPasscode()
  └─ has_passcode → [Enter passcode] → loginWithEmployee()
       ├─ signInWithPassword (if auth_user_id exists)
       └─ verify_user_passcode RPC (legacy) + background signUp
```

### Auth Store (`core/stores/userAuth.js`)

- Reads from localStorage on init (for instant UX)
- `refreshFromServer()` called on app start — overrides with DB values (AUTH-03 fix)
- `_persist(emp)` called after login — saves to localStorage + triggers image fetch
- Background sync at 5s timeout — syncs name/role/dept/slogan across devices

### Route Guards

```js
// Router meta tiers:
meta: {
  authLayout: true;
} // login/set-password (no chrome)
meta: {
  adminLayout: true;
} // admin panel
meta: {
  requiresUser: true;
} // needs user_id in localStorage
meta: {
  requiresAdmin: true;
} // needs admin Supabase session
```

---

## Supabase URL Strategy

```js
// core/services/supabase.js
const supabaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_URL // direct Supabase URL
  : `${window.location.origin}/supabase`; // Vercel proxy (same-origin)
```

- **Dev:** Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`
- **Prod:** Vercel rewrites `/supabase/*` → Supabase URL (no env vars exposed)
- **CORS:** Not an issue on prod (same-origin proxy)

---

## Error Handling Patterns

### Service Layer

```js
export async function fetchData() {
  const { data, error } = await supabase.from("table").select("*");
  if (error) throw new Error(error.message);
  return data;
}
```

### Store Layer

```js
async function load() {
  isLoading.value = true;
  try {
    items.value = await svc.fetchData();
  } catch (e) {
    ui.showToast(e.message || "เกิดข้อผิดพลาด");
  } finally {
    isLoading.value = false;
  }
}
```

### Patterns

- Services **always throw** on error (never swallow)
- Stores **catch and handle** — show toast or revert optimistic updates
- Image fetch errors are **silent** (non-critical, degrade gracefully)
- `refreshFromServer()` errors are **silent** (app works from localStorage cache)
- `console.warn()` used for non-fatal auth migration logs

---

## Feature Module Structure

Each feature follows the same structure:

```
features/<name>/
├── <name>.store.js        # Pinia store (state + actions)
├── <name>Service.js       # Supabase queries (data mapping)
└── <Name>Modal.vue        # Optional: modal component
```

**Core stores** (cross-cutting) live in `core/stores/`:

- `ui.js` — modal state, toast, currentUser, notif badge
- `userAuth.js` — login, logout, session, profile sync
- `admin.js` — admin token/auth
- `cardConfig.js` — home card visibility + backgrounds

**Core services** live in `core/services/`:

- `supabase.js` — singleton Supabase client
- (removed) `api.js` — legacy GAS API wrappers (deleted — Supabase-only now)
- `imageService.js` — 3-tier image cache
- `edgeFunctions.js` — Supabase Edge Function calls
- `userAuthService.js` — auth logic (login, check, setPasscode)
- `adminService.js` — admin auth
- `presenceService.js` — user presence tracking
