# DS Community Care

Web App สำหรับทีม **Digital Solutions** — ดูแลสุขภาพ ความเป็นอยู่ และวัฒนธรรมองค์กรของสมาชิกในทีม

---

## Tech Stack

| ส่วน         | รายละเอียด                                                         |
| ------------ | ------------------------------------------------------------------ |
| **Frontend** | Vue 3 (Composition API) + Vite + Pinia + Vue Router (hash history) |
| **Styling**  | Tailwind CSS v3 + `global.css` (single source of truth)            |
| **Backend**  | Supabase (PostgreSQL + RLS + RPC + Storage)                        |
| **Auth**     | Supabase Auth (email-password with empCode@ds-community.internal)  |
| **Images**   | Supabase Storage + Google Drive (via Edge Function cache)          |
| **Deploy**   | Vercel (SPA)                                                       |

---

## โครงสร้างโปรเจกต์

```
ds-community-care/
├── app/                              # Vite project (frontend)
│   ├── index.html                    # Entry HTML — viewport no-zoom, Google Fonts
│   ├── vite.config.js                # Vite config + plugins
│   ├── src/
│   │   ├── main.js                   # createApp + Pinia + Router + mount
│   │   ├── App.vue                   # Shell: Layout + BottomNav + all modals
│   │   ├── router/index.js           # User routes + Admin routes + guards
│   │   ├── styles/global.css         # CSS ทั้งหมด (Tailwind + components)
│   │   ├── core/
│   │   │   ├── stores/               # Core Pinia stores (ui, userAuth, admin, cardConfig)
│   │   │   ├── services/             # Core services (supabase, imageService, edgeFunctions)
│   │   │   ├── layout/               # AppShell (AppHeader, AppSidebar, AppBottomNav)
│   │   │   ├── composables/          # useRipple, useConfetti, useFadeIn, useImageCompress
│   │   │   ├── constants/            # mentalCardColors
│   │   │   └── utils/                # cache.js (lsGet/lsSet/lsDel), date.js
│   │   ├── features/                 # Feature modules (feature-first)
│   │   │   ├── empathy/              # empathy.store.js + empathyService.js + modals
│   │   │   ├── activities/           # activities.store.js + activitiesService.js
│   │   │   ├── birthday/             # birthday.store.js + birthdayService.js
│   │   │   ├── rewards/              # reward.store.js + rewardService.js
│   │   │   ├── training/             # training.store.js + trainingService.js + sub-views
│   │   │   ├── ...                   # announcements, blog, gifts, ideas, mental, notif, plans, team
│   │   ├── shared/components/        # BaseModal, SkeletonCard, EmptyState, AdminCardMenu
│   │   ├── components/home/          # BdayBanner, ConsultCards, EmpathyBoard, MonthsGrid
│   │   ├── views/                    # Page-level views (HomeView, StarView, BdayView, etc.)
│   │   │   └── admin/                # Admin views + AdminLayout + admin.css
│   │   └── env                       # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   └── .env                          # Supabase credentials (dev)
└── supabase/                         # Database migrations, RLS, RPC, Edge Functions
│   │   │   ├── birthdayService.js    # Birthday CRUD
│   │   │   ├── ideaService.js        # Ideas CRUD
│   │   │   ├── activitiesService.js  # Activities + stamps + rewards
│   │   │   ├── announcementService.js# Announcements
│   │   │   ├── blogService.js        # Blog posts
│   │   │   ├── rewardService.js      # Points + reward rules
│   │   │   ├── trainingService.js    # Trainings + IDP + site visits
│   │   │   ├── userAuthService.js    # Password check / set
│   │   │   └── adminService.js       # Admin-gated operations
│   │   ├── composables/
│   │   │   ├── useRipple.js
│   │   │   ├── useConfetti.js
│   │   │   ├── useFadeIn.js
│   │   │   └── useImageCompress.js
│   │   ├── utils/
│   │   │   ├── cache.js              # lsGet / lsSet / lsDel / stripBase64
│   │   │   └── date.js               # formatThaiDatetime
│   │   ├── components/
│   │   │   ├── layout/               # AppHeader, AppSidebar, AppBottomNav
│   │   │   ├── shared/               # BaseModal, SkeletonCard, EmptyState
│   │   │   ├── home/                 # EmpathyBoard, EmpathyCard, MonthsGrid, ConsultCards
│   │   │   └── modals/
│   │   │       ├── BdayModal.vue
│   │   │       ├── EmpathyModal.vue
│   │   │       ├── EmpDetailModal.vue
│   │   │       ├── FinancialModal.vue
│   │   │       ├── MentalModal.vue
│   │   │       ├── OrgModal.vue
│   │   │       ├── ProfileModal.vue
│   │   │       ├── MonthModal.vue
│   │   │       ├── CultureModal.vue
│   │   │       ├── TrainingModal.vue  # ครอบ 7 sub-views (annual/idp/site/blog/...)
│   │   │       ├── RewardModal.vue
│   │   │       ├── AnnouncementModal.vue
│   │   │       ├── NotifModal.vue
│   │   │       ├── BlogModal.vue
│   │   │       └── CounselorInboxModal.vue
│   │   └── views/
│   │       ├── UserLoginView.vue
│   │       ├── UserSetPasswordView.vue
│   │       ├── HomeView.vue
│   │       ├── StarView.vue
│   │       ├── IdeaView.vue
│   │       ├── NotifView.vue
│   │       ├── SettingsView.vue
│   │       ├── BdayView.vue
│   │       ├── BlogView.vue
│   │       ├── CultureView.vue
│   │       └── admin/
│   │           ├── AdminLoginView.vue
│   │           ├── AdminDashboard.vue
│   │           ├── AdminEmployeesView.vue
│   │           ├── AdminBirthdaysView.vue
│   │           ├── AdminEmpathyView.vue
│   │           ├── AdminIdeasView.vue
│   │           ├── AdminActivitiesView.vue
│   │           ├── AdminTrainingView.vue
│   │           ├── AdminMentalView.vue
│   │           ├── AdminRewardRulesView.vue
│   │           ├── AdminBlogView.vue
│   │           └── AdminAnnouncementView.vue
│   └── .env                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (dev)
└── supabase/                         # Database migrations, RLS, RPC, Edge Functions
```

