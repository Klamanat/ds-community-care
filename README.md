# DS Community Care

Web App สำหรับทีม **Digital Solutions** — ดูแลสุขภาพ ความเป็นอยู่ และวัฒนธรรมองค์กรของสมาชิกในทีม

---

## Tech Stack

| ส่วน | รายละเอียด |
|---|---|
| **Frontend** | Vue 3 (Composition API) + Vite + Pinia + Vue Router (hash history) |
| **Styling** | Tailwind CSS v3 + `global.css` (single source of truth) |
| **Backend** | Google Apps Script Web App (doGet / doPost) |
| **Database** | Google Sheets |
| **Deploy** | Vercel / Netlify (static SPA) |

---

## โครงสร้างโปรเจกต์

```
ds-community-care/
├── app/                              # Vite project (frontend)
│   ├── index.html                    # Entry HTML — viewport no-zoom, Google Fonts
│   ├── vite.config.js                # Proxy /api → GAS URL (dev only)
│   ├── src/
│   │   ├── main.js                   # createApp + Pinia + Router + mount
│   │   ├── App.vue                   # Shell: Layout + BottomNav + all modals
│   │   ├── router/index.js           # User routes + Admin routes + guards
│   │   ├── styles/global.css         # CSS ทั้งหมด (Tailwind + components)
│   │   ├── stores/                   # Pinia stores
│   │   │   ├── ui.js                 # Modal state, toast, currentUser, notif badge
│   │   │   ├── userAuth.js           # User login/logout, background profile sync
│   │   │   ├── admin.js              # Admin token auth
│   │   │   ├── empathy.js            # Posts, people, comments, likes (channel + comment)
│   │   │   ├── birthday.js           # Birthday employees by month, wishes
│   │   │   ├── team.js               # empTeam, empDirectory, Star Gang
│   │   │   ├── ideas.js              # Ideas list + submit
│   │   │   ├── activities.js         # Monthly activities, stamps, rewards
│   │   │   ├── mental.js             # Mental health advisors + consult requests
│   │   │   ├── notif.js              # Notification items + unread count
│   │   │   ├── reward.js             # Points balance + reward rules
│   │   │   ├── training.js           # Trainings, IDP posters/videos, site visits
│   │   │   └── blog.js               # Blog posts
│   │   ├── services/                 # GAS API wrappers
│   │   │   ├── api.js                # gasGet / gasPost (CORS, error handling)
│   │   │   ├── imageService.js       # Drive image cache (3-tier: ScriptCache → LS → Map)
│   │   │   ├── teamService.js        # Employee directory — dedup concurrent calls
│   │   │   ├── empathyService.js     # Empathy CRUD
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
│   └── .env                          # VITE_GAS_URL=https://script.google.com/...
└── gas/                              # Google Apps Script files
    ├── Code.gs                       # doGet / doPost router + keepAlive trigger
    ├── Utils.gs                      # helpers + ScriptCache + Drive image proxy
    ├── Employees.gs                  # getEmployees, addTeamMember, joinStarGang
    ├── Birthdays.gs                  # getBirthdays, getBirthdayWishes, addBirthdayWish
    ├── Empathy.gs                    # posts, people, comments, likes (post/comment/channel)
    ├── Activities.gs                 # getActivities, joinActivity, stamps, rewards
    ├── Ideas.gs                      # getIdeas, submitIdea
    ├── Mental.gs                     # getMentalAdvisors, submitConsultRequest, addConsultReply
    ├── Notifications.gs              # getNotifications, markNotifsRead
    ├── Rewards.gs                    # getMyPoints, dailyCheckin, getRewardRules
    ├── Training.gs                   # getTrainings, registerTraining, getSiteVisits, getIdpPosters
    ├── Blog.gs                       # getBlogPosts, addBlogPost
    ├── UserAuth.gs                   # userCheckPassword, userSetPassword
    ├── Admin.gs                      # adminGetAll, adminUpdateRow, adminDeleteRow
    ├── DriveUpload.gs                # uploadImage, adminUploadProfileImage
    ├── Idp.gs                        # getIdpPosters, getIdpVideos, adminAdd/Update/Delete
    └── Setup.gs                      # sheet initialization helpers
```

---

## Architecture Overview

```
Browser
  └── Vue SPA (hash routing: /#/, /#/star, /#/idea ...)
        ├── Pinia Store (reactive state + localStorage cache)
        │     └── Service layer (gasGet / gasPost)
        │           └── GAS Web App (doGet / doPost)
        │                 └── Google Sheets (data store)
        │                 └── Google Drive (image store)
        └── imageService (3-tier cache: ScriptCache → localStorage → in-memory Map)
```

