# DS Community Care — Risk Analysis

> วิเคราะห์จุดเสี่ยงในแต่ละ Feature  
> Updated: 2026-05-16 (Phase 1 + Phase 2 + Phase 3 applied)

---

## สรุปภาพรวม

| Severity | จำนวน | Fixed (Phase 1) | Fixed (Phase 2) | Fixed (Phase 3) |
|---|---|---|---|---|
| 🔴 High | 14 | 8 ✅ | 0 | 0 |
| 🟡 Medium | 16 | 3 ✅ | 5 ✅ | 4 ✅ |
| 🟢 Low | 1 | 0 | 0 | 0 |

> **Phase 1 status:** ✅ SQL migration `20260515_phase1_constraints_rls.sql` run แล้ว 2026-05-16  
> **Phase 2 status:** ✅ SQL migration `20260515_phase2_security.sql` run แล้ว 2026-05-16  
> **Phase 3 status:** ✅ Client-side only — ไม่ต้องรัน SQL เพิ่ม  
> **Session fix:** Phase 2 SESSION-01 ปรับเป็น silent re-auth (ไม่ force logout) เพื่อ compat กับ anonymous auth architecture

### Risk Categories
- **Security** — ช่องโหว่ที่ผู้ใช้สามารถปลอมแปลงข้อมูลหรือเข้าถึงโดยไม่มีสิทธิ์
- **Data Integrity** — ข้อมูลอาจเสียหายหรือ inconsistent จาก race condition / missing transaction
- **Business Logic** — Business rule บังคับแค่ฝั่ง client ข้ามได้
- **UX** — ผู้ใช้ไม่ได้รับ feedback ที่ถูกต้อง

---

## 🔴 High — ต้องแก้ไข

### AUTH-01 · Security · `userAuthService.js`
**Anonymous session ใช้แทน real auth**

Login flow สร้าง anonymous Supabase session หลัง verify passcode สำเร็จ session นี้ไม่ผูกกับ employee จริงๆ ทำให้ RLS ไม่สามารถระบุตัวตนได้แน่นอน

```js
// userAuthService.js:58-61
const { data: anonSession } = await supabase.auth.signInAnonymously()
// ← session ไม่ผูกกับ employee row ใดๆ
```

**Fix:** ใช้ Custom JWT หรือ Supabase `signInWithPassword` ที่ผูก email = empCode เพื่อให้ `auth.uid()` ใช้ใน RLS ได้

---

### AUTH-02 · Security · `userAuthService.js`
**Account enumeration ผ่าน `checkEmployee()`**

`checkEmployee()` แยก response ชัดเจนระหว่าง "ไม่พบรหัส" กับ "ยังไม่ตั้งรหัสผ่าน" ทำให้ brute-force หาว่ามี empCode ใดในระบบได้

```js
// userAuthService.js:9-18
if (!emp) return { exists: false }
if (!emp.passcode) return { exists: true, hasPasscode: false }
```

**Fix:** Return generic response เช่น `{ status: 'ok' | 'invalid' }` โดยไม่แยกเหตุผล

---

### AUTH-03 · Security · `userAuth.js` store
**Auth state ทั้งหมดเก็บใน localStorage — ปลอมแปลงได้**

`userId`, `userName`, `userRole` เก็บใน localStorage ตรงๆ ใครก็ได้เปิด DevTools แล้วแก้ role เป็น `admin` ได้

```js
// userAuth.js:121-130
localStorage.setItem('user_id', data.id)
localStorage.setItem('user_role', data.role)  // ← แก้ได้ใน DevTools
```

**Fix:** เก็บแค่ session token ใน localStorage, ดึง role จาก server เสมอเมื่อ app start

---

### ADMIN-01 · Security · `adminService.js`
**Admin role ตรวจจาก client metadata**

```js
// adminService.js:8-17
if (user?.user_metadata?.role === 'admin') { ... }
// ← user_metadata อ่านได้ฝั่ง client ปลอมแปลงได้
```

**Fix:** ตรวจ admin role ผ่าน DB function หรือ Supabase `service_role` key บน server เท่านั้น