---

## Architecture Overview

```
Browser
  └── Vue SPA (hash routing: /#/, /#/login, /#/admin/...)
        ├── Pinia Store (reactive state + localStorage cache)
        │     └── Service layer (features/*/*Service.js)
        │           └── Supabase JS client (core/services/supabase.js)
        │                 └── PostgreSQL (RLS enforced)
        │                 └── Edge Functions (image upload/cache/delete)
        └── imageService (3-tier cache: Edge Function → localStorage → in-memory Map)
```

**CORS:** Prod uses Vercel rewrites (`/supabase/*` → Supabase URL). Dev uses `.env` + `VITE_SUPABASE_URL`.
**Auth:** User auth uses Supabase email-password with `empCode@ds-community.internal` format. Admin panel uses separate credential check.

---

## Authentication

### User Login (`/login`)

1. ผู้ใช้กรอก **empCode** (รหัสพนักงาน)
2. `checkEmployee(empCode)` → query `employees` table
   - ไม่พบ → generic error (ป้องกัน account enumeration)
   - พบแต่ไม่มี passcode → redirect `/set-password`
3. `setPasscode(empCode, passcode)` → RPC `set_user_passcode` + `supabase.auth.signUp()`
4. `loginWithEmployee(empCode, passcode)` →
   - `signInWithPassword` (ถ้ามี auth_user_id) หรือ verify via RPC `verify_user_passcode`
   - สร้าง real Supabase session (ไม่ใช่ anonymous)
   - บันทึก profile ลง localStorage + background sync profile

### Admin Login (`/admin/login`)

- แยกจาก user login — ใช้ username/password แบบดั้งเดิม
- Supabase session role (`user_metadata.role === 'admin'`) เป็นตัวยืนยันสิทธิ์
- Route guard ตรวจ localStorage fast-check + Supabase session re-validation

---

## Performance

### Supabase (No Cold Start)

Supabase PostgreSQL + Edge Functions ไม่มี cold start problem — response time millisecond-level
ไม่จำเป็นต้องใช้ keep-alive trigger อีกต่อไป

### Deferred Loading

| เวลา delay | สิ่งที่โหลด                     |
| ---------- | ------------------------------- |
| 0s (ทันที) | Birthday, Empathy posts/people  |
| 2.5s       | Monthly activities (below fold) |
| 3s         | Notifications (badge only)      |
| 5s         | Background profile sync         |

### Promise Dedup (`teamService.js`)

`getEmployees` ถูกเรียกพร้อมกันจากหลาย store → dedup ด้วย in-flight promise cache (30s TTL)
ผล: 3-5 concurrent calls → 1 Supabase query

