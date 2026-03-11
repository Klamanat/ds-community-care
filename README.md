# DS Community Care

Web App สำหรับทีม **Digital Solutions** — ดูแลสุขภาพ ความเป็นอยู่ และวัฒนธรรมองค์กรของสมาชิกในทีม

---

## Tech Stack

| ส่วน | รายละเอียด |
|---|---|
| **Frontend** | Vue 3 (Composition API) + Vite + Pinia + Vue Router (hash history) |
| **Styling** | Tailwind CSS v3 + `global.css` (single source of truth) |
| **Backend** | Google Apps Script Web App (doGet / doPost) |
| **Database** | Google Sheets (7 sheets) |
| **Analytics** | Vercel Analytics (`track('pageview', ...)`) |
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
│   │   ├── router/index.js           # 7 user routes + 5 admin routes + guards
│   │   ├── styles/global.css         # CSS ทั้งหมด (Tailwind + components)
│   │   ├── stores/                   # Pinia stores
│   │   │   ├── ui.js                 # Modal state, toast, currentUser
│   │   │   ├── userAuth.js           # User login/logout, localStorage persist
│   │   │   ├── admin.js              # Admin token auth
│   │   │   ├── empathy.js            # Posts, people, comments, likes
│   │   │   ├── birthday.js           # Birthday employees by month, wishes
│   │   │   ├── team.js               # empTeam, empDirectory, Star Gang
│   │   │   ├── ideas.js              # Ideas list + submit
│   │   │   └── activities.js         # Monthly activities, stamps, rewards
│   │   ├── services/                 # GAS API wrappers
│   │   │   ├── api.js                # gasGet / gasPost (CORS, error handling)
│   │   │   ├── imageService.js       # Drive image cache (3-tier)
│   │   │   ├── empathyService.js     # Empathy CRUD
│   │   │   ├── birthdayService.js    # Birthday CRUD
│   │   │   ├── teamService.js        # Employee directory
│   │   │   ├── ideaService.js        # Ideas CRUD
│   │   │   └── activitiesService.js  # Activities + stamps + rewards
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
│   │   │   └── modals/               # BdayModal, EmpathyModal, EmpDetailModal, ProfileModal, ...
│   │   └── views/
│   │       ├── UserLoginView.vue
│   │       ├── HomeView.vue
│   │       ├── StarView.vue
│   │       ├── IdeaView.vue
│   │       ├── NotifView.vue
│   │       ├── SettingsView.vue
│   │       ├── BdayView.vue
│   │       ├── CultureView.vue
│   │       └── admin/                # AdminDashboard, AdminEmployees, AdminEmpathy, AdminIdeas, AdminActivities
│   └── .env                          # VITE_GAS_URL=https://script.google.com/...
└── gas/                              # Google Apps Script files
    ├── Code.gs                       # doGet / doPost router
    ├── Utils.gs                      # helpers + cache + Drive image proxy
    ├── Employees.gs
    ├── Birthdays.gs
    ├── Empathy.gs
    ├── Activities.gs
    └── Ideas.gs
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
4. บันทึก `user_id`, `user_empcode`, `user_name`, `user_role`, `user_img`, `user_dept` ใน localStorage
5. Redirect ไปหน้า Home
6. Route guard (`router.beforeEach`) ตรวจ `user_id` ใน localStorage — ถ้าไม่มี redirect กลับ `/login`

### Admin Login (`/admin/login`)
- แยกออกจาก user login ใช้ username + password
- GAS ตรวจสอบ credentials → return JWT-like `token`
- บันทึก `admin_token`, `admin_name` ใน localStorage
- Route guard ตรวจ `admin_token` ก่อนเข้าทุก `/admin/*`
- Token หมดอายุ → GAS return `"Invalid token"` → frontend clear token + redirect `/admin/login` อัตโนมัติ

---

## Features

---

### 🏠 Home — หน้าหลัก

หน้าแรกที่รวมทุกอย่างไว้ในที่เดียว แบ่งเป็น 5 section

