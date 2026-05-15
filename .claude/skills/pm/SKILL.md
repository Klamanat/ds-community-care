---
name: pm
description: Project management for ds-community-care. Use for status reports, phase planning, sprint scoping, blocker triage, and next-action prioritization. Reads PLAN.md and live git state to give an accurate picture.
disable-model-invocation: true
---

## Live State
- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Recent commits: !`git log --oneline -8`
- Today: !`date /t`

## Task

$ARGUMENTS

If no specific task was given, produce a **full project status report** (see Section 1).
Otherwise, handle the specific PM request using the relevant sections below.

---

## Section 1 — Full Status Report

Read `PLAN.md` and the live git state above, then produce:

### 1.1 Phase Tracker
List all phases with current status:

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Setup | ✅ Done | |
| 1 | App Shell | ✅ Done | |
| 2 | Views & Modals | ✅ Done | |
| 2.5 | GAS Backend Files | ✅ Done | |
| 2.6 | Admin System | ✅ Done | |
| 2.7 | User Auth | ✅ Done | |
| 3 | Sheets + GAS Deploy | 🔲 External | Manual steps — cannot be done in repo |
| 4 | Live Data | 🔲 Blocked by Phase 3 | |
| 5 | Write Operations | 🔲 Blocked by Phase 4 | |
| 6 | Polish & Deploy | 🔲 Blocked by Phase 5 | |

### 1.2 Current Blocker
Phase 3 requires manual steps outside the repo:
1. Create Google Spreadsheet (9 sheets — see `PLAN.md §3.1`)
2. Copy `gas/*.gs` files into Apps Script editor
3. Deploy as Web App → copy URL → paste into `app/.env` as `VITE_GAS_URL`
4. Run `setupAdmin()` once in `Admin.gs`
5. Seed Employees, Birthdays, EmpathyPosts rows
6. Test 5 endpoints from `PLAN.md §3.5`

**Until Phase 3 is complete, Phases 4–6 cannot start.**

### 1.3 What Can Be Done Now (in-repo)
Scan the codebase and list any pending in-repo work that does NOT require Phase 3:
- TODOs or placeholder comments in any `.vue` / `.js` file
- Views still using 100% seed data that could be better structured
- Missing loading skeletons or empty states
- Components not yet using `useRipple` / `useFadeIn`
- Known limitations listed in `PLAN.md` that can be pre-built

### 1.4 Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GAS CORS redirect fails in production | Medium | High | `redirect:'follow'` in api.js; test with real URL |
| Thai text encoding breaks in Sheets | Low | Medium | URLSearchParams auto-encodes; test round-trip early |
| GAS daily quota exceeded (6 min/day free) | Low | High | Cache aggressively; batch reads |
| Mobile Safari layout issues | Medium | Medium | Test on iOS early; use `100dvh` (already in place) |
| Admin token exposure | Low | High | Token only in sessionStorage; 24h expiry |
| User token persistence | Low | Medium | 7-day token in localStorage; add logout |

### 1.5 Summary
- **Current phase**: (derive from above)
- **Next action**: (single most important thing to do right now)
- **Estimated remaining in-repo work**: (phases 4–6 task count from PLAN.md)

---

## Section 2 — Sprint Planning

If `$ARGUMENTS` mentions "sprint", "plan", or "scope":

1. List all unchecked items from `PLAN.md` phases 4, 5, 6
2. Group into 3 sprint buckets:

**Sprint A — Data Read (Phase 4)**
Focus: connect every store to live GAS data
- loadTeam(), loadDirectory(), loadPosts(), loadMonth(), loadIdeas(), loadStarGang()
- Wire userAuth.userId → ui.currentUser
- Replace UserLoginView seed with live employee list

**Sprint B — Write Ops (Phase 5)**
Focus: all user-generated content
- addBirthdayWish, addEmpathyPost, addComment, toggleLike, submitIdea
- joinStarGang, addTeamMember
- Thai text round-trip test

**Sprint C — Polish & Ship (Phase 6)**
Focus: production readiness
- Error toasts on every action
- Loading skeletons on every list view
- Build + deploy to Vercel/Netlify
- Mobile test: iOS Safari + Android Chrome

For each sprint, list:
- Prerequisites
- Tasks (from PLAN.md checkboxes)
- Definition of done

---

## Section 3 — Blocker Triage

If `$ARGUMENTS` mentions "blocker", "stuck", or "issue":

1. Identify the specific blocker from context or `$ARGUMENTS`
2. Classify: **in-repo** (can fix now) vs **external** (needs GAS/Sheets/deploy)
3. For in-repo blockers: propose a concrete fix
4. For external blockers: list the exact manual steps needed
5. Check if any in-repo work can be pre-built while waiting for external blocker

---

## Section 4 — Feature Scoping

If `$ARGUMENTS` mentions a feature name or "scope":

Produce a scoping card:

```
Feature: <name>
Phase: <which migration phase>
Effort: <S / M / L>  (S = 1 layer, M = 2-3 layers, L = 4+ layers)

Layers touched:
  GAS:      <action name(s)>
  Service:  <service function(s)>
  Store:    <store + actions>
  View:     <view file>
  Component: <component(s)>
  Modal:    <modal id(s)> (if any)

Blocked by: <phase or external dependency>
Risk: <any concerns>
Notes: <edge cases, Thai text, image upload, etc.>
```

---

## Section 5 — PLAN.md Update

If `$ARGUMENTS` mentions "update plan" or "mark done":

1. Read the current `PLAN.md`
2. Identify which items should be checked based on `$ARGUMENTS` or recent commits
3. Propose the exact line changes to `PLAN.md` (show before/after)
4. Add a new row to the Bug Fixes table if a bug was fixed
5. Update the "Last updated" date to today

Do NOT write to `PLAN.md` — show the proposed changes for user approval first.

---

## Section 6 — Velocity Check

If `$ARGUMENTS` mentions "velocity" or "commits":

Analyze recent commits:
- Count commits per day (from git log above)
- Identify which phases work landed in
- Note any gaps or regressions
- Suggest whether pace is on track for project completion

---

## Output Format Rules

- Use tables for status tracking
- Use bullet lists for tasks and risks
- Use `code blocks` for file paths, action names, env vars
- Keep each section to the point — no filler
- Flag blockers with 🔴, warnings with 🟡, good status with 🟢
- End every report with: **"Next action: [one concrete sentence]"**