### Optimistic Updates

Store อัปเดต state ก่อน → เรียก API → revert ถ้า error (likes, comments, joins ทั้งหมด)

---

## Features

---

### 🏠 Home — หน้าหลัก

หน้าแรกโหลด Birthday + Empathy ก่อน (0s) แล้วค่อย Activities (2.5s delay) เพื่อลด perceived load time

| Section              | สิ่งที่ทำได้                                              | ข้อมูลจาก                         |
| -------------------- | --------------------------------------------------------- | --------------------------------- |
| 🎊 กิจกรรมและข่าวสาร | วันเกิดเดือนนี้ + shortcut ไป Culture / Training / Reward | `birthday.js` → `getBirthdays`    |
| 💙 Consult Service   | เปิด MentalModal / FinancialModal โดยตรง                  | static modal                      |
| 🛠 Other             | Star Gang, เสนอไอเดีย                                     | —                                 |
| 💝 Empathy Board     | cards 12 คนล่าสุด — like / click ดูรายละเอียด             | `empathy.js` → `getEmpathyPeople` |
| 📅 Activities        | grid 12 เดือน คลิกเปิด MonthModal                         | `activities.js` → `getActivities` |

**Announcement Banner** — ดึง announcement จาก Supabase เมื่อ login สำเร็จ แสดงครั้งเดียวต่อ session (ตรวจสอบด้วย `dsc_ann_seen` ใน localStorage) รองรับทั้งข้อความและวิดีโอ

---

### 🎂 Birthday Celebration

**Flow หลัก:**

1. `birthday.js` โหลด employees ตามเดือน (`getBirthdays?monthIdx=N`) cache 60 นาทีต่อเดือน
2. แสดงรูปพนักงานจาก Drive (batch fetch ผ่าน `imageService`)
3. ผู้ใช้คลิกชื่อ → `BdayModal` โหลด wishes ของคนนั้น (`getBirthdayWishes?birthdayKey=XX`)

**การส่งคำอวยพร:**

- เลือก avatar emoji + เขียนข้อความ → `birthdayService.addWish` → insert สู่ Supabase
- Optimistic update: wish แสดงทันทีก่อน API ตอบกลับ — revert ถ้า error

**อัปโหลดรูปวันเกิด:**

- เฉพาะพนักงานเจ้าของวันเกิด (ตรวจสอบด้วย `userId === birthday.employeeId`)
- บีบอัดรูปก่อน upload ผ่าน `useImageCompress` → `uploadImage` (Edge Function → Drive)
- อัปเดต employee record ใน Supabase ด้วย Drive URL ใหม่

**Surprise Box:**

- ตรวจสอบว่าวันนี้ตรงกับวันเกิดของผู้ใช้ (เปรียบเทียบ `monthDay`)
- แสดง 🥚 ให้แตะ → animation แกะไข่ → เพิ่ม reward points ผ่าน `claimActivityReward`

---

### 💝 Empathy Board — ส่งคำชื่นชม

ระบบแบ่งเป็น 2 modal และ 1 data model

#### Data Model

- **Channel** = คน 1 คน มี `channelId` = `empCode` ของคนนั้น
- **Comment** = คำชื่นชมแต่ละรายการ เก็บใน `EmpathyComments` sheet (เชื่อมด้วย `postId = channelId`)
- **ChannelLikes** / **CommentLikes** — tracking per-user ด้วย `userKey = userId`

#### EmpathyBoard (หน้าแรก)

- โหลด `praisedPeople` จาก `getEmpathyPeople` — GAS merge channels ของคนเดียวกัน (empCode dedup) แล้วส่งกลับ 1 entry ต่อคน พร้อม `commentCount` รวม
- แสดงสูงสุด 12 cards เรียงตาม comment ล่าสุด
- Image: GAS return `imgId` → frontend batch fetch จาก Drive หลัง render

#### EmpDetailModal (คลิก card)

- แสดง empathy posts เก่า (จาก `EmpathyPosts` sheet) ของคนนั้น
- Like post: optimistic update → `toggleLike` → sync server count กลับ
- `_liked` state ต่อ user: GAS scan `EmpathyLikes` sheet โดยใช้ `userKey` ที่ส่งไปพร้อม request

#### EmpathyModal (ส่งคำชื่นชม)