**CORS:** GAS sets `Access-Control-Allow-Origin: *` หลัง redirect → client ต้องใช้ `{ redirect: 'follow' }`
**Dev proxy:** Vite proxy `/api` → GAS URL เพื่อหลีกเลี่ยง CORS บน localhost
**Thai encoding:** `URLSearchParams` auto-encode UTF-8 — ไม่ต้อง encode เอง

---

## Authentication

### User Login (`/login`)
1. ผู้ใช้กรอก **empCode** (รหัสพนักงาน)
2. Frontend เรียก `getEmployees` → GAS ดึงทุกแถวจาก Employees sheet
3. หา employee ที่ตรงกับ `empCode` (case-insensitive)
4. บันทึก `user_id`, `user_name`, `user_role`, `user_imgid`, `user_img`, `user_dept`, `user_slogan` ใน localStorage
5. Redirect ไปหน้า Home
6. Route guard (`router.beforeEach`) ตรวจ `user_id` ใน localStorage — ถ้าไม่มี redirect กลับ `/login`
7. Background sync (5s delay): เปรียบเทียบข้อมูลกับ Sheets ทุกครั้งที่เปิดแอป — sync ชื่อ/ตำแหน่ง/รูปอัตโนมัติ

### Admin Login (`/admin/login`)
- แยกออกจาก user login ใช้ username + password
- GAS ตรวจสอบ credentials → return JWT-like `token`
- บันทึก `admin_token`, `admin_name` ใน localStorage
- Route guard ตรวจ `admin_token` ก่อนเข้าทุก `/admin/*`
- Token หมดอายุ → GAS return `"Invalid token"` → frontend clear token + redirect `/admin/login` อัตโนมัติ

---

## Performance

### GAS Keep-Alive
GAS V8 sleeps หลังไม่มีการใช้งาน ~5 นาที → cold start 10-20s ต่อ request
แก้ไขด้วย Time-based trigger ทุก 5 นาที: ติดตั้งครั้งเดียวด้วย `installKeepAliveTrigger()` ใน GAS editor

### Deferred Loading
| เวลา delay | สิ่งที่โหลด |
|---|---|
| 0s (ทันที) | Birthday, Empathy posts/people |
| 2.5s | Monthly activities (below fold) |
| 3s | Notifications (badge only) |
| 5s | Background profile sync |

### Promise Dedup (`teamService.js`)
`getEmployees` ถูกเรียกพร้อมกันจากหลาย store → dedup ด้วย in-flight promise cache (30s TTL)
ผล: 3-5 concurrent calls → 1 GAS request

### Optimistic Updates
Store อัปเดต state ก่อน → เรียก GAS → revert ถ้า error (likes, comments, joins ทั้งหมด)

---

## Features

---

### 🏠 Home — หน้าหลัก

หน้าแรกโหลด Birthday + Empathy ก่อน (0s) แล้วค่อย Activities (2.5s delay) เพื่อลด perceived load time

| Section | สิ่งที่ทำได้ | ข้อมูลจาก |
|---|---|---|
| 🎊 กิจกรรมและข่าวสาร | วันเกิดเดือนนี้ + shortcut ไป Culture / Training / Reward | `birthday.js` → `getBirthdays` |
| 💙 Consult Service | เปิด MentalModal / FinancialModal โดยตรง | static modal |
| 🛠 Other | Star Gang, เสนอไอเดีย | — |
| 💝 Empathy Board | cards 12 คนล่าสุด — like / click ดูรายละเอียด | `empathy.js` → `getEmpathyPeople` |
| 📅 Activities | grid 12 เดือน คลิกเปิด MonthModal | `activities.js` → `getActivities` |

**Announcement Banner** — ดึง announcement จาก GAS เมื่อ login สำเร็จ แสดงครั้งเดียวต่อ session (ตรวจสอบด้วย `dsc_ann_seen` ใน localStorage) รองรับทั้งข้อความและวิดีโอ

---

### 🎂 Birthday Celebration

**Flow หลัก:**
1. `birthday.js` โหลด employees ตามเดือน (`getBirthdays?monthIdx=N`) cache 60 นาทีต่อเดือน
2. แสดงรูปพนักงานจาก Drive (batch fetch ผ่าน `imageService`)
3. ผู้ใช้คลิกชื่อ → `BdayModal` โหลด wishes ของคนนั้น (`getBirthdayWishes?birthdayKey=XX`)

