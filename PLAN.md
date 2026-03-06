# DS Community Care — Implementation Plan

> Last updated: 2026-03-06

---

## Phase 0: Project Setup ✅
- [x] Vite + Vue 3 + Pinia + Vue Router
- [x] Extract CSS → `app/src/styles/global.css`
- [x] Copy images → `app/public/images/`
- [x] Hash-based router (`createWebHashHistory`) — 7 routes
- [x] `vite.config.js` with GAS proxy + path alias `@`
- [x] `app/.env.example` — `VITE_GAS_URL` placeholder

---

## Phase 1: App Shell ✅
- [x] `App.vue` — Header + Sidebar + BottomNav + RouterView + Toast
- [x] `ui.js` store — modal state, currentUser, toast
- [x] `AppHeader`, `AppSidebar`, `AppBottomNav`, `NavItem`
- [x] `BaseModal` (Teleport to body, `.open` class drives animation)

---

## Phase 2: Views & Modals ✅
- [x] 7 Views: Home, Star, Notif, Settings, Idea, Bday, Culture
- [x] 7 Modals: Bday, Empathy, EmpDetail, Financial, Mental, Org, Profile
- [x] All stores with seed/static data (empathy, birthday, team, ideas)
- [x] All services: `api.js` (gasGet), empathy/birthday/team/idea services
- [x] Composables: `useRipple`, `useConfetti`, `useFadeIn`

---

## Phase 2.5: GAS Backend Files ✅
- [x] `gas/Code.gs` — doGet() router for all actions
- [x] `gas/Utils.gs` — uuid(), getSheet(), appendRow(), sheetToObjects(), formatDate(), ok(), err()
- [x] `gas/Employees.gs` — getEmployees, addTeamMember, joinStarGang
- [x] `gas/Birthdays.gs` — getBirthdays, getBirthdayWishes, addBirthdayWish
- [x] `gas/Empathy.gs` — getEmpathyPosts, addEmpathyPost, getEmpathyComments, addComment, toggleLike
- [x] `gas/Ideas.gs` — getIdeas, submitIdea

---

## Phase 3: Google Sheets + GAS Deploy 🔲 ← ขั้นตอนถัดไป (ทำนอก repo)

### 3.1 สร้าง Google Spreadsheet
สร้าง Spreadsheet ใหม่ใน Google Drive แล้วสร้าง **7 sheets** ต่อไปนี้:

| Sheet name | Headers (row 1) |
|---|---|
| `Employees` | `id \| name \| role \| dept \| imgUrl \| grad \| inTeam \| inStarGang \| starGangName \| starGangRole` |
| `Birthdays` | `key \| employeeId \| name \| role \| monthIdx \| date \| fallbackIdx \| imgUrl` |
| `BirthdayWishes` | `id \| birthdayKey \| fromName \| fromAvIdx \| msg \| time \| year` |
| `EmpathyPosts` | `id \| recEmployeeId \| recName \| recRole \| recImgUrl \| sndName \| msg \| tag \| likeCount \| createdAt` |
| `EmpathyComments` | `id \| postId \| authorName \| text \| createdAt` |
| `EmpathyLikes` | `postId \| userKey` |
| `Ideas` | `id \| category \| title \| detail \| submitterName \| createdAt \| status` |

### 3.2 Deploy GAS
1. เปิด Spreadsheet → Extensions → Apps Script
2. ลบโค้ดเดิมทิ้ง
3. สร้างไฟล์ใหม่ แล้ว copy-paste ทีละไฟล์:
   - `Code.gs` (ชื่อ Code.gs)
   - `Utils.gs` (สร้างไฟล์ใหม่)
   - `Employees.gs` (สร้างไฟล์ใหม่)
   - `Birthdays.gs` (สร้างไฟล์ใหม่)
   - `Empathy.gs` (สร้างไฟล์ใหม่)
   - `Ideas.gs` (สร้างไฟล์ใหม่)
4. Deploy → New deployment → Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy Web App URL

### 3.3 ตั้งค่า URL
```bash
# app/.env
VITE_GAS_URL=https://script.google.com/macros/s/xxxxxxxx/exec
```

### 3.4 ทดสอบ endpoints
```
GET [URL]?action=getEmployees           → { ok: true, data: [] }
GET [URL]?action=getEmpathyPosts        → { ok: true, data: [] }
GET [URL]?action=getBirthdays&monthIdx=2 → { ok: true, data: [] }
GET [URL]?action=getIdeas               → { ok: true, data: [] }
```