- **Grid view**: โหลด `praisedPeople` เหมือน Board + ค้นหา real-time
- **เพิ่มคนใหม่**: ค้นหาจาก employee directory → `ensurePost` สร้าง channel ถ้ายังไม่มี → `recordPraise` เพิ่มใน local list ทันที
- **Thread view**: คลิกชื่อคน → โหลด comments ของ channel นั้น (`getEmpathyComments?postId=channelId&userKey=xxx`) พร้อม `_liked` ต่อ user
- **ส่งคำชื่นชม**: optimistic push ไปใน `postComments[channelId]` → `addComment` → replace temp comment ด้วย server id — invalidate LS cache ทันที
- **Nested replies**: `parentId` field — frontend จัด nesting เอง (component ทำ flatten → tree)
- **Channel like**: `toggleChannelLike` track ใน `ChannelLikes` sheet แยกจาก post likes
- **Comment like**: `toggleCommentLike` track ใน `CommentLikes` sheet

---

### ⭐ Star Gang

- โหลด employees ที่มี `inStarGang = true` จาก `getEmployees?inStarGang=true`
- progress bar คำนวณจาก `count / 30 * 100`
- **JOIN**: `joinStarGang` อัปเดต `inStarGang`, `starGangName`, `starGangRole` ใน Employees sheet — invalidate `star_gang` LS cache

---

### 📅 Activities — กิจกรรมรายเดือน

**Flow:**

1. `MonthsGrid` โหลด `getActivities` แล้วแสดง event preview ใน grid card (สูงสุด 2 events ต่อเดือน)
2. คลิกเดือน → `MonthModal` filter กิจกรรมตาม `monthIdx`
3. คลิกกิจกรรม → แสดง detail panel แบบ slide-in พร้อม steps

**ลงทะเบียน:**

- `activitiesService.joinActivity` → insert สู่ `activity_joins` table
- Optimistic update ทันที (ปุ่มเปลี่ยนเป็น "✅ Stamped")
- Stamp เก็บใน `activities.store` → `getMyStamps`

**รับรางวัล:**

- กด "🥚 รับรางวัล" → `claimActivityReward` → animation แกะไข่
- DB constraint + RPC ป้องกัน double claim
- เพิ่ม points ผ่าน reward system อัตโนมัติ

---

### 📚 Training & Development

TrainingModal มี 8 หมวดหมู่ทักษะ แต่ละหมวดมี courses อยู่ภายใน

| หมวด                | key           | สี       |
| ------------------- | ------------- | -------- |
| Annual Training     | `annual`      | น้ำเงิน  |
| IDP                 | `idp`         | ม่วง     |
| Internal Blog       | `blog`        | ชมพู     |
| External Training   | `external`    | เหลือง   |
| Compulsory Program  | `compulsory`  | แดง      |
| SuperSkills 2026    | `superskills` | เขียว    |
| Site Visit          | `site`        | ฟ้า      |
| Talent & Leadership | `leadership`  | ม่วงเข้ม |

**ลงทะเบียน course:**

- `register(trainingId)` → `trainingService.registerTraining` → insert สู่ `training_registrations` table
- ตรวจสอบ: UNIQUE constraint ป้องกัน duplicate registration
- Optimistic: เพิ่ม `trainingId` เข้า `myTrainingIds` ทันที → ปุ่มเปลี่ยนสถานะ
- ยกเลิก: `cancelRegistration` ลบจาก `training_registrations`

**IDP:**

- Posters: รูปขนาดใหญ่พร้อม link — ดึงจาก Supabase + batch image fetch
- Videos: เปิดดูผ่าน Edge Function → stream จาก Drive

**Site Visit:**

- โหวตสถานที่ที่อยากไป (1 คน 1 โหวต) → `voteSite` เก็บใน `site_votes` table
- ยกเลิกโหวตได้: `cancelSiteVote`
- แสดง voteCount real-time (optimistic +1/-1)

**รีวิว:**

- หลังเข้าอบรม → ให้ดาว 1-5 + ความเห็น → `submitTrainingReview`
- Optimistic: คำนวณ avg ใหม่ทันที (`(oldAvg * oldCount + newStars) / newCount`)
- แสดง avg rating + จำนวน reviews ที่ card

---

### 🔔 Notifications

**Flow:**

- โหลดครั้งแรกหลัง 3 วินาที (deferred) เพื่อไม่แย่ง critical data
- Supabase RPC `get_notifications` + localStorage read tracking
- localStorage offline read state ซิงค์อัตโนมัติ