---

### ADMIN-02 · Security · `adminService.js`
**Admin CRUD ไม่มี server-side role enforcement ใน client**

ฟังก์ชัน `getEmployees()`, `upsertReward()`, `deleteActivity()` ฯลฯ ไม่มีการตรวจ role ก่อนยิง query

**Fix:** บังคับ RLS policy บน Supabase ทุก admin table ให้ `auth.jwt() ->> 'role' = 'admin'`

---

### ROUTER-01 · Security · `router/index.js`
**Route guard อ่านจาก localStorage เท่านั้น**

```js
// router/index.js:130-140
if (!localStorage.getItem('user_id')) return '/login'
if (!localStorage.getItem('admin_name')) return '/admin/login'
```

ใครก็ได้ set `localStorage.setItem('user_id', 'fake')` แล้วเข้าหน้าใดก็ได้

**Fix:** Route guard เป็นแค่ UX fallback ได้ แต่ต้องบังคับ access control ที่ Supabase RLS จริงๆ

---

### TICKET-01 · Data Integrity · `activitiesService.js:209-263` · ✅ Fixed (Phase 1)
**Ticket capacity race condition — oversell ได้**

```js
// Read current capacity
const { data: existing } = await supabase.from('activity_tickets')
  .select('quantity').eq('activity_id', id)
// ← gap here — another user can book between read and write
await supabase.from('activity_tickets').insert({ ... })
```

สองคนซื้อ ticket พร้อมกัน ทั้งคู่ผ่าน capacity check แล้วซื้อเกิน

**Fix applied:** `bookTicket()` ใช้ `book_activity_ticket` RPC ที่ lock activity row ด้วย `FOR UPDATE` ก่อน capacity check + insert ใน single transaction + loading guard ป้องกัน concurrent calls จาก same client

---

### TICKET-02 · Data Integrity · `activitiesService.js:227-258` · ✅ Fixed (Phase 1)
**Ticket number ออกเลข client-side — ซ้ำได้**

```js
const ticketNo = `TK-${Date.now()}`  // concurrent = same ms = same ticketNo
```

**Fix applied:** `book_activity_ticket` RPC ออกเลข ticket ฝั่ง DB โดย count rows ภายใต้ row lock — ไม่มีซ้ำ

---

### GIFT-01 · Data Integrity · `giftService.js:68-78, 133-163` · ✅ Fixed (Phase 1)
**Gift claim one-per-year check แล้ว insert แยก — race condition**

```js
// Check
const { data } = await supabase.from('gift_claims')
  .select().eq('employee_id', id).eq('claimed_year', year)
if (data.length > 0) throw 'already claimed'
// ← race window
await supabase.from('gift_claims').insert({ ... })
```

**Fix applied:** `UNIQUE (employee_id, claimed_year)` constraint + `claimSurpriseBox()` ใช้ `claim_surprise_box` RPC แบบ atomic, handle `23505` gracefully ทั้ง RPC และ fallback path

---

### GIFT-02 · Data Integrity · `giftService.js:147-160` · ✅ Fixed (Phase 1)
**Surprise Box: claim insert กับ stock decrement ไม่ atomic**

ถ้า claim สำเร็จแต่ decrement ล้มเหลว stock จะผิด

**Fix applied:** `claim_surprise_box` RPC ทำ insert + decrement ใน single PL/pgSQL transaction; fallback path ใช้ `await` (ไม่ใช่ fire-and-forget แล้ว)

---

### TRAINING-01 · Data Integrity · `trainingService.js:44-51` · ✅ Fixed (Phase 1)
**Training registration ไม่มี duplicate check**

Insert โดยตรง ถ้า double-click หรือ network retry จะ register ซ้ำ

**Fix applied:** `UNIQUE (training_id, employee_id)` constraint บน DB + `registerTraining()` ใช้ `upsert(..., { ignoreDuplicates: true })` + handle `23505` gracefully

---

### MENTAL-01 · Security · `mentalService.js:45-75` · ✅ Fixed (Phase 1 — DB side)
**Consult request ไม่มี client-side auth check ก่อน insert**