| Section | สิ่งที่ทำได้ |
|---|---|
| 🎊 กิจกรรมและข่าวสาร | ดูว่าเดือนนี้มีใครเกิดวันเกิดบ้าง + เข้าถึง Team Culture / Training / DS Reward |
| 💙 Consult Service | เข้าสู่บริการปรึกษา Mental Health และ Financial ได้โดยตรง |
| 🛠 Other | เข้า Star Gang, เสนอไอเดีย (ตลาดนัดเร็วๆ นี้) |
| 💝 Empathy Board | ดูคำชื่นชมที่ทีมส่งให้กัน กด like หรือคลิกเพื่อดูรายละเอียด |
| 📅 Activities | เลือกเดือนเพื่อดูกิจกรรมที่จะจัดในเดือนนั้น |

---

### 🎂 Birthday Celebration

ระบบฉลองวันเกิดพนักงานรายเดือน — เปิดได้จาก Birthday Card บนหน้าแรก หรือแถบด้านล่าง

**ทำอะไรได้บ้าง:**

- **ดู Birthday Board** — เลือกดูทีละเดือน (มกราคม–ธันวาคม) จะเห็นรูปและชื่อพนักงานที่เกิดในเดือนนั้น
- **ส่งคำอวยพร** — คลิกชื่อพนักงาน → เขียนข้อความ → กดส่ง คำอวยพรจะแสดงให้ทุกคนเห็นใน thread ของคนนั้น
- **เห็นว่าใครส่งอวยพรไปแล้ว** — ทุก wish แสดงชื่อผู้ส่ง + avatar + เวลา
- **อัปโหลดรูป** — พนักงานเจ้าของวันเกิดสามารถอัปโหลดรูปตัวเองเพื่อแสดงบน board ได้
- **Surprise Box** (เฉพาะวันเกิดตัวเอง) — แถบพิเศษ "🎁 Surprise Box" จะปรากฏให้แตะเพื่อแกะไข่รับรางวัล

---

### 💝 Empathy Board — ส่งคำชื่นชม

พื้นที่ให้ทีมส่งคำชื่นชมและให้กำลังใจกัน มีสองมุมมอง

#### มุมมอง Board (หน้าแรก)
- เลื่อนดู empathy cards แนวนอน — เห็นรูป ชื่อ จำนวน ❤️ และ 💬
- คลิก card → ดูรายละเอียด post พร้อมข้อความชื่นชมและ comments ทั้งหมด
- กด ❤️ เพื่อ like post หรือ like comment ใด comment หนึ่ง

#### มุมมอง Thread (ส่งคำชื่นชม)
- เลือกคนที่ต้องการชื่นชมจาก grid — เห็นรูป ชื่อ ตำแหน่ง และจำนวนที่ถูกชื่นชม
- คลิกชื่อคน → เปิด thread ของคนนั้น เห็นคำชื่นชมทั้งหมดที่ทีมส่งให้
- เขียนคำชื่นชม + เลือก tag (🏷️ เก่งมาก / ขอบคุณ / สู้ๆ ฯลฯ) → กดส่ง
- **ตอบกลับ** comment ของคนอื่นได้ (nested replies)
- กด ❤️ ชื่นชมคนนั้นโดยรวม (channel like) หรือ like แต่ละ comment
- **ค้นหาชื่อ/ตำแหน่ง** ใน grid ได้ทันที
- **เพิ่มคนใหม่** ที่ยังไม่มีในรายการ — ค้นหาจาก employee directory แล้วเพิ่ม
- ส่งคำชื่นชม = **+10 LINE points** (แสดงเป็น reminder ในหน้า compose)

---

### ⭐ Star Gang

Hall of fame สำหรับพนักงานดาวเด่นประจำเดือน

**ทำอะไรได้บ้าง:**

- ดูรายชื่อสมาชิก Star Gang ทั้งหมดพร้อมรูปและตำแหน่ง
- เห็น progress bar ว่าตอนนี้มีสมาชิกกี่คน (เป้าหมาย 30 คน)
- กดปุ่ม **JOIN TEAM** เพื่อเข้าร่วม Star Gang ได้เลย — ชื่อและตำแหน่งจะถูกบันทึกทันที

---

### 📅 Activities — กิจกรรมรายเดือน

ดูและสมัครเข้าร่วมกิจกรรมที่จัดในแต่ละเดือน — เปิดจาก MonthsGrid หน้าแรก

**ทำอะไรได้บ้าง:**

