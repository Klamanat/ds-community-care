# DS Community Care — Implementation Plan

> Last updated: 2026-03-07

---

## Phase 0: Project Setup ✅
- [x] Vite + Vue 3 + Pinia + Vue Router
- [x] Extract CSS → `app/src/styles/global.css`
- [x] Copy images → `app/public/images/`
- [x] Hash-based router (`createWebHashHistory`)
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
- [x] 11 Modals: Bday, Empathy, EmpDetail, Financial, Mental, Org, Profile, Culture, Training, Reward, MonthModal
- [x] All stores with seed/static data (empathy, birthday, team, ideas)
- [x] All services: `api.js` (gasGet + gasPost), empathy/birthday/team/idea services
- [x] Composables: `useRipple`, `useConfetti`, `useFadeIn`, `useImageCompress`
- [x] Mobile modals full-screen (bottom-sheet style)

---

## Phase 2.5: GAS Backend Files ✅
- [x] `gas/Code.gs` — doGet() + doPost() router
- [x] `gas/Utils.gs` — uuid(), getSheet(), appendRow(), sheetToObjects(), ok(), err()
- [x] `gas/Employees.gs` — getEmployees, addTeamMember, joinStarGang, uploadImage
- [x] `gas/Birthdays.gs` — getBirthdays, getBirthdayWishes, addBirthdayWish
- [x] `gas/Empathy.gs` — getEmpathyPosts, addEmpathyPost, getEmpathyComments, addComment, toggleLike
- [x] `gas/Ideas.gs` — getIdeas, submitIdea
- [x] `gas/Admin.gs` — login, verifyToken, adminGetAll/UpdateRow/DeleteRow/AddEmployee/UpdateIdea/DeletePost
- [x] `gas/UserAuth.gs` — userLogin, userSetPassword, userCheckPassword, verifyUserToken

---

## Phase 2.6: Admin System ✅
- [x] `gas/Admin.gs` — SHA-256 auth, token (24h), CRUD wrappers
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
- [x] `gas/UserAuth.gs` — SHA-256 password, token (7 วัน), UserAuth sheet
- [x] `app/src/services/userAuthService.js`
- [x] `app/src/stores/userAuth.js` — token/name/role เก็บ localStorage
- [x] `UserLoginView.vue` — 2-step: กรอกรหัสพนักงาน → ตรวจ → กรอก password
- [x] `UserSetPasswordView.vue` — ตั้งรหัสผ่านครั้งแรก
- [x] Router guard: `requiresUser` → redirect `/login`
- [x] `App.vue` — `authLayout` ซ่อน chrome สำหรับหน้า login/set-password

---

## Phase 3: Google Sheets + GAS Deploy 🔲 ← ขั้นตอนถัดไป (ทำนอก repo)

### 3.1 สร้าง Google Spreadsheet
สร้าง Spreadsheet ใหม่ใน Google Drive แล้วสร้าง **9 sheets** ต่อไปนี้:

| Sheet name | Headers (row 1) |
|---|---|
| `Employees` | `id \| name \| role \| dept \| imgUrl \| grad \| inTeam \| inStarGang \| starGangName \| starGangRole` |
| `Birthdays` | `key \| employeeId \| name \| role \| monthIdx \| date \| fallbackIdx \| imgUrl` |
| `BirthdayWishes` | `id \| birthdayKey \| fromName \| fromAvIdx \| msg \| time \| year` |
| `EmpathyPosts` | `id \| recEmployeeId \| recName \| recRole \| recImgUrl \| sndName \| msg \| tag \| likeCount \| createdAt` |
| `EmpathyComments` | `id \| postId \| authorName \| text \| createdAt` |
| `EmpathyLikes` | `postId \| userKey` |
| `Ideas` | `id \| category \| title \| detail \| submitterName \| createdAt \| status` |
| `Admins` | `username \| passwordHash \| name \| token \| tokenExpires` |
| `UserAuth` | `employeeId \| passwordHash \| token \| tokenExpires` |