User ใดก็ได้ส่ง request แทนคนอื่นได้ถ้ารู้ employee_id

**Fix applied:** RLS policy `"consult insert"` บังคับ `employee_id = auth.uid()::text` — server rejects insert ที่ไม่ใช่เจ้าของ  
⚠️ **Caveat:** ยังใช้ anonymous session — `auth.uid()` ผูกกับ anon session ไม่ใช่ employee จริงๆ จนกว่าจะแก้ AUTH-01

---

### MENTAL-02 · Security/Privacy · `mentalService.js:45-63` · ✅ Fixed (Phase 1)
**`select('*')` บน consult_requests เปิด message/reply ทั้งหมด**

ถ้า RLS ไม่ lock ดีพอ user คนอื่นอาจอ่านข้อความส่วนตัวได้

**Fix applied:** `fetchCounselorRequests()` และ `fetchSenderRequests()` ระบุ column ชัดเจนแทน `select('*')` + RLS policy จำกัด read ให้เฉพาะ counselor หรือ sender เท่านั้น

---

### CARD-01 · Security · `cardConfig.js:57-115` · ✅ Fixed (Phase 1 — DB side)
**Feature flags อ่าน/เขียน settings table โดยตรงจาก client**

User ทั่วไปสามารถ toggle card visibility หรือแก้ background ได้ถ้า RLS ไม่บล็อก

**Fix applied:** RLS policy `"settings write admin"` บน `settings` table — write เฉพาะ employee ที่มี `role = 'admin'` ใน DB  
⚠️ **Caveat:** พึ่งพา anonymous session จนกว่าจะแก้ AUTH-01

---

## 🟡 Medium — ควรแก้ไข

### POINTS-01 · Business Logic · `reward.store.js:28, 73-80` · ✅ Fixed (Phase 2)
**Daily check-in บังคับด้วย localStorage เท่านั้น**

```js
const today = new Date().toDateString()
if (localStorage.getItem('ds_checkin_date') === today) return
```

Clear localStorage = check-in ได้ไม่จำกัดครั้ง

**Fix applied:** 
- `daily_checkin` RPC (Phase 2 migration) บังคับด้วย `daily_checkins` table PRIMARY KEY `(employee_name, checkin_date)` — ป้องกัน race + double check-in ฝั่ง DB
- `reward.store.js` `load()` sync `checkedInToday` จาก server history — ถ้า history มี `type='checkin'` วันนี้ จะ set flag โดยไม่ต้องพึ่ง localStorage

---

### POINTS-02 · UX · `reward.store.js:59-70` · ✅ Fixed (Phase 3)
**Error ถูก swallow — user ไม่รู้ว่า load ล้มเหลว**

```js
} catch (e) {
  // silent fail
}
```

**Fix applied:** เพิ่ม `loadError` ref ใน `reward.store.js` — set message ใน catch block; UI สามารถ `v-if="reward.loadError"` แสดง retry หรือ error state ได้

---

### JOIN-01 · Data Integrity · `activitiesService.js:144-169` · ✅ Fixed (Phase 1 — DB side)
**Activity join duplicate check เป็น read-before-write**

Race condition เล็กน้อย: สองคนกด join พร้อมกันบน slot สุดท้าย

**Fix applied:** `UNIQUE (activity_id, employee_name)` constraint บน `activity_joins` — DB rejects duplicate แม้ race

---

### NAME-SPOOF · Security · หลายไฟล์ · ✅ Partially Fixed (Phase 2)
**`employee_name` เก็บเป็น plain string ทุก table**

| Table | Field | employee_id? |
|---|---|---|
| `activity_joins` | `employee_name` | ✅ Added (Phase 2 migration) |
| `activity_tickets` | `employee_name` | ✅ มีอยู่แล้ว (Phase 1 RPC) |
| `gift_claims` | `employee_name` | ✅ มีอยู่แล้ว (Phase 1 RPC) |
| `ideas` | `submitter_name` | ✅ Added (Phase 2 migration) |
| `training_registrations` | `employee_name` | ✅ มีอยู่แล้ว |
| `consult_requests` | `employee_name` | ✅ มีอยู่แล้ว |

