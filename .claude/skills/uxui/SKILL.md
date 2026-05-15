---
name: uxui
description: UX/UI implementation guide for ds-community-care. Use when building or styling components, modals, layouts, or interactions. Covers design tokens, Tailwind config, CSS conventions, composables, and patterns.
disable-model-invocation: true
---

## Task

Design and implement the UI/UX for: $ARGUMENTS

Follow the conventions below exactly. Do not introduce new CSS classes, tokens, or animation libraries — use only what exists in the design system.

---

## Design Tokens (tailwind.config.js)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg-app-bg` | `#F2F0FB` | Page background |
| `text-app-dark` | `#1A1235` | Primary text |
| `text-app-mid` | `#52497A` | Secondary text |
| `text-app-light` | `#9B8FBB` | Muted/placeholder text |
| `border-app-border` | `#E2DCFB` | Card borders, dividers |
| `indigo` | `#6366F1` | Primary action / active |
| `purple` | `#A855F7` | Accent |
| `pink` | `#EC4899` | Highlight / tags |
| `amber` | `#F59E0B` | Birthdays / warmth |
| `coral` | `#FF6B6B` | Alerts / likes |
| `mint` | `#10B981` | Success / positive |

### Header Gradient
```css
background: linear-gradient(135deg, #4F52C8 0%, #7C3AC2 50%, #C83D8E 100%);
```
Use only in `.app-header` and full-bleed hero sections.

### Border Radius
| Class | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 10px | Chips, badges |
| `rounded-md` | 14px | Cards (default) |
| `rounded-lg` | 18px | Large cards |
| `rounded-xl` | 24px | Modals, panels |
| `rounded-2xl` | 28px | Feature cards |
| `rounded-full` | 9999px | Avatars, pills |

### Shadows
| Class | Usage |
|-------|-------|
| `shadow-app-sm` | Subtle card lift |
| `shadow-app` | Default card shadow |
| `shadow-app-lg` | Modals, floating elements |

### Typography
Font stack: `Sarabun`, `Noto Sans Thai`, `sans-serif` — supports Thai text natively.
Use Tailwind size scale: `text-xs` (label), `text-sm` (body), `text-base` (default), `text-lg`+ (headings).
Use `font-bold` / `font-semibold` / `font-extrabold` — avoid `font-normal` for UI text.

### Breakpoints
| Name | Width | Meaning |
|------|-------|---------|
| `sm` | 600px | Show sidebar, hide BottomNav |
| `md` | 768px | Two-column layouts |
| `lg` | 1100px | Three-column / wide layouts |
| `xl` | 1440px | Max-width caps |

---

## Layout System

### Shell
```
AppHeader (60px, sticky, z-200)
└── .body-area (flex row, fills remaining height)
    ├── AppSidebar (240px, hidden on mobile, sticky)
    └── .main-scroll (flex-1, overflow-y-auto)
        └── RouterView (page content)
AppBottomNav (mobile only, fixed bottom, hidden sm:hidden)
```

### Page Content Container
```vue
<div class="px-4 py-4 sm:px-6 sm:py-6 max-w-2xl mx-auto">
  <!-- content -->
</div>
```
Use `max-w-2xl` for single-column feeds, `max-w-4xl` for grids.

### Card Pattern
```vue
<div class="bg-white rounded-md shadow-app border border-app-border p-4">
  <!-- card content -->
</div>
```

---

## Component Patterns

### Skeleton Loading
```vue
<SkeletonCard height="120px" />
<SkeletonCard height="80px" />
```
Show 2–3 skeletons while `store.loading` is true. Use `.skeleton` CSS class which has shimmer animation.

### Empty State
```vue
<EmptyState />
```
Show when `!store.items.length && !store.loading`.

### Avatar
```vue
<!-- Image avatar -->
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-app-sm">
  <img :src="imgUrl" class="w-full h-full object-cover object-top" />
</div>

<!-- Emoji fallback -->
<div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber to-pink flex items-center justify-center text-xl border-2 border-white">
  {{ emoji }}
</div>
```

### Badge / Tag
```vue
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo/10 text-indigo">
  {{ label }}
</span>
```

### Action Button (primary)
```vue
<button
  class="w-full py-3 rounded-xl bg-gradient-to-r from-indigo to-purple text-white font-bold text-sm shadow-app active:scale-95 transition-transform"
  @click="handleRippleClick"
>
  Label
</button>
```