**Unread badge:**

- `unreadCount = items.filter(n => !readIds.has(n.id)).length`
- sync → `ui.notifBadge` → แสดงบน bottom nav icon

**Mark as read:**

- กด notification → `markRead(id)` อัปเดต `readIds` (Set) ทันที → persist LS → fire-and-forget `markNotifsRead` ไป GAS (ไม่รอ response)
- "Mark all read" → เพิ่มทุก id เข้า Set พร้อมกัน → 1 batch request ไป GAS

**Cache:** 5 นาที ต่อ employee — hydrate จาก LS ก่อน (ผู้ใช้เห็น notifications เก่าทันที แล้วรอ fresh data)

---

### 🏆 DS Reward

**Point levels:**
| Level | ชื่อ | min pts | next |
|---|---|---|---|
| 0 | 🌱 Newcomer | 0 | 100 |
| 1 | ⭐ Member | 100 | 300 |
| 2 | 🔥 Active | 300 | 600 |
| 3 | 💎 Champion | 600 | 1000 |
| 4 | 👑 Legend | 1000+ | — |

**วิธีได้ points:** ตามที่ admin กำหนดใน Reward Rules (เช่น ส่ง empathy = +10, daily checkin = +5, ลงทะเบียน activity = +20)

**Daily Checkin:**

- ตรวจสอบจาก localStorage (`ds_checkin_date`) ก่อน — ถ้าเช็กอินวันนี้แล้ว ปุ่มล็อกทันที (ไม่ต้องรอ GAS)
- กดเช็กอิน → `dailyCheckin` → GAS ตรวจ `RewardPoints` sheet ว่าวันนี้มี record แล้วหรือยัง
- ถ้ายังไม่มี → เพิ่ม points + return `{ alreadyCheckedIn: false }` → reload points
- ถ้ามีแล้ว → return `{ alreadyCheckedIn: true }` → ล็อกปุ่มฝั่ง client

**Progress bar:** `(currentPts - levelMin) / (nextLevel - levelMin) * 100`

---

### 💡 เสนอไอเดีย

- เลือกหมวด: 🎉 สังสรรค์ / 🏃 กีฬา / 📚 เรียนรู้ / 🤝 CSR / 🎨 ครีเอทีฟ / 💬 อื่นๆ
- กรอกชื่อและรายละเอียด → `submitIdea` บันทึกใน Ideas sheet (status เริ่มต้น: "รอพิจารณา")
- Optimistic: ไอเดียใหม่แสดงทันทีที่ด้านบนของ list
- ดูสถานะ: ⏳ รอพิจารณา / ✅ อนุมัติ / ❌ ปฏิเสธ (admin อัปเดตผ่าน `adminUpdateIdea`)

---

### 🧠 Mental Health Consultation

ระบบมี 2 มุมมอง: **ผู้ส่ง** และ **ที่ปรึกษา (Counselor)**

**ผู้ส่ง (ทุกคน):**

1. เปิด MentalModal → โหลด advisors (`getMentalAdvisors`) พร้อม employee images
2. เลือกที่ปรึกษา → เขียนข้อความ → `submitConsultRequest` บันทึกใน `ConsultRequests` sheet (ไม่เก็บชื่อผู้ส่งในการแสดงผล)
3. ดูประวัติการส่งและ replies ของตัวเองใน `CounselorInboxModal` (ผู้ส่ง view)

**ที่ปรึกษา (Counselor):**

- ระบบตรวจสอบด้วย `isCounselor(userId)` — ถ้า `userId` อยู่ใน `MentalAdvisors.employeeId` → แสดง inbox icon
- เปิด `CounselorInboxModal` → โหลด `getConsultRequests?counselorEmployeeId=xxx`
- กดอ่าน → `markConsultRead` อัปเดต `isRead` ใน sheet
- ตอบกลับ → `addConsultReply` บันทึก `reply` + `repliedAt` ใน sheet → ผู้ส่งเห็นใน inbox ของตัวเอง

---

### 💰 Financial Consultation

เปิด FinancialModal แสดงข้อมูลติดต่อที่ปรึกษาการเงิน (static content)

---

### 📝 Internal Blog