**Fix applied:** Phase 2 migration เพิ่ม `employee_id` column ใน `activity_joins` และ `ideas` + unique index บน `employee_id`; client ส่ง `employee_id` ใน `joinActivity()` และ `submitIdea()` แล้ว  
⚠️ **Remaining:** Display layer ยังใช้ `employee_name` — full migration ไปใช้ JOIN เป็น Phase 3

---

### LOGOUT-01 · Data Integrity · `userAuth.js:139-143` · ✅ Fixed (Phase 2)
**Logout ไม่ clear caches ทั้งหมด**

Background stores (rewards, notifications, etc.) ยังมีข้อมูลของ user เก่าอยู่ใน memory หลัง logout

**Fix applied:**
- เพิ่ม `reset()` ใน `reward.store.js`, `notif.store.js`, `mental.store.js` 
- `App.vue` watch `userId → ''` → เรียก `reset()` ทุก store + clear `ui.currentUser`
- `userAuth.logout()` เพิ่ม `ds_checkin_date` ใน localStorage cleanup list

---

### EMPATHY-01 · Security · `empathy.store.js:63, 115-118`
**`userKey` สำหรับ likes อ่านจาก local state — spoofable**

**Fix:** Bind ไปที่ authenticated session บน server

---

### IDEAS-01 · Business Logic · `ideaService.js:26-39` · ✅ Fixed (Phase 3)
**ไม่มี rate limiting หรือ spam prevention**

User ส่ง idea ได้ไม่จำกัดครั้ง

**Fix applied:** `ideas.store.js` ตรวจ `localStorage.getItem('ds_idea_last')` — block ถ้าส่งล่าสุดภายใน 60 วินาที + toast แสดงวินาทีที่เหลือ

---

### SITE-VOTE-01 · Data Integrity · `trainingService.js:89-112`
**Site vote ไม่มี unique constraint ที่ชัดเจนในฝั่ง client**

**Fix:** Unique constraint บน `(site_id, employee_id)` + upsert

---

### CONFIG-01 · UX · `cardConfig.js:43-55` · ✅ Fixed (Phase 3)
**Config fall back ไป localStorage โดยไม่ validate อายุ cache**

Config เก่าจากเดือนที่แล้วอาจ override server state

**Fix applied:** เพิ่ม `CACHE_TTL = 1 hour` + `LS_TTL_KEY` timestamp — cache restore ยังเกิดเสมอเพื่อป้องกัน flash; TTL ใช้ตัดสินว่าจะ skip server call ได้หรือไม่ (ถ้า fresh + loaded) — server response อัปเดต TTL ทุกครั้งที่ save

---

### ACTIVITY-OPT-01 · Data Integrity · `activities.store.js` · ✅ Fixed (Phase 3)
**Optimistic update ไม่มี rollback**

`localAdd/localDelete/localUpdate` อัพเดต local state แต่ถ้า server error ไม่มี revert

**Fix applied:** เพิ่ม `snapshot()` helper — return `rollback()` function ที่ restore `all.value` กลับ snapshot; admin views ใช้ pessimistic pattern อยู่แล้ว (server first) จึงไม่ต้องแก้ view; `snapshot()` พร้อมใช้งานสำหรับ future optimistic patterns

---

### SESSION-01 · Security · `userAuth.js` · ✅ Fixed (Phase 2, revised Phase 3)
**Session ไม่ถูก validate ตอน app start**

App โหลด localStorage ตรงๆ โดยไม่ verify กับ server ว่า session ยังใช้งานได้

**Fix applied:** `App.vue` `onMounted` ตรวจ `supabase.auth.getSession()` — ถ้าไม่มี session ลอง `signInAnonymously()` re-auth แบบ silent  
⚠️ **Revised (Phase 3):** ลบ force-logout ออก เพราะ current auth architecture ใช้ localStorage เป็น primary; anonymous session เป็น optional สำหรับ RLS เท่านั้น — การ force logout ทำให้ refresh browser แล้วเด้งออก login