- **ดูกิจกรรมรายเดือน** — เห็นรูป ชื่อกิจกรรม วันที่ สถานที่ และรายละเอียด
- **ดูขั้นตอนการเข้าร่วม** — กด "รายละเอียด" เพื่อดู steps แบบ slide-in panel
- **เปิด Link** — กิจกรรมที่มี URL ภายนอก สามารถกดเปิดได้ในหน้าเดียว
- **สมัครเข้าร่วม** — กดปุ่มสมัคร → ระบบบันทึกและนับจำนวนผู้เข้าร่วม (จะเห็น "✅ Stamped" ทันที)
- **รับ Stamp** — ทุกกิจกรรมที่สมัครจะได้ stamp เก็บไว้ใน "🏅 สแตมป์ของฉัน"
- **แกะไข่รับรางวัล** — เมื่อ stamp แล้ว กด "🥚 รับรางวัล" → แตะไข่เพื่อดูรางวัลที่ได้
- กิจกรรมที่ **ปิดรับสมัคร** จะแสดง "🔒 ปิดรับสมัคร" แทนปุ่ม

---

### 💡 เสนอไอเดีย

กล่องรับไอเดียกิจกรรมและข้อเสนอแนะถึงทีม HR

**ทำอะไรได้บ้าง:**

- เลือกหมวดหมู่: 🎉 สังสรรค์ / 🏃 กีฬา / 📚 เรียนรู้ / 🤝 CSR / 🎨 ครีเอทีฟ / 💬 อื่นๆ
- กรอกชื่อไอเดียและรายละเอียดเพิ่มเติม → กดส่ง
- ดูไอเดียทั้งหมดที่ทีมส่งมาแล้ว กรองดูทีละหมวดได้
- เห็นสถานะของแต่ละไอเดีย: ⏳ รอพิจารณา / ✅ อนุมัติ / ❌ ปฏิเสธ (admin อัปเดต)

---

### 🧠 Mental Health Consultation

บริการปรึกษาสุขภาพจิต **ปิดตัวตน 100%**

**ทำอะไรได้บ้าง:**

- เลือกที่ปรึกษาที่ต้องการส่งข้อความหา
- เขียนข้อความได้อย่างอิสระ — ระบบไม่เปิดเผยตัวตนผู้ส่ง
- ได้รับการดูแลจากทีมที่ปรึกษาด้านสุขภาพจิต

---

### 💰 Financial Consultation

บริการให้คำปรึกษาด้านการเงินสำหรับสมาชิกทีม

---

### 🤝 Team Culture (FIRE)

อธิบายค่านิยมหลักของทีม Digital Solutions

| ค่านิยม | ความหมาย |
|---|---|
| **F** — Flexible | ยืดหยุ่น ปรับตัวได้ |
| **I** — Impact | สร้างผลลัพธ์ที่มีความหมาย |
| **R** — Responsibility | รับผิดชอบต่องานและทีม |
| **E** — Excellence | มุ่งสู่ความเป็นเลิศ |

---

### 👤 Profile

จัดการข้อมูลส่วนตัวของตัวเอง — เปิดจากหน้า Settings

**ทำอะไรได้บ้าง:**

- ดู empCode, ชื่อ, ตำแหน่ง, แผนก
- **แก้ไขข้อมูล** — แก้ชื่อ ตำแหน่ง แผนกได้เอง (sync ไป Sheets อัตโนมัติ)
- **เปลี่ยนรูปโปรไฟล์** — กดที่รูป → เลือกไฟล์จากเครื่อง → แสดงทันที (upload ไป Drive ใน background)
- **ออกจากระบบ**

---

### 🔧 Admin Panel (`/admin`)

สำหรับทีม HR/Admin ในการจัดการข้อมูลทั้งระบบ — Login แยกต่างหาก

| หน้า | สิ่งที่ทำได้ |
|---|---|
| **Employees** | เพิ่ม/แก้ไข/ลบพนักงาน + จัดการข้อมูลวันเกิด |
| **Empathy** | ดูและลบ empathy posts ที่ไม่เหมาะสม |
| **Ideas** | รีวิวไอเดียและอัปเดตสถานะ (อนุมัติ/ปฏิเสธ) |
| **Activities** | สร้าง/แก้ไข/ลบกิจกรรมรายเดือน + อัปโหลดรูปกิจกรรม |