- โหลด `getBlogPosts` (cache 1 นาที)
- หมวดหมู่: 📢 ข่าวสาร / 💡 เทคนิค / 🌟 ประสบการณ์ / 🎉 กิจกรรม / 💬 อื่นๆ
- ทุกคนเขียนบทความได้: กรอกหัวข้อ + เนื้อหา + เลือกหมวด → `addBlogPost` (POST)
- Optimistic: บทความใหม่ขึ้นด้านบนทันที — replace ด้วย server id เมื่อ GAS ตอบ
- Admin ลบ/แก้ไขบทความได้ผ่าน AdminBlogView

---

### 🤝 Team Culture (FIRE)

| ค่านิยม                | ความหมาย                  |
| ---------------------- | ------------------------- |
| **F** — Flexible       | ยืดหยุ่น ปรับตัวได้       |
| **I** — Impact         | สร้างผลลัพธ์ที่มีความหมาย |
| **R** — Responsibility | รับผิดชอบต่องานและทีม     |
| **E** — Excellence     | มุ่งสู่ความเป็นเลิศ       |

CultureModal แสดง FIRE values พร้อม visual cards — static content ไม่มี GAS call

---

### 👤 Profile

- ดู empCode, ชื่อ, ตำแหน่ง, แผนก (โหลดจาก `userAuth` store ที่ sync กับ LS)
- **แก้ไขข้อมูล**: `updateEmployeeSelf` อัปเดต Employees sheet → `_persist` refresh LS ทันที
- **เปลี่ยนรูป**: บีบอัดด้วย `useImageCompress` → POST base64 → `adminUploadProfileImage` อัปโหลดไป Drive → อัปเดต `imgUrl` + `imgId` ใน Employees sheet → refresh `userImgUrl` ใน store
- **Background sync**: ทุกครั้งที่เปิดแอป (5s delay) เปรียบเทียบข้อมูล LS กับ Employees sheet — ถ้าต่างกันเรียก `_persist` อัปเดตทันที (sync ข้ามอุปกรณ์)

---

### 🔧 Admin Panel (`/admin`)

Login แยกต่างหากด้วย username + password → GAS ออก token → เก็บใน `admin_token` LS
ทุก request ส่ง `token` ไปด้วย — GAS ตรวจก่อนทุก action

| หน้า             | สิ่งที่ทำได้                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Dashboard**    | ภาพรวมระบบ — จำนวน employees, activities, ideas                                                  |
| **Employees**    | เพิ่ม/แก้ไข/ลบพนักงาน + อัปโหลดรูปโปรไฟล์ (`adminUploadProfileImage`)                            |
| **Birthdays**    | เพิ่ม/แก้ไขข้อมูลวันเกิด + อัปโหลดรูปวันเกิด                                                     |
| **Empathy**      | ดูและลบ posts/comments/channels ที่ไม่เหมาะสม (`adminDeletePost/Comment/Channel`)                |
| **Ideas**        | รีวิวไอเดีย + อัปเดตสถานะ (`adminUpdateIdea`)                                                    |
| **Activities**   | สร้าง/แก้ไข/ลบกิจกรรม (POST/GET) + ดู registrations                                              |
| **Training**     | จัดการ trainings + IDP posters (อัปโหลดรูปผ่าน `adminUploadIdpImage`) + IDP videos + site visits |
| **Mental**       | ดู consult requests (unread badge) + ตอบกลับ (`addConsultReply`)                                 |
| **Reward Rules** | CRUD reward rules — action name + points                                                         |
| **Blog**         | เพิ่ม/แก้ไข/ลบบทความ                                                                             |
| **Announcement** | จัดการ banner ข้อความ + อัปโหลดวิดีโอ (`uploadAnnouncementVideo`)                                |

---

## Image Architecture (3-Tier Cache)

GAS endpoints ไม่ fetch Drive images inline (เดิมใช้เวลา ~22s) แต่ return `imgId` แทน

```
GAS ScriptCache  (60 min, shared across all users)
       ↓ miss
 localStorage    (60 min, per device)   ← โหลดตอน module init
       ↓ miss
  In-memory Map  (per session)          ← getCached() synchronous
       ↓ miss
  fetchImages(ids) → GAS getImages      ← batch fetch (50ms debounce) หลัง page render
```

- `getCached(imgId)` — synchronous, instant บน repeat visit
- `fetchImages(imgIds)` — batch debounce 50ms รวม request จากทุก component
- ผล: โหลดครั้งแรก < 5s, ครั้งต่อไป < 1s

---

## Caching Strategy (localStorage)