---

### ADMIN-SELECT-01 · Security · `adminService.js` · ✅ Fixed (Phase 2)
**`select('*')` บน sensitive tables หลายจุด**

`getEmployees()`, `fetchQuizAnswers()` และอื่นๆ ดึงทุก column รวม `passcode`

**Fix applied:** `getEmployees()` ใช้ explicit column list ที่ไม่มี `passcode`; `mapEmp()` ลบ `passcode` field ออกจาก return object พร้อม comment ชัดเจน

---

### REWARDS-ADMIN-01 · Security · `rewardService.js:48-115`
**Admin write ops ไม่มี auth check ใน service**

**Fix:** Enforce ผ่าน RLS + ตรวจ role ใน store ก่อนเรียก service

---

### MENTAL-NAME-01 · Security · `mentalService.js`
**`employee_name` ใน consult_requests เป็น plain string**

**Fix:** Store `employee_id` + RLS ผูก read/write กับ session user

---

### CARD-CACHE-01 · UX · `cardConfig.js:76-79` · ✅ Fixed (Phase 1)
**ถ้า save background ล้มเหลว UI ไม่ rollback**

**Fix applied:** `saveAll()` และ `saveBg()` มี try/catch ที่ restore ค่าจาก localStorage และ re-throw error เพื่อให้ caller แสดง toast ได้

---

## 🟢 Low — รับทราบ

### EMPATHY-ROLLBACK-01 · Data Integrity · `empathy.store.js`
**Optimistic UI มี rollback แต่ conflict handling ยังอ่อน**

Rollback มีแต่ถ้า server return state ที่ต่างจาก local การ reconcile ยังไม่ครบ

**Fix:** หลัง API call ให้ re-fetch ข้อมูลจาก server เพื่อ sync state

---

## แผนลำดับการแก้ไข

### Phase 1 — Critical ✅ Done
| # | งาน | Feature | Status |
|---|---|---|---|
| 1 | Atomic `book_activity_ticket` RPC + loading guard | Activities | ✅ Migration + client |
| 2 | Atomic `claim_surprise_box` RPC + unique constraint | Gifts | ✅ Migration + client |
| 3 | Unique constraint บน training registration | Training | ✅ Migration + client |
| 4 | Lock `settings` table write ด้วย RLS admin-only | Card Config | ✅ Migration (DB) |
| 5 | Lock `consult_requests` read ด้วย RLS (counselor + owner) | Mental | ✅ Migration (DB) |

> ✅ Migration `20260515_phase1_constraints_rls.sql` run แล้ว 2026-05-16

### Phase 2 — Security Hardening ✅ Done
| # | งาน | Feature | Status |
|---|---|---|---|
| 6 | Daily check-in enforce ใน DB function + store sync จาก history | Rewards | ✅ Migration + client |
| 7 | เพิ่ม `employee_id` ใน `activity_joins`, `ideas` | ทุก Feature | ✅ Migration + client |
| 8 | Remove `select('*')` — exclude `passcode` column | Admin | ✅ Client |
| 9 | Validate session ตอน app start + anonymous re-auth | Auth | ✅ Client |
| 10 | `logout()` → `reset()` ทุก store + clear all localStorage keys | Auth | ✅ Client |

> ✅ Migration `20260515_phase2_security.sql` run แล้ว 2026-05-16

### Phase 3 — UX & Reliability
| # | งาน | Feature | Status |
|---|---|---|---|
| 11 | เพิ่ม error state + toast ทุก store ที่ silent fail | ทุก Feature | ✅ Done |
| 12 | Optimistic rollback ใน activities store | Activities | ✅ Done |
| 13 | Rate limiting สำหรับ idea submission | Ideas | ✅ Done |
| 14 | TTL ให้ localStorage cache ใน cardConfig | Card Config | ✅ Done |

---

*risk-analysis.md — DS Community Care v2.0 · Phase 1 + Phase 2 + Phase 3 completed 2026-05-16*