### 3.5 Seed ข้อมูลใน Sheets
ใส่ข้อมูลทดสอบอย่างน้อย:
- Employees: 3–5 แถว (ตามรูปใน `app/public/images/`)
- Birthdays: ใส่เดือนปัจจุบัน 1–2 คน
- EmpathyPosts: 2–3 แถว

---

## Phase 4: Live Data 🔲
- [ ] ทดสอบ `loadTeam()` → ดึงพนักงาน inTeam จาก GAS
- [ ] ทดสอบ `loadDirectory()` → ดึงพนักงานทั้งหมด
- [ ] ทดสอบ `loadPosts()` ใน EmpathyBoard → ดึง EmpathyPosts
- [ ] ทดสอบ `loadMonth()` ใน BdayView → ดึง Birthdays ตามเดือน
- [ ] ทดสอบ `loadIdeas()` ใน IdeaView → ดึง Ideas
- [ ] ทดสอบ `loadStarGang()` ใน StarView → ดึง inStarGang employees
- [ ] ยืนยันว่า seed data fallback ทำงานเมื่อ GAS ไม่พร้อม

---

## Phase 5: Write Operations 🔲
- [ ] `addBirthdayWish` — ส่งคำอวยพรวันเกิด (BdayView)
- [ ] `addEmpathyPost` — ส่ง kudos (EmpathyModal)
- [ ] `addComment` — คอมเมนต์ใน EmpathyModal
- [ ] `toggleLike` — กด like ใน EmpathyCard (ส่ง userKey จาก currentUser.id)
- [ ] `submitIdea` — ส่งไอเดีย (IdeaView)
- [ ] `joinStarGang` — กด JOIN ใน StarView
- [ ] `addTeamMember` — เพิ่มคนจาก directory ใน EmpathyModal

ทดสอบ Thai text round-trip (ส่ง → บันทึก → ดึงกลับ → แสดงถูกต้อง)

---

## Phase 6: Polish & Deploy 🔲
- [ ] Error toasts ทุก action (ปัจจุบันมีแล้ว — ทดสอบ edge cases)
- [ ] Loading skeleton สำหรับทุก list view
- [ ] ทดสอบ Thai text encoding end-to-end
- [ ] Build: `cd app && npm run build`
- [ ] Deploy บน **Vercel** หรือ **Netlify**
  - Set env var: `VITE_GAS_URL=...`
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] ทดสอบบน mobile (iOS Safari + Android Chrome)

---

## Bug Fixes Applied (2026-03-06) ✅
| ไฟล์ | Bug | Fix |
|---|---|---|
| `empathyService.js` | `toggleLike` เรียก `'addLike'` (ผิด) | แก้เป็น `'toggleLike'` + ส่ง `userKey` แทน `liked` |
| `empathy.js` store | `toggleLike` ไม่ส่ง `userKey` | ส่ง `ui.currentUser.id` |
| `teamService.js` | `fetchTeam` ส่ง `{ filter: 'inTeam' }` (ผิด) | แก้เป็น `{ inTeam: 'true' }` |
| `gas/Code.gs` | ไม่มี `addTeamMember`, `joinStarGang` | เพิ่ม 2 routes |
| `gas/Employees.gs` | ไม่มี `addTeamMember`, `joinStarGang` functions | เพิ่ม 2 functions |
| `EmpathyBoard.vue` | ไม่ fetch posts เลย | เพิ่ม `onMounted(() => empathy.loadPosts())` |
| `teamService.js` | ไม่มี `fetchStarGang` | เพิ่ม function |
| `team.js` store | ไม่มี `loadStarGang` | เพิ่ม function |
| `StarView.vue` | ไม่โหลด star gang จาก GAS | เพิ่ม `onMounted(() => team.loadStarGang())` |

---

## Known Limitations / Future Work
- `currentUser` ใน `ui.js` เป็น hardcode → Phase 6 ควรเชื่อมกับ LINE Login หรือ SSO
- `notifs` ใน `NotifView.vue` เป็น static → อาจเพิ่ม GAS endpoint `getNotifications` ในอนาคต
- `StarView` starPlayers เป็น static seed → เมื่อ GAS พร้อม ควรดึงจาก `inStarGang` employees
- `SettingsView` toggles ไม่ persistent → อาจ save ลง localStorage