### Ghost / Secondary Button
```vue
<button class="px-4 py-2 rounded-lg border border-app-border text-app-mid text-sm font-semibold hover:bg-app-bg transition-colors">
  Label
</button>
```

---

## Modal Pattern

### ui store — open/close
```js
import { useUiStore } from '../stores/ui.js'
const ui = useUiStore()

// Open
ui.openModal('modal-xxx')

// Close (handled by BaseModal's ✕ button and overlay click)
```

### BaseModal usage
```vue
<BaseModal modal-id="modal-xxx" sheet-class="modal-sheet-lg">
  <div class="modal-header">
    <h2 class="modal-title">Title</h2>
  </div>
  <div class="modal-body">
    <!-- content -->
  </div>
  <div class="modal-footer">
    <button @click="ui.closeModal()">Cancel</button>
    <button @click="submit()">Confirm</button>
  </div>
</BaseModal>
```

**Rules:**
- Always use `<BaseModal>` — never build overlay/sheet from scratch
- `modal-id` must be unique across the app
- Mount in `App.vue` (not inside views/components)
- Trigger via `ui.openModal('modal-xxx')` from anywhere

### Sheet size classes
| Class | Usage |
|-------|-------|
| (default) | Standard bottom sheet |
| `modal-sheet-lg` | Tall content (comments, lists) |
| `modal-sheet-full` | Full-height (detail views) |

---

## Composables

### useRipple — touch feedback on tappable elements
```vue
<script setup>
import { useRipple } from '../../composables/useRipple.js'
const { handleRippleClick } = useRipple()
</script>

<template>
  <!-- Element must have position:relative and overflow:hidden -->
  <div class="relative overflow-hidden cursor-pointer" @click="handleRippleClick">
    content
  </div>
</template>
```
Add `ripple` CSS class is auto-injected. Apply to: cards, buttons, nav items, list rows.

### useFadeIn — scroll-triggered entrance animation
```vue
<script setup>
import { useFadeIn } from '../../composables/useFadeIn.js'
useFadeIn('.fade-in')
</script>

<template>
  <div class="fade-in">content</div>
</template>
```
Elements with `.fade-in` are invisible until they enter the viewport, then get `.visible` class.
Apply to: cards in a list, section headings, stat blocks.

### useConfetti — celebration burst
```vue
import { useConfetti } from '../../composables/useConfetti.js'
const { launchConfetti } = useConfetti()

// On a success action
launchConfetti()
```
Use for: birthday wish submitted, kudos sent, idea submitted.

---

## UX Rules

1. **Mobile-first** — design for 375px width first; enhance at `sm:` (600px+)
2. **Touch targets** — minimum 44×44px for all interactive elements
3. **Thai text** — always test with Thai strings; Sarabun renders correctly at all sizes
4. **No inline styles** — use only Tailwind classes or existing CSS from `global.css`
5. **No new CSS** — if a style doesn't exist in `global.css` or Tailwind config, use Tailwind utilities instead of writing new CSS
6. **Loading states** — every data-fetching view must show `SkeletonCard` while loading
7. **Empty states** — every list must handle the empty case with `EmptyState`
8. **Optimistic UI** — for write ops, update the UI immediately; revert if GAS call fails
9. **Toast feedback** — use `ui.showToast('message')` for success/error after write ops
10. **Ripple on interaction** — apply `useRipple` to any tappable card or button
11. **Scroll containers** — use `.main-scroll` pattern; never put `overflow: auto` on body

---

## Accessibility & Polish

- Use semantic HTML: `<button>` for actions, `<a>` for navigation
- `aria-label` on icon-only buttons
- `:focus-visible` styles are inherited from Tailwind base — don't remove them
- Prefer `transition-all duration-200` or `transition-transform` for micro-interactions
- `active:scale-95` on buttons for tactile press feedback
- Gradient text: `bg-gradient-to-r from-indigo to-purple bg-clip-text text-transparent`

---

## Final Checklist

- [ ] Only tokens from `tailwind.config.js` used — no hardcoded hex values
- [ ] Mobile layout correct at 375px
- [ ] `SkeletonCard` shown while loading
- [ ] `EmptyState` shown when list is empty
- [ ] `useRipple` on all tappable elements
- [ ] `useFadeIn` on card lists for entrance animation
- [ ] Modals use `BaseModal` and are mounted in `App.vue`
- [ ] `ui.showToast()` called after write operations
- [ ] No inline styles
- [ ] Thai text renders correctly