**การส่งคำอวยพร:**
- เลือก avatar emoji + เขียนข้อความ → `addBirthdayWish` บันทึกใน `BirthdayWishes` sheet
- Optimistic update: wish แสดงทันทีก่อน GAS ตอบกลับ — revert ถ้า error

**อัปโหลดรูปวันเกิด:**
- เฉพาะพนักงานเจ้าของวันเกิด (ตรวจสอบด้วย `userId === birthday.employeeId`)
- บีบอัดรูปก่อน upload ผ่าน `useImageCompress` → `uploadImage` (POST base64 ไป Drive)
- อัปเดต Birthdays sheet ด้วย Drive URL ใหม่

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
- `joinActivity` บันทึกใน `ActivityJoins` sheet + นับ `joinCount`
- Optimistic update ทันที (ปุ่มเปลี่ยนเป็น "✅ Stamped")
- Stamp เก็บใน `getMyStamps?employeeName=xxx`

**รับรางวัล:**
- กด "🥚 รับรางวัล" → `claimActivityReward` → animation แกะไข่
- GAS ตรวจว่า claim แล้วหรือยัง (ป้องกัน double claim)
- เพิ่ม points ผ่าน reward system อัตโนมัติ

---

### 📚 Training & Development

TrainingModal มี 8 หมวดหมู่ทักษะ แต่ละหมวดมี courses อยู่ภายใน

| หมวด | key | สี |
|---|---|---|
| Annual Training | `annual` | น้ำเงิน |
| IDP | `idp` | ม่วง |
| Internal Blog | `blog` | ชมพู |
| External Training | `external` | เหลือง |
| Compulsory Program | `compulsory` | แดง |
| SuperSkills 2026 | `superskills` | เขียว |
| Site Visit | `site` | ฟ้า |
| Talent & Leadership | `leadership` | ม่วงเข้ม |

**ลงทะเบียน course:**
- `register(trainingId)` → `registerTraining` บันทึกใน `TrainingRegistrations` sheet
- ตรวจสอบ: ถ้า full (joinCount ≥ maxSlots) → error "เต็มแล้ว"
- Optimistic: เพิ่ม `trainingId` เข้า `myTrainingIds` ทันที → ปุ่มเปลี่ยนสถานะ
- ยกเลิก: `cancelRegistration` ลบออกจาก sheet + ลด `joinCount`

**IDP:**
- Posters: รูปขนาดใหญ่พร้อม link — ดึงจาก `getIdpPosters` + batch image fetch
- Videos: เปิดดูผ่าน `getVideoUrl?fileId=xxx` → stream จาก Drive

**Site Visit:**
- โหวตสถานที่ที่อยากไป (1 คน 1 โหวต) → `voteSite` เก็บใน `SiteVotes` sheet
- ยกเลิกโหวตได้: `cancelSiteVote`
- แสดง voteCount real-time (optimistic +1/-1)

**รีวิว:**
- หลังเข้าอบรม → ให้ดาว 1-5 + ความเห็น → `submitTrainingReview`
- Optimistic: คำนวณ avg ใหม่ทันที (`(oldAvg * oldCount + newStars) / newCount`)
- แสดง avg rating + จำนวน reviews ที่ card

---

### 🔔 Notifications

**Flow:**
- โหลดครั้งแรกหลัง 3 วินาที (deferred) เพื่อไม่แย่ง GAS request กับข้อมูล critical
- Fetch `getNotifications?employeeName=xxx&monthIdx=N` + `getNotifReads?employeeName=xxx` พร้อมกัน (`Promise.all`)
- Merge server readIds กับ localStorage readIds (union)

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

| ค่านิยม | ความหมาย |
|---|---|
| **F** — Flexible | ยืดหยุ่น ปรับตัวได้ |
| **I** — Impact | สร้างผลลัพธ์ที่มีความหมาย |
| **R** — Responsibility | รับผิดชอบต่องานและทีม |
| **E** — Excellence | มุ่งสู่ความเป็นเลิศ |

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