| Key                  | TTL                   | เนื้อหา                          |
| -------------------- | --------------------- | -------------------------------- |
| `bday_m{0-11}`       | 60 นาที               | Birthday employees รายเดือน      |
| `empathy_posts`      | invalidate on like    | Empathy posts                    |
| `empathy_people`     | invalidate on comment | Praised people list              |
| `dsc_cm_{channelId}` | 2 นาที                | Comments per channel             |
| `activities`         | 5 นาที                | กิจกรรมทั้งหมด                   |
| `team_list`          | 10 นาที               | Team members                     |
| `team_dir`           | 10 นาที               | Employee directory               |
| `star_gang`          | 10 นาที               | Star Gang members                |
| `dsc_imgcache`       | 60 นาที               | Drive image base64 map           |
| `ds_emp_likes`       | ถาวร                  | Like state (comments + channels) |

---

## GAS Endpoints

### GET Endpoints

| Action                 | Parameters                                        | Returns                            |
| ---------------------- | ------------------------------------------------- | ---------------------------------- |
| `getEmployees`         | `inTeam`, `inStarGang`                            | Employee array                     |
| `addTeamMember`        | `empCode`                                         | Updated employee                   |
| `joinStarGang`         | `empCode`, `starGangName`, `starGangRole`         | Updated employee                   |
| `updateEmployeeSelf`   | `id`, fields                                      | Updated employee                   |
| `getBirthdays`         | `monthIdx`                                        | Birthday employees                 |
| `getBirthdayWishes`    | `birthdayKey`                                     | Wishes array                       |
| `addBirthdayWish`      | `birthdayKey`, `msg`, `fromName`, `fromAvIdx`     | Created wish                       |
| `getEmpathyPeople`     | —                                                 | People with merged commentCount    |
| `getEmpathyPosts`      | `userKey?`                                        | Posts array with `_liked` per user |
| `getEmpathyComments`   | `postId`, `userKey?`                              | Comments with `_liked`             |
| `addComment`           | `postId`, `text`, `authorName`, `parentId?`       | Created comment                    |
| `ensurePost`           | `recEmployeeId`, `recName`, `recRole`             | Post (created or existing)         |
| `toggleLike`           | `postId`, `userKey`                               | `{ liked, likeCount }`             |
| `toggleCommentLike`    | `commentId`, `userKey`                            | `{ liked, likeCount }`             |
| `toggleChannelLike`    | `channelId`, `userKey`                            | `{ liked, likeCount }`             |
| `getChannelLike`       | `channelId`, `userKey`                            | `{ liked, likeCount }`             |
| `setEmpathyPhoto`      | `empCode`, `imgUrl`                               | `{ empCode, updated }`             |
| `getIdeas`             | —                                                 | Ideas array                        |
| `submitIdea`           | `category`, `title`, `detail`, `submitterName`    | Created idea                       |
| `getActivities`        | `monthIdx?`                                       | Activities array                   |
| `joinActivity`         | `activityId`, `employeeName`                      | `{ alreadyJoined, joinCount }`     |
| `getMyStamps`          | `employeeName`                                    | Stamps array                       |
| `claimActivityReward`  | `activityId`, `employeeName`                      | Reward result                      |
| `getNotifications`     | `name`                                            | Notifications array                |
| `getNotifReads`        | `name`                                            | Read notification IDs              |
| `markNotifsRead`       | `name`, `ids`                                     | OK                                 |
| `getMyPoints`          | `name`                                            | `{ points }`                       |
| `getRewardRules`       | —                                                 | Reward rules array                 |
| `dailyCheckin`         | `name`                                            | `{ points, alreadyCheckedIn }`     |
| `getTrainings`         | `type?`                                           | Trainings array                    |
| `registerTraining`     | `trainingId`, `employeeName`                      | Registration result                |
| `cancelRegistration`   | `trainingId`, `employeeName`                      | Cancel result                      |
| `getMyTrainings`       | `employeeName`                                    | Registered trainings               |
| `submitTrainingReview` | `trainingId`, `employeeName`, `rating`, `comment` | Created review                     |
| `getTrainingReviews`   | `trainingId`                                      | Reviews array                      |
| `getSiteVisits`        | —                                                 | Site visits array                  |
| `voteSite`             | `siteId`, `employeeName`                          | Vote result                        |
| `cancelSiteVote`       | `siteId`, `employeeName`                          | Cancel result                      |
| `getMySiteVotes`       | `employeeName`                                    | Voted site IDs                     |
| `getIdpPosters`        | —                                                 | IDP posters array                  |
| `getIdpVideos`         | —                                                 | IDP videos array                   |
| `getMentalAdvisors`    | —                                                 | Advisors array                     |
| `submitConsultRequest` | `advisorId`, `message`                            | Created request                    |
| `getConsultRequests`   | `advisorId`                                       | Requests array                     |
| `getMyConsultRequests` | `userKey`                                         | My requests                        |
| `addConsultReply`      | `requestId`, `reply`                              | Updated request                    |
| `getBlogPosts`         | `type?`                                           | Blog posts array                   |
| `getAnnouncement`      | —                                                 | Announcement object                |
| `getVideoUrl`          | `fileId`                                          | Streamable video URL               |
| `getImages`            | `imgIds` (comma-separated)                        | `{ imgId: base64 }` map            |
| `userCheckPassword`    | `empCode`, `password`                             | `{ ok }`                           |