### 3.2 Deploy GAS
1. เปิด Spreadsheet → Extensions → Apps Script
2. ลบโค้ดเดิมทิ้ง
3. สร้างไฟล์ใหม่ แล้ว copy-paste ทีละไฟล์:
   - `Code.gs`, `Utils.gs`, `Employees.gs`, `Birthdays.gs`, `Empathy.gs`, `Ideas.gs`, `Admin.gs`, `UserAuth.gs`
4. Deploy → New deployment → Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy Web App URL

### 3.3 ตั้งค่า Admin ครั้งแรก
รันฟังก์ชัน `setupAdmin()` ใน `Admin.gs` **ครั้งเดียว** เพื่อสร้าง admin row
- Username: `admin` | Password: `ds2026`

### 3.4 ตั้งค่า URL
```bash
# app/.env
VITE_GAS_URL=https://script.google.com/macros/s/xxxxxxxx/exec
```

### 3.5 ทดสอบ endpoints
```
GET  [URL]?action=getEmployees              → { ok: true, data: [] }
GET  [URL]?action=userCheckPassword&employeeId=1 → { ok: true, data: { hasPassword: false } }
POST [URL] { action:"userSetPassword", employeeId:"1", password:"xxx" }
POST [URL] { action:"userLogin", employeeId:"1", password:"xxx" } → { token, name, role }
POST [URL] { action:"login", username:"admin", password:"ds2026" } → { token, name }
```

### 3.6 Seed ข้อมูลใน Sheets
ใส่ข้อมูลทดสอบอย่างน้อย:
- `Employees`: 3–5 แถว (id ต้องตรงกับ `UserAuth.employeeId` ที่จะใช้ login)
- `Birthdays`: ใส่เดือนปัจจุบัน 1–2 คน
- `EmpathyPosts`: 2–3 แถว

---

## Phase 4: Live Data 🔲
- [ ] ทดสอบ `loadTeam()` → ดึงพนักงาน inTeam จาก GAS
- [ ] ทดสอบ `loadDirectory()` → ดึงพนักงานทั้งหมด
- [ ] ทดสอบ `loadPosts()` ใน EmpathyBoard → ดึง EmpathyPosts
- [ ] ทดสอบ `loadMonth()` ใน BdayView → ดึง Birthdays ตามเดือน
- [ ] ทดสอบ `loadIdeas()` ใน IdeaView → ดึง Ideas
- [ ] ทดสอบ `loadStarGang()` ใน StarView → ดึง inStarGang employees
- [ ] เชื่อม `userAuth.userId` กับ `ui.currentUser` เพื่อให้ชื่อ/รูปถูกต้องทั่วแอป
- [ ] ดึง employee list จาก GAS มาใช้ใน UserLoginView (แทน seed)

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
  - Set env var: `VITE_GAS_URL=...`
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] ทดสอบบน mobile (iOS Safari + Android Chrome)

---

## Bug Fixes Applied ✅
| วันที่ | ไฟล์ | Bug | Fix |
|---|---|---|---|
| 2026-03-06 | `empathyService.js` | `toggleLike` เรียก `'addLike'` | แก้เป็น `'toggleLike'` + ส่ง `userKey` |
| 2026-03-06 | `teamService.js` | ส่ง `{ filter: 'inTeam' }` | แก้เป็น `{ inTeam: 'true' }` |
| 2026-03-06 | `gas/Code.gs` | ไม่มี `addTeamMember`, `joinStarGang` | เพิ่ม 2 routes |
| 2026-03-06 | `EmpathyBoard.vue` | ไม่ fetch posts | เพิ่ม `onMounted(() => empathy.loadPosts())` |
| 2026-03-06 | `team.js` store | ไม่มี `loadStarGang` | เพิ่ม function |

---

## Known Limitations / Future Work
- `notifs` ใน `NotifView.vue` เป็น static → อาจเพิ่ม GAS endpoint `getNotifications`
- `SettingsView` toggles ไม่ persistent → อาจ save ลง localStorage
- `StarView` starPlayers เป็น static seed → เมื่อ GAS พร้อม ดึงจาก `inStarGang` employees
- ยังไม่มีระบบ reset password (ต้อง admin แก้ใน sheet โดยตรง)