| หน้า | สิ่งที่ทำได้ |
|---|---|
| **Dashboard** | ภาพรวมระบบ — จำนวน employees, activities, ideas |
| **Employees** | เพิ่ม/แก้ไข/ลบพนักงาน + อัปโหลดรูปโปรไฟล์ (`adminUploadProfileImage`) |
| **Birthdays** | เพิ่ม/แก้ไขข้อมูลวันเกิด + อัปโหลดรูปวันเกิด |
| **Empathy** | ดูและลบ posts/comments/channels ที่ไม่เหมาะสม (`adminDeletePost/Comment/Channel`) |
| **Ideas** | รีวิวไอเดีย + อัปเดตสถานะ (`adminUpdateIdea`) |
| **Activities** | สร้าง/แก้ไข/ลบกิจกรรม (POST/GET) + ดู registrations |
| **Training** | จัดการ trainings + IDP posters (อัปโหลดรูปผ่าน `adminUploadIdpImage`) + IDP videos + site visits |
| **Mental** | ดู consult requests (unread badge) + ตอบกลับ (`addConsultReply`) |
| **Reward Rules** | CRUD reward rules — action name + points |
| **Blog** | เพิ่ม/แก้ไข/ลบบทความ |
| **Announcement** | จัดการ banner ข้อความ + อัปโหลดวิดีโอ (`uploadAnnouncementVideo`) |

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

| Key | TTL | เนื้อหา |
|---|---|---|
| `bday_m{0-11}` | 60 นาที | Birthday employees รายเดือน |
| `empathy_posts` | invalidate on like | Empathy posts |
| `empathy_people` | invalidate on comment | Praised people list |
| `dsc_cm_{channelId}` | 2 นาที | Comments per channel |
| `activities` | 5 นาที | กิจกรรมทั้งหมด |
| `team_list` | 10 นาที | Team members |
| `team_dir` | 10 นาที | Employee directory |
| `star_gang` | 10 นาที | Star Gang members |
| `dsc_imgcache` | 60 นาที | Drive image base64 map |
| `ds_emp_likes` | ถาวร | Like state (comments + channels) |

---

## GAS Endpoints

### GET Endpoints

| Action | Parameters | Returns |
|---|---|---|
| `getEmployees` | `inTeam`, `inStarGang` | Employee array |
| `addTeamMember` | `empCode` | Updated employee |
| `joinStarGang` | `empCode`, `starGangName`, `starGangRole` | Updated employee |
| `updateEmployeeSelf` | `id`, fields | Updated employee |
| `getBirthdays` | `monthIdx` | Birthday employees |
| `getBirthdayWishes` | `birthdayKey` | Wishes array |
| `addBirthdayWish` | `birthdayKey`, `msg`, `fromName`, `fromAvIdx` | Created wish |
| `getEmpathyPeople` | — | People with merged commentCount |
| `getEmpathyPosts` | `userKey?` | Posts array with `_liked` per user |
| `getEmpathyComments` | `postId`, `userKey?` | Comments with `_liked` |
| `addComment` | `postId`, `text`, `authorName`, `parentId?` | Created comment |
| `ensurePost` | `recEmployeeId`, `recName`, `recRole` | Post (created or existing) |
| `toggleLike` | `postId`, `userKey` | `{ liked, likeCount }` |
| `toggleCommentLike` | `commentId`, `userKey` | `{ liked, likeCount }` |
| `toggleChannelLike` | `channelId`, `userKey` | `{ liked, likeCount }` |
| `getChannelLike` | `channelId`, `userKey` | `{ liked, likeCount }` |
| `setEmpathyPhoto` | `empCode`, `imgUrl` | `{ empCode, updated }` |
| `getIdeas` | — | Ideas array |
| `submitIdea` | `category`, `title`, `detail`, `submitterName` | Created idea |
| `getActivities` | `monthIdx?` | Activities array |
| `joinActivity` | `activityId`, `employeeName` | `{ alreadyJoined, joinCount }` |
| `getMyStamps` | `employeeName` | Stamps array |
| `claimActivityReward` | `activityId`, `employeeName` | Reward result |
| `getNotifications` | `name` | Notifications array |
| `getNotifReads` | `name` | Read notification IDs |
| `markNotifsRead` | `name`, `ids` | OK |
| `getMyPoints` | `name` | `{ points }` |
| `getRewardRules` | — | Reward rules array |
| `dailyCheckin` | `name` | `{ points, alreadyCheckedIn }` |
| `getTrainings` | `type?` | Trainings array |
| `registerTraining` | `trainingId`, `employeeName` | Registration result |
| `cancelRegistration` | `trainingId`, `employeeName` | Cancel result |
| `getMyTrainings` | `employeeName` | Registered trainings |
| `submitTrainingReview` | `trainingId`, `employeeName`, `rating`, `comment` | Created review |
| `getTrainingReviews` | `trainingId` | Reviews array |
| `getSiteVisits` | — | Site visits array |
| `voteSite` | `siteId`, `employeeName` | Vote result |
| `cancelSiteVote` | `siteId`, `employeeName` | Cancel result |
| `getMySiteVotes` | `employeeName` | Voted site IDs |
| `getIdpPosters` | — | IDP posters array |
| `getIdpVideos` | — | IDP videos array |
| `getMentalAdvisors` | — | Advisors array |
| `submitConsultRequest` | `advisorId`, `message` | Created request |
| `getConsultRequests` | `advisorId` | Requests array |
| `getMyConsultRequests` | `userKey` | My requests |
| `addConsultReply` | `requestId`, `reply` | Updated request |
| `getBlogPosts` | `type?` | Blog posts array |
| `getAnnouncement` | — | Announcement object |
| `getVideoUrl` | `fileId` | Streamable video URL |
| `getImages` | `imgIds` (comma-separated) | `{ imgId: base64 }` map |
| `userCheckPassword` | `empCode`, `password` | `{ ok }` |