### POST Endpoints

| Action                    | Payload                                  | Returns             |
| ------------------------- | ---------------------------------------- | ------------------- |
| `uploadImage`             | `base64`, `fileName`, `folderType`       | `{ id, url }`       |
| `uploadAnnouncementVideo` | `base64`, `fileName`                     | `{ fileId }`        |
| `adminUploadProfileImage` | `token`, `empId`, `base64`               | `{ imgUrl, imgId }` |
| `adminUploadIdpImage`     | `token`, `base64`, `fileName`            | `{ id, url }`       |
| `addBlogPost`             | `title`, `content`, `type`, `authorName` | Created post        |
| `adminAddActivity`        | `token`, activity fields                 | Created activity    |
| `adminUpdateActivity`     | `token`, `id`, fields                    | Updated activity    |
| `userSetPassword`         | `empCode`, `password`                    | OK                  |
| `login`                   | `username`, `password`                   | `{ token, name }`   |

---

## Dev Setup

```bash
# 1. Install dependencies
cd app && npm install

# 2. Configure Supabase credentials
#    Copy app/.env.example → app/.env and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
cp app/.env.example app/.env

# 3. Start dev server
npm run dev

# 4. Build for production
npm run build
```

---

## Supabase Schema

ดู migrations ทั้งหมดได้ที่ `supabase/migrations/` ซึ่งครอบคลุม:

- Users & auth (`employees`, `auth` integration)
- Birthday (`birthdays`, `birthday_wishes`)
- Empathy (`empathy_comments`, `empathy_likes`, `comment_likes`, `channel_likes`)
- Activities (`activities`, `activity_joins`, `activity_tickets`)
- Ideas (`ideas`)
- Rewards & points (`rewards`, `point_rules`, `daily_checkins`)
- Training (`training_registrations`, `site_votes`, `training_reviews`)
- Mental health (`mental_advisors`, `consult_requests`)
- Notifications (`get_notifications` RPC)
- Gifts (`gifts`, `gift_claims`)
- Presence (`user_presence`, `presence_logs`)
- Settings (`settings`)

RLS policies และ RPC functions อยู่ใน migrations เดียวกัน
| Trainings | id, type, title, description, date, location, maxSlots, joinCount, imgUrl, steps, reviewEnabled |
| TrainingRegistrations | id, trainingId, employeeName, registeredAt |
| TrainingReviews | id, trainingId, employeeName, rating, comment, createdAt |
| SiteVisits | id, name, description, date, location, imgUrl, voteCount |
| SiteVotes | id, siteId, employeeName, votedAt |
| IdpPosters | id, title, imgUrl, imgId, link |
| IdpVideos | id, title, fileId, description |
| MentalAdvisors | id, name, role, imgUrl, imgId |
| ConsultRequests | id, advisorId, message, reply, createdAt, readAt |
| BlogPosts | id, title, content, type, authorName, imgUrl, createdAt |
| Announcement | title, body, videoFileId, updatedAt |
| UserPasswords | empCode, passwordHash |

> **imgUrl format:** `drive:FILE_ID` = GAS proxy ผ่าน `getImages` / plain URL = ใช้ตรง

---

## Responsive

| Breakpoint        | Layout                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Mobile `< 640px`  | Bottom navigation bar, modals slide up from bottom (sheet), no zoom (`user-scalable=no`) |
| Desktop `≥ 640px` | Sidebar navigation (240px), modals centered (max-width 480px)                            |

**Modal scroll lock:** `body.modal-open { overflow: hidden; touch-action: none }` — ป้องกัน scroll background ขณะ modal เปิด
