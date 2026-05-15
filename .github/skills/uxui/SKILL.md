---
name: uxui
description: >
  UX/UI design guidance for the DS Community Care app.
  Use this skill when asked to design, style, or improve any UI component,
  page layout, color usage, animation, or mobile responsiveness in this project.
---

# UX/UI Skill — DS Community Care

## Project Design System

### Color Palette (Tailwind custom tokens)

| Token            | Hex       | Usage                                      |
| ---------------- | --------- | ------------------------------------------ |
| `app-bg`         | `#F2F0FB` | Page background                            |
| `app-dark`       | `#1A1235` | Primary text, headings                     |
| `app-mid`        | `#52497A` | Secondary text, subtitles                  |
| `app-light`      | `#9B8FBB` | Placeholder text, muted elements           |
| `app-border`     | `#E2DCFB` | Borders, dividers, card outlines           |
| `indigo`         | `#6366F1` | Primary action, active state               |
| `purple`         | `#A855F7` | Accent, gradient mid-stop                  |
| `pink`           | `#EC4899` | Highlight, gradient end, likes/hearts      |
| `amber`          | `#F59E0B` | Warnings, stars, points / reward badges    |
| `coral`          | `#FF6B6B` | Destructive actions, alerts, energy        |
| `mint`           | `#10B981` | Success states, positive feedback          |

**Header gradient (always use):**
```css
background: linear-gradient(135deg, #4F52C8 0%, #7C3AC2 50%, #C83D8E 100%);
```

### Typography

- **Font family:** `Sarabun`, `Noto Sans Thai`, `sans-serif` (Thai + Latin)
- Use `font-sans` Tailwind class for all text.
- Heading scale: `text-xl font-bold` → `text-lg font-semibold` → `text-base font-medium` → `text-sm`
- Body: `text-sm` to `text-base`, color `text-app-dark`
- Muted/secondary: `text-app-mid` or `text-app-light`

### Border Radius

| Class    | Value  | Use case                             |
| -------- | ------ | ------------------------------------ |
| `rounded-sm`  | 10px | Chips, badges, tags                 |
| `rounded-md`  | 14px | Inputs, small cards                 |
| `rounded-lg`  | 18px | Cards, modals, panels               |
| `rounded-xl`  | 24px | Feature cards, bottom sheets        |
| `rounded-2xl` | 28px | Hero cards, large modals            |
| `rounded-full` | 50% | Avatar images, icon buttons, pills  |

### Shadows

```css
shadow-app    /* 0 4px 24px rgba(99,102,241,0.13)  — default card */
shadow-app-sm /* 0 2px 10px rgba(99,102,241,0.09)  — subtle elements */
shadow-app-lg /* 0 8px 40px rgba(99,102,241,0.18)  — modals, popovers */
```

### Breakpoints

| Alias | Min-width | Target           |
| ----- | --------- | ---------------- |
| `sm`  | 600px     | Tablet portrait  |
| `md`  | 768px     | Tablet landscape |
| `lg`  | 1100px    | Desktop          |
| `xl`  | 1440px    | Wide desktop     |

Design **mobile-first** (base styles = mobile). Enhance at `sm:` and above.

---

## Component Patterns

### Cards

```html
<div class="bg-white rounded-lg shadow-app p-4 border border-app-border">
  <!-- content -->
</div>
```

For interactive / tappable cards add:
```html
class="... transition-transform active:scale-[0.98] cursor-pointer"
```

### Buttons

**Primary:**
```html
<button class="bg-indigo text-white rounded-md px-5 py-2.5 text-sm font-semibold
               shadow-app-sm active:scale-95 transition-transform">
  Label
</button>
```

**Gradient primary (hero actions):**
```html
<button class="bg-gradient-to-r from-indigo via-purple to-pink text-white
               rounded-md px-5 py-2.5 text-sm font-semibold shadow-app">
  Label
</button>
```

**Ghost / outline:**
```html
<button class="border border-app-border text-app-mid rounded-md px-4 py-2 text-sm
               hover:bg-app-bg transition-colors">
  Label
</button>
```

**Icon button (circular):**
```html
<button class="w-10 h-10 rounded-full flex items-center justify-center
               bg-app-bg text-app-mid hover:bg-indigo/10 transition-colors">
  <!-- icon -->
</button>
```

### Inputs

```html
<input class="w-full bg-app-bg border border-app-border rounded-md px-4 py-2.5
              text-sm text-app-dark placeholder-app-light
              focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo
              transition" />
```