### POST Endpoints

| Action | Payload | Returns |
|---|---|---|
| `uploadImage` | `base64`, `fileName`, `folderType` | `{ id, url }` |
| `uploadAnnouncementVideo` | `base64`, `fileName` | `{ fileId }` |
| `adminUploadProfileImage` | `token`, `empId`, `base64` | `{ imgUrl, imgId }` |
| `adminUploadIdpImage` | `token`, `base64`, `fileName` | `{ id, url }` |
| `addBlogPost` | `title`, `content`, `type`, `authorName` | Created post |
| `adminAddActivity` | `token`, activity fields | Created activity |
| `adminUpdateActivity` | `token`, `id`, fields | Updated activity |
| `userSetPassword` | `empCode`, `password` | OK |
| `login` | `username`, `password` | `{ token, name }` |

---

## Dev Setup

```bash
# 1. Install dependencies
cd app && npm install

# 2. Configure GAS URL
echo "VITE_GAS_URL=https://script.google.com/macros/s/.../exec" > app/.env

# 3. Start dev server (proxies /api → GAS)
npm run dev

# 4. Build for production
npm run build
```

## GAS Deployment

1. Google Sheets → Extensions → Apps Script
2. Copy ไฟล์จาก `gas/` ทั้งหมด (Code.gs ก่อน)
3. Deploy → New Deployment → Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy URL → วางใน `app/.env` เป็น `VITE_GAS_URL`
5. ทดสอบ: `GET [URL]?action=getEmployees` → `{ "ok": true, "data": [] }`
6. ติดตั้ง keep-alive trigger: เปิด GAS editor → Run → `installKeepAliveTrigger` (ครั้งเดียว)

---

## Google Sheets Schema

| Sheet | Columns หลัก |
|---|---|
| Employees | id, empCode, name, role, dept, imgUrl (drive:ID), imgId, inTeam, inStarGang, starGangName, starGangRole, starGangSlogan |
| Birthdays | key, employeeId, name, role, monthIdx (0-11), date, fallbackIdx, imgUrl |
| BirthdayWishes | id, birthdayKey, fromName, fromAvIdx, msg, time, year |
| EmpathyPosts | id, recEmployeeId, recName, recRole, recImgUrl, sndName, msg, tag, likeCount, createdAt |
| EmpathyComments | id, postId, parentId, authorName, text, createdAt |
| EmpathyLikes | postId, userKey |
| EmpathyPhotos | empCode, imgUrl, updatedAt |
| CommentLikes | commentId, userKey |
| ChannelLikes | channelId, userKey |
| Ideas | id, category, title, detail, submitterName, createdAt, status |
| Activities | id, monthIdx, name, emoji, date, detail, imgUrl, joinOpen, joinCount, steps, rewardType |
| ActivityJoins | id, activityId, activityName, employeeName, joinedAt |
| Notifications | id, title, body, targetName, type, createdAt |
| NotifReads | notifId, userName |
| RewardPoints | id, userName, points, action, detail, createdAt |
| RewardRules | id, action, points, label |
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

| Breakpoint | Layout |
|---|---|
| Mobile `< 640px` | Bottom navigation bar, modals slide up from bottom (sheet), no zoom (`user-scalable=no`) |
| Desktop `≥ 640px` | Sidebar navigation (240px), modals centered (max-width 480px) |

**Modal scroll lock:** `body.modal-open { overflow: hidden; touch-action: none }` — ป้องกัน scroll background ขณะ modal เปิด
