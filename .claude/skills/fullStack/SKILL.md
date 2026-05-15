---
name: fullStack
description: Full-stack feature implementation for ds-community-care (Vue 3 + Pinia + GAS/Google Sheets). Use when building or extending a feature end-to-end: GAS handler → Service → Store → View/Component.
disable-model-invocation: true
---

## Live State
- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`

## Task

Implement the full-stack feature described in: $ARGUMENTS

Follow the layer-by-layer implementation order below. Complete each layer before moving to the next.

---

## Stack Reference

| Layer | Location | Pattern |
|-------|----------|---------|
| Database | Google Sheets | See schema in MEMORY.md |
| Backend | `gas/*.gs` | `doGet()` action router in Code.gs |
| HTTP client | `app/src/services/api.js` | `gasGet(action, params)` with `redirect:'follow'` |
| Service | `app/src/services/*Service.js` | Thin wrapper — calls `gasGet`, returns data |
| Store | `app/src/stores/*.js` | Pinia — optimistic updates, `lastFetched` cache |
| View | `app/src/views/*View.vue` | Page-level, calls store on `onMounted` |
| Component | `app/src/components/**/*.vue` | Receives props from view or reads store directly |
| Modal | `app/src/components/modals/*.vue` | Uses `BaseModal`, opened via `ui` store flags |

---

## Layer 1 — GAS Backend (`gas/`)

### If adding a new action:
1. Open `gas/Code.gs` — add a new `case 'actionName':` in the `doGet()` switch
2. Create or update the relevant `gas/*.gs` file with the handler function
3. Follow the `ok()` / `err()` response helpers from `Utils.gs`
4. For write ops: use `appendRow()` or `getSheet().getRange().setValue()`
5. For read ops: use `sheetToObjects(sheet)` and filter in JS

### Checklist
- [ ] New action registered in `Code.gs` switch
- [ ] Handler function in correct `.gs` file
- [ ] Returns `ok(data)` on success, `err(message)` on failure
- [ ] Sheet name matches Google Sheets schema

---

## Layer 2 — Service (`app/src/services/`)

### Pattern
```js
import { gasGet } from './api.js'

export async function fetchXxx(params = {}) {
  return gasGet('actionName', params)
}

export async function submitXxx(payload) {
  return gasGet('submitAction', payload)
}
```

### Checklist
- [ ] Function names match what the store will call
- [ ] Params match what the GAS handler expects
- [ ] No business logic here — just HTTP calls

---

## Layer 3 — Pinia Store (`app/src/stores/`)

### Pattern
```js
import { defineStore } from 'pinia'
import { fetchXxx, submitXxx } from '../services/xxxService.js'

export const useXxxStore = defineStore('xxx', {
  state: () => ({
    items: [],          // seed data optional
    loading: false,
    error: null,
    lastFetched: null,
  }),
  actions: {
    async loadItems(force = false) {
      if (!force && this.lastFetched && Date.now() - this.lastFetched < 60000) return
      this.loading = true
      try {
        const res = await fetchXxx()
        if (res.ok) {
          this.items = res.data
          this.lastFetched = Date.now()
        }
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    async submitItem(payload) {
      // Optimistic update
      const temp = { ...payload, id: 'temp-' + Date.now() }
      this.items.push(temp)
      try {
        const res = await submitXxx(payload)
        if (res.ok) {
          // Replace temp with real data
          const idx = this.items.findIndex(i => i.id === temp.id)
          if (idx !== -1) this.items[idx] = res.data
        } else {
          throw new Error(res.error)
        }
      } catch (e) {
        // Revert optimistic update
        this.items = this.items.filter(i => i.id !== temp.id)
        this.error = e.message
      }
    }
  }
})
```

### Checklist
- [ ] `lastFetched` cache guard (skip re-fetch if < 60s)
- [ ] Optimistic update → revert on failure for write ops
- [ ] `loading` and `error` state managed
- [ ] Seed data present so app works without GAS

---

## Layer 4 — View (`app/src/views/`)

### Pattern
```vue
<script setup>
import { onMounted } from 'vue'
import { useXxxStore } from '../stores/xxx.js'
import XxxCard from '../components/xxx/XxxCard.vue'

const xxx = useXxxStore()
onMounted(() => xxx.loadItems())
</script>

<template>
  <div class="view-container">
    <SkeletonCard v-if="xxx.loading" />
    <EmptyState v-else-if="!xxx.items.length" />
    <XxxCard v-for="item in xxx.items" :key="item.id" :item="item" />
  </div>
</template>
```

### Checklist
- [ ] `onMounted` calls `store.loadXxx()`
- [ ] Shows `SkeletonCard` while loading
- [ ] Shows `EmptyState` when empty
- [ ] Route registered in `app/src/router/index.js`

---

## Layer 5 — Component / Modal

### For display components:
- Place in `app/src/components/<feature>/`
- Accept data via props, emit actions upward or call store directly
- Use CSS classes from `app/src/styles/global.css` — do NOT add new styles unless necessary

### For modals:
- Use `BaseModal` wrapper with `.modal-sheet` + `.open` class pattern
- Open/close via `ui` store flags (`ui.showXxxModal`)
- Register the modal open flag in `app/src/stores/ui.js`
- Mount modal in `App.vue`

### Checklist
- [ ] Component follows existing naming/structure conventions
- [ ] Modal registered in `ui` store and mounted in `App.vue`
- [ ] No inline styles — only global CSS classes
- [ ] Ripple/animation composables used where appropriate (`useRipple`, `useFadeIn`)

---

## Final Checklist

- [ ] GAS: new action in `Code.gs` switch
- [ ] GAS: handler returns `ok()`/`err()`
- [ ] Service: calls `gasGet` with correct action name
- [ ] Store: optimistic updates + cache guard + seed data
- [ ] View: `onMounted` fetch + skeleton + empty state
- [ ] Component/Modal: follows conventions, registered in App.vue if modal
- [ ] Router: new route added if new view
- [ ] Manual test: feature works with seed data (before GAS deploy)