### Badges / Pills

```html
<span class="inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-xs font-semibold
             bg-indigo/10 text-indigo">
  Label
</span>
```

Swap color pair: `bg-mint/10 text-mint`, `bg-amber/10 text-amber`, `bg-coral/10 text-coral`.

### Avatar

```html
<img class="w-10 h-10 rounded-full object-cover border-2 border-app-border" />
<!-- fallback initials -->
<div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo to-purple
            flex items-center justify-center text-white text-sm font-bold">
  AB
</div>
```

### Bottom Sheet / Modal

- Use `rounded-t-2xl` on the sheet container (no bottom radius)
- Backdrop: `bg-black/40 backdrop-blur-sm`
- Animate in with `translate-y` transition (`translate-y-full` → `translate-y-0`)
- Max height: `max-h-[85dvh] overflow-y-auto`

### Toast / Snackbar

Position: fixed bottom, above bottom navigation (`bottom-20`)
```html
<div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
            bg-app-dark text-white text-sm rounded-lg px-4 py-2.5 shadow-app-lg
            flex items-center gap-2">
```

---

## Layout Rules

1. **Shell structure** — `#app-shell` is `flex flex-col h-dvh`. The `.body-area` is `flex flex-1 min-h-0 overflow-hidden`.
2. **Page scroll** — scroll happens inside the page `<main>` element, not `<body>`. Use `overflow-y-auto flex-1` on the main content container.
3. **Bottom navigation height** — reserve `pb-16` (64px) at the bottom of scrollable content to avoid overlap with the bottom nav bar.
4. **Safe area** — always add `pb-[env(safe-area-inset-bottom)]` on fixed bottom elements for iPhone notch / home bar support.
5. **Max content width** — use `max-w-2xl mx-auto` for feed/list pages to keep lines readable on desktop.

---

## UX Principles for This App

1. **Touch-first** — minimum tap target 44×44px. Use `min-h-[44px]` on all interactive elements.
2. **Ripple feedback** — use the `useRipple` composable on tappable surfaces for tactile feedback.
3. **Loading states** — always show skeleton loaders (pulsing `bg-app-border rounded animate-pulse` blocks) before data arrives. Never leave empty white space.
4. **Empty states** — provide a helpful illustration + text + CTA button when a list is empty.
5. **Error states** — use `coral` color with a clear retry action.
6. **Optimistic updates** — update UI immediately on user action; revert + toast on API failure.
7. **Thai language** — line height for Thai script should be `leading-relaxed` (1.625) or higher. Avoid `leading-tight` on Thai text.
8. **Contrast** — never place `app-light` text on `app-bg` background for body text; it fails WCAG AA. Use `app-mid` as the minimum for readable text.
9. **Consistency** — reuse existing component classes from `global.css` before writing new styles. Add new utilities to `global.css` under the correct `@layer`.

---

## Gradient Recipes

```css
/* Page section gradient header */
background: linear-gradient(135deg, #4F52C8 0%, #7C3AC2 50%, #C83D8E 100%);

/* Soft card accent */
background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%);

/* Avatar fallback */
background: linear-gradient(135deg, #6366F1, #A855F7);

/* Success banner */
background: linear-gradient(135deg, #10B981, #059669);

/* Warning / points */
background: linear-gradient(135deg, #F59E0B, #F97316);
```

---

## Animation Guidelines

- Prefer `transition-*` utilities over custom keyframes for simple state changes.
- Duration: `duration-150` for micro interactions, `duration-300` for panels/modals, `duration-500` for page transitions.
- Easing: use `ease-out` for elements entering, `ease-in` for elements leaving.
- Scale interactions: `hover:scale-[1.02]`, `active:scale-[0.97]` for cards; `active:scale-95` for buttons.
- Page transition: slide-left-enter / slide-right-leave using Vue `<Transition>` with `transform: translateX`.

---

## File Locations

| Type              | Location                             |
| ----------------- | ------------------------------------ |
| Global CSS        | `app/src/styles/global.css`          |
| Tailwind config   | `app/tailwind.config.js`             |
| Shared components | `app/src/shared/` or `app/src/components/` |
| Feature views     | `app/src/features/<feature>/`        |
| Page views        | `app/src/views/`                     |

When adding a new reusable component style, add it under `@layer components` in `global.css`. When adding a one-off utility, use Tailwind classes inline or add under `@layer utilities` in `global.css`.
