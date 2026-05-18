# DS Community Care — Implementation Plan

> Last updated: 2026-03-07

---

## Phase 0: Project Setup ✅

- [x] Vite + Vue 3 + Pinia + Vue Router
- [x] Extract CSS → `app/src/styles/global.css`
- [x] Copy images → `app/public/images/`
- [x] Hash-based router (`createWebHashHistory`)
- [x] `vite.config.js` with path alias `@`
- [x] `app/.env.example` — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` placeholder

---

## Phase 1: App Shell ✅

- [x] `App.vue` — Header + Sidebar + BottomNav + RouterView + Toast
- [x] `ui.js` store — modal state, currentUser, toast
- [x] `AppHeader`, `AppSidebar`, `AppBottomNav`, `NavItem`
- [x] `BaseModal` (Teleport to body, `.open` class drives animation)

---

## Phase 2: Views & Modals ✅

- [x] 7 Views: Home, Star, Notif, Settings, Idea, Bday, Culture
- [x] 11 Modals: Bday, Empathy, EmpDetail, Financial, Mental, Org, Profile, Culture, Training, Reward, MonthModal
- [x] All stores with seed/static data (empathy, birthday, team, ideas)
- [x] All services: Supabase-based (empathy, birthday, team, idea, etc.)
- [x] Composables: `useRipple`, `useConfetti`, `useFadeIn`, `useImageCompress`
- [x] Mobile modals full-screen (bottom-sheet style)

---

## Phase 2.5: Supabase Backend ✅

- [x] Supabase client setup (`core/services/supabase.js`)
- [x] Database migrations for all tables (employees, birthdays, empathy, ideas, etc.)
- [x] Row-Level Security (RLS) policies
- [x] RPC functions for complex queries
- [x] Edge Functions for image upload/cache
- [x] All `gas/` files removed — migrated to Supabase

---

## Phase 2.6: Admin System ✅

- [x] `core/services/adminService.js` — Supabase auth + admin CRUD
- [x] `app/src/services/adminService.js`
- [x] `app/src/stores/admin.js`
- [x] Router: `/admin/login`, `/admin`, `/admin/employees`, `/admin/birthdays`, `/admin/empathy`, `/admin/ideas`
- [x] `AdminLoginView.vue`, `AdminDashboard.vue`, `admin.css`
- [x] `AdminEmployeesView.vue` — table + add/edit/delete modal
- [x] `AdminBirthdaysView.vue` — table + edit/delete modal
- [x] `AdminEmpathyView.vue` — list posts + cascade delete
- [x] `AdminIdeasView.vue` — table + status filter + change status + delete

---

## Phase 2.7: User Auth System ✅

- [x] `core/services/userAuthService.js` — Supabase auth with empCode login
- [x] `app/src/services/userAuthService.js`
- [x] `app/src/stores/userAuth.js` — token/name/role เก็บ localStorage
- [x] `UserLoginView.vue` — 2-step: กรอกรหัสพนักงาน → ตรวจ → กรอก password
- [x] `UserSetPasswordView.vue` — ตั้งรหัสผ่านครั้งแรก
- [x] Router guard: `requiresUser` → redirect `/login`
- [x] `App.vue` — `authLayout` ซ่อน chrome สำหรับหน้า login/set-password

---

## Phase 3: Supabase Migration ✅

- [x] Supabase project created and configured
- [x] All tables migrated from Google Sheets to PostgreSQL
- [x] RLS policies applied
- [x] Image storage via Supabase Storage + Edge Functions
- [x] See `supabase/migrations/` for full schema history

---

## Phase 4: Live Data ✅

- [x] ทดสอบ `loadTeam()` → ดึงพนักงาน inTeam จาก Supabase
- [x] ทดสอบ `loadDirectory()` → ดึงพนักงานทั้งหมด
- [x] ทดสอบ `loadPosts()` ใน EmpathyBoard → ดึง EmpathyPosts
- [x] ทดสอบ `loadMonth()` ใน BdayView → ดึง Birthdays ตามเดือน
- [x] ทดสอบ `loadIdeas()` ใน IdeaView → ดึง Ideas
- [x] ทดสอบ `loadStarGang()` ใน StarView → ดึง inStarGang employees
- [x] เชื่อม `userAuth.userId` กับ `ui.currentUser` เพื่อให้ชื่อ/รูปถูกต้องทั่วแอป
- [x] ดึง employee list จาก Supabase มาใช้ใน UserLoginView (แทน seed)

---

## Phase 5: Write Operations 🔲

- [ ] `addBirthdayWish` — ส่งคำอวยพรวันเกิด (BdayView)
- [ ] `addEmpathyPost` — ส่ง kudos (EmpathyModal)
- [ ] `addComment` — คอมเมนต์ใน EmpathyModal
- [ ] `toggleLike` — กด like ใน EmpathyCard (ส่ง userKey จาก userAuth.userId)
- [ ] `submitIdea` — ส่งไอเดีย (IdeaView)
- [ ] `joinStarGang` — กด JOIN ใน StarView
- [ ] `addTeamMember` — เพิ่มคนจาก directory ใน EmpathyModal

ทดสอบ Thai text round-trip (ส่ง → บันทึก → ดึงกลับ → แสดงถูกต้อง)

---

## Phase 6: Polish & Deploy 🔲

- [ ] Error toasts ทุก action
- [ ] Loading skeleton สำหรับทุก list view
- [ ] ทดสอบ Thai text encoding end-to-end
- [ ] Build: `cd app && npm run build`
- [ ] Deploy บน **Vercel** หรือ **Netlify**
  - Set env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] ทดสอบบน mobile (iOS Safari + Android Chrome)

---

## Bug Fixes Applied ✅

| วันที่     | ไฟล์                    | Bug                                   | Fix                                          |
| ---------- | ----------------------- | ------------------------------------- | -------------------------------------------- |
| 2026-03-06 | `empathyService.js`     | `toggleLike` เรียก `'addLike'`        | แก้เป็น `'toggleLike'` + ส่ง `userKey`       |
| 2026-03-06 | `teamService.js`        | ส่ง `{ filter: 'inTeam' }`            | แก้เป็น `{ inTeam: 'true' }`                 |
| 2026-03-06 | `gas/Code.gs` (deleted) | ไม่มี `addTeamMember`, `joinStarGang` | เพิ่ม 2 routes (ย้ายไป Supabase แล้ว)        |
| 2026-03-06 | `EmpathyBoard.vue`      | ไม่ fetch posts                       | เพิ่ม `onMounted(() => empathy.loadPosts())` |
| 2026-03-06 | `team.js` store         | ไม่มี `loadStarGang`                  | เพิ่ม function                               |

---

## Known Limitations / Future Work

- `notifs` ใน `NotifView.vue` เป็น static → อาจเพิ่ม Supabase query `getNotifications`
- `StarView` starPlayers เป็น static seed → ควรดึงจาก `inStarGang` employees
- ยังไม่มีระบบ reset password (ต้อง admin แก้ใน Supabase โดยตรง)