ทุก action ของ admin ต้องผ่านการตรวจสอบ token ที่ GAS ก่อนทุกครั้ง

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
  fetchImages(ids) → GAS getImages      ← batch fetch หลัง page render
```

- `getCached(imgId)` — synchronous, instant บน repeat visit
- `fetchImages(imgIds)` — batch, ส่งเฉพาะ `imgId` ที่ยังไม่มีใน cache
- ผล: โหลดครั้งแรก < 5s, ครั้งต่อไป < 1s

---

## Caching Strategy (localStorage)

| Key | TTL | เนื้อหา |
|---|---|---|
| `bday_m{0-11}` | 60 นาที | Birthday employees รายเดือน |
| `empathy_posts` | ทันทีที่ like/comment | Empathy posts |
| `empathy_people` | ทันทีที่ comment | Praised people list |
| `dsc_cm_{channelId}` | 2 นาที | Comments ของแต่ละ channel |
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
| `getBirthdays` | `monthIdx` | Birthday employees |
| `getBirthdayWishes` | `birthdayKey` | Wishes array |
| `addBirthdayWish` | `birthdayKey`, `msg`, `fromName`, `fromAvIdx` | Created wish |
| `getEmpathyPeople` | — | People with commentCount |
| `getEmpathyPosts` | — | Posts array |
| `getEmpathyComments` | `postId`, `userKey?` | Comments with `_liked` |
| `addComment` | `postId`, `text`, `authorName`, `parentId?` | Created comment |
| `toggleLike` | `postId`, `userKey` | `{ liked, likeCount }` |
| `toggleCommentLike` | `commentId`, `userKey` | `{ liked, likeCount }` |
| `toggleChannelLike` | `channelId`, `userKey` | `{ liked, likeCount }` |
| `getChannelLike` | `channelId`, `userKey` | `{ liked, likeCount }` |
| `getIdeas` | — | Ideas array |
| `submitIdea` | `category`, `title`, `detail`, `submitterName` | Created idea |
| `getActivities` | `monthIdx?` | Activities array |
| `joinActivity` | `activityId`, `employeeName` | `{ alreadyJoined, joinCount }` |
| `getMyStamps` | `employeeName` | Stamps array |
| `getImages` | `imgIds` (comma-separated) | `{ imgId: base64 }` map |

### POST Endpoints
| Action | Payload | Returns |
|---|---|---|
| `uploadImage` | `base64`, `fileName`, `folderType` | `{ id, url }` |
| `adminAddActivity` | `token`, activity fields | Created activity |
| `adminUpdateActivity` | `token`, `id`, fields | Updated activity |

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

---

## Google Sheets Schema

| Sheet | Columns หลัก |
|---|---|
| Employees | id, empCode, name, role, dept, imgUrl (drive:ID), inTeam, inStarGang, starGangName, starGangRole |
| Birthdays | key, employeeId, name, role, monthIdx (0-11), date, fallbackIdx, imgUrl |
| BirthdayWishes | id, birthdayKey, fromName, fromAvIdx, msg, time, year |
| EmpathyPosts | id, recEmployeeId, recName, recRole, recImgUrl, sndName, msg, tag, likeCount, createdAt |
| EmpathyComments | id, postId, parentId, authorName, text, likeCount, createdAt |
| EmpathyLikes | postId (or channelId/commentId), userKey, type |
| Ideas | id, category, title, detail, submitterName, createdAt, status |
| Activities | id, monthIdx, name, emoji, date, detail, imgUrl, joinOpen, joinCount, steps, rewardType |
| ActivityJoins | id, activityId, activityName, employeeName, joinedAt |

> **imgUrl format:** `drive:FILE_ID` = GAS จะ proxy ผ่าน `getImages` / plain URL = ใช้ตรง

---

## Responsive

| Breakpoint | Layout |
|---|---|
| Mobile `< 640px` | Bottom navigation bar, modals slide up from bottom (sheet), no zoom (`user-scalable=no`) |
| Desktop `≥ 640px` | Sidebar navigation (240px), modals centered (max-width 480px) |

**Modal scroll lock:** `body.modal-open { overflow: hidden; touch-action: none }` — ป้องกัน scroll background ขณะ modal เปิด
