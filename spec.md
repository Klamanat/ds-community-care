# DS Community Care — System Specification

> Version: 2.0 · Updated: 2026-05-15

---

## 1. Project Overview

**DS Community Care** คือแพลตฟอร์ม Employee Engagement สำหรับพนักงาน DS ใช้งานผ่าน Progressive Web App (PWA) บนมือถือและเดสก์ท็อป

### Goals
- สร้างชุมชนภายในองค์กรให้พนักงานมีส่วนร่วม
- ระบบสะสมคะแนนและรางวัลเพื่อสร้าง engagement
- ช่องทางสื่อสาร ประกาศ และข้อเสนอแนะ
- ดูแลสุขภาพจิตพนักงานผ่านที่ปรึกษา (counselor)

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + Tailwind CSS |
| State management | Pinia |
| Routing | Vue Router 4 |
| Backend / Database | Supabase (PostgreSQL + RLS + RPC) |
| Image storage | Supabase Storage (via Edge Functions) |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

### Key Dependencies
| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | ^2.99.2 | Database + auth |
| `vue` | ^3.4.0 | UI framework |
| `vue-router` | ^4.2.5 | Client routing |
| `pinia` | ^2.1.7 | State management |
| `html2canvas` | ^1.4.1 | Screenshot for sharing |
| `jsqr` | ^1.4.0 | QR code scanning |
| `@vercel/analytics` | ^1.6.1 | Usage analytics |

---

## 2. System Architecture

```
┌─────────────────────────────────────────┐
│           Browser (Vue 3 PWA)           │
│                                         │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │  User App    │  │   Admin Panel    │ │
│  │  /login → /  │  │  /admin/login    │ │
│  │  + features  │  │  /admin/*        │ │
│  └──────┬───────┘  └────────┬─────────┘ │
└─────────┼────────────────────┼───────────┘
          │                    │
          ▼                    ▼
┌─────────────────────────────────────────┐
│              Supabase                   │
│  PostgreSQL · RLS · RPC Functions       │
│  Storage (images)                       │
│  Edge Functions (upload/delete/cache)   │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         Google Drive (Images)           │
│   via Supabase Edge Function proxy      │
└─────────────────────────────────────────┘
```

### Supabase URL Strategy
- **Dev:** `VITE_SUPABASE_URL` env var
- **Prod:** `window.location.origin + '/supabase'` (proxied through Vercel)
- **Auth key:** `VITE_SUPABASE_ANON_KEY`

---

## 3. Authentication & Authorization

### User Login Flow

```
[Enter emp_code]
      │
      ▼
checkEmployee(empCode)
  → SELECT * FROM employees WHERE emp_code = $1
      │
      ├── Not found → Show error
      │
      ├── Found, no passcode → Redirect /set-password
      │         └── setPasscode() → RPC set_user_passcode
      │
      └── Found, has passcode → [Enter passcode]
                │
                ▼
          loginWithEmployee(empCode, passcode)
            → RPC verify_user_passcode
                │
                ├── Wrong → Show error
                │
                └── Correct → Create anonymous Supabase session
                              → Store profile in Pinia + localStorage
```

### Employee Profile Fields (`employees` table)

```sql
id              UUID PK
emp_code        TEXT UNIQUE       -- login identifier
name            TEXT
role            TEXT              -- 'admin' | 'counselor' | 'employee'
dept            TEXT
grad            TEXT              -- graduation/grade info
img_url         TEXT
img_id          TEXT              -- storage path
in_team         BOOLEAN
in_star_gang    BOOLEAN
star_gang_name  TEXT
star_gang_role  TEXT
star_gang_slogan TEXT
month_idx       INT               -- birth month index
bd_date         TEXT
fallback_idx    INT
passcode        TEXT              -- hashed, write-only
```

### User Roles & Access
| Role | User App | Admin Panel | Counselor Inbox |
|---|---|---|---|
| `admin` | ✅ | ✅ | ✅ |
| `counselor` | ✅ | ❌ | ✅ |
| `employee` | ✅ | ❌ | ❌ |

### Admin Auth
- แยกระบบจาก user auth
- `AdminLoginView` → `adminService.js` → credential check ผ่าน Supabase
- ไม่ใช้ anonymous session

---

## 4. App Shell Structure

### User App Shell
```
<AppHeader>         sticky top, gradient, logo + notifications
<AppSidebar>        off-canvas (mobile)
<main RouterView>   scrollable content area
<AppBottomNav>      fixed bottom navigation
<GlobalModals>      teleported to <body>
<Toast>             fixed bottom notification
```

### Global Modals (registered in App.vue)
`BdayModal` · `EmpathyModal` · `EmpDetailModal` · `FinancialModal` · `MentalModal` · `OrgModal` · `ProfileModal` · `MonthModal` · `CultureModal` · `TrainingModal` · `RewardModal` · `AnnouncementModal` · `ActivityTicketModal` · `NotifModal` · `BlogModal` · `CounselorInboxModal` · `MonthlyPlanModal`

---

## 5. Feature Modules

### 5.1 Home Screen

**Route:** `/`

**Layout:** Card grid — visibility และ background ควบคุมโดย Admin

| Card Key | Action | Description |
|---|---|---|
| `bday` | `modal-bday` | Birthday this month |
| `culture` | `modal-culture` | FIRE culture values |
| `training` | `modal-training` | Training courses |
| `reward` | `modal-reward` | Points & rewards |
| `monthly` | `modal-monthly-plan` | Monthly plan poster |
| `market` | teaser only | Marketplace (coming soon) |
| `idea` | `/idea` | Submit ideas |
| `fortune` | teaser only | Fortune card (coming soon) |
| `empathy` | `modal-emp` | Empathy board |
| `mental` | via ConsultCards | Mental health consult |
| `financial` | `modal-financial` | Financial info |

**Card Config (settings table):**
- Visibility: `card_<key>` → boolean
- Background: `card_bg_<key>` → CSS gradient string หรือ image URL

**Additional sections:**
- `<ConsultCards />` — ปุ่มหาที่ปรึกษา
- `<EmpathyBoard />` — กระดานข้อความ
- `<MonthsGrid />` — กิจกรรมรายเดือน

---

### 5.2 Rewards & Points

**Route:** `/` (modal-reward)  
**Tables:** `rewards`, `point_rules`  
**RPCs:** `get_my_points`, `get_my_points_history`, `daily_checkin`

#### Point Levels
| Level | Name | Range |
|---|---|---|
| 0 | Newcomer | 0 – 99 pts |
| 1 | Member | 100 – 299 pts |
| 2 | Active | 300 – 599 pts |
| 3 | Champion | 600 – 999 pts |
| 4 | Legend | 1,000+ pts |

#### `rewards` table
```sql
id, name, description
pts_cost      -- points to redeem
image_id, image_url
stock         -- NULL = unlimited
active        -- only active=true shown
created_at
```

#### `point_rules` table
```sql
id, name, description
pts           -- points awarded
type, subtype -- category
active        -- only active=true shown, sorted pts DESC
```

#### Point History (from RPC)
```
id, type, subtype, amount, desc, createdAt
```

#### Business Rules
- Daily check-in: 1 ครั้ง/วัน (guard ด้วย localStorage `ds_checkin_date`)
- Points เป็น additive เท่านั้น ไม่มีการหักคะแนน
- Redemption เป็น transaction แยกต่างหาก

---

### 5.3 Activities

**Tables:** `activities`, `activity_joins`, `activity_tickets`

#### `activities` table
```sql
id, month_idx, name, emoji, date, date_end
loc, desc, steps
join_url, join_open, join_label
join_open_at, join_close_at, feedback_url
img_url, img_id
ticket_enabled, ticket_title, ticket_price
ticket_capacity, ticket_note, ticket_open_at
created_at
```

#### `activity_joins` table
```sql
id, activity_id, activity_name
employee_name
reward_type, reward_claimed
stamped_at
```

#### `activity_tickets` table
```sql
id, activity_id, employee_id, employee_name
ticket_no, qr_token
status          -- 'pending' | 'approved' | 'cancelled'
quantity, price
slip_url        -- payment slip image
created_at, cancelled_at, checked_in_at
```

#### Business Rules
- Join: ตรวจ duplicate ก่อน insert
- Ticket capacity: คำนวณจาก **SUM(quantity)** ไม่ใช่นับ row
- Cancelled ticket: **revive** (update status) แทนการ insert ใหม่
- QR check-in: validate ด้วย `qr_token`

---

### 5.4 Mental Health Consultation

**Tables:** `mental_advisors`, `consult_requests`

#### `mental_advisors` table
```sql
id, name, role, employee_id
img_id, img_url
order
card_bg_type, card_bg_value, card_bg_id, card_bg_emoji
```

#### `consult_requests` table
```sql
id, counselor_employee_id, counselor_name
employee_id, employee_name
message, created_at
is_read, reply, replied_at
```

#### Business Rules
- Counselor inbox: เฉพาะ `role = 'counselor'`
- Reply → set `is_read = true` + `replied_at = now()`
- Unread count → notification badge บน header

---

### 5.5 Training

**Tables:** 6 training category tables + registration/review/site/IDP

#### Category Tables
| Table | Category |
|---|---|
| `annual_trainings` | Annual |
| `idp_trainings` | IDP |
| `external_trainings` | External |
| `compulsory_trainings` | Compulsory |
| `superskills_trainings` | Superskill |
| `leadership_trainings` | Leadership |

Common fields: `id, category, title, description, instructor, section, created_at`

#### Supporting Tables
```sql
-- training_registrations
id, training_id, employee_id, employee_name

-- training_reviews
id, training_id, employee_id, employee_name
stars (1-5), comment, created_at

-- site_visits
(generic row data, ordered by created_at)

-- site_votes
site_id, employee_id, employee_name    -- 1 vote/employee/site

-- site_suggestions
employee_id, employee_name, description

-- idp_posters
title, image_url, image_id, description, date, created_at

-- idp_videos
title, video_url, description, created_at
```

---

### 5.6 Ideas

**Table:** `ideas`  
**Route:** `/idea`

```sql
id, category
title       -- max 200 chars
detail      -- max 500 chars
submitter_name, created_at
status      -- 'pending' | 'approved' | 'rejected'
```

---

### 5.7 Blog / Announcements

#### `blog_posts` table
```sql
id, title, body, category
author_name, author_id, created_at
```

#### Announcements (`settings` key-value)
| Key | Type | Description |
|---|---|---|
| `ann_enabled` | bool | เปิด/ปิด announcement |
| `ann_id` | string | ID announcement ปัจจุบัน |
| `ann_title` | string | หัวข้อ |
| `ann_desc` | string | รายละเอียด |
| `ann_video` | string | YouTube URL |
| `ann_video_enabled` | bool | แสดง video |
| `ann_image` | string | Image URL |
| `ann_image_enabled` | bool | แสดง image |
| `ann_quiz_enabled` | bool | เปิด quiz |
| `ann_quiz_questions` | JSON | คำถาม quiz |

#### `quiz_answers` table
```sql
ann_id, employee_name, question_id
selected, created_at
-- Upsert key: (ann_id, employee_name, question_id)
```

**Business Rule:** คำถาม valid ต้องมี `id`, `question`, และ ≥ 2 options

---

### 5.8 Monthly Plans

**Table:** `monthly_plans`

```sql
id
year_month    -- FORMAT: 'YYYY-MM' (e.g. '2026-05') — ALWAYS zero-padded
title, description
poster_url, poster_id
created_at
```

---

### 5.9 Gifts (Welfare)

**Tables:** `gifts`, `gift_claims`

```sql
-- gifts
id, name, description, category, icon
price, quantity   -- NULL = unlimited
img_id, img_url
status            -- 'available' | 'unavailable'
created_at

-- gift_claims
id, employee_id, employee_name
gift_id, gift_name
claimed_year      -- INT e.g. 2026
claimed_at
```

**Business Rules:**
- Available: `status = 'available'` AND `(quantity IS NULL OR quantity > 0)`
- Surprise Box: weighted random โดย `quantity` ที่เหลือ
- 1 claim/employee/year (unique constraint `employee_id + claimed_year`)

---

### 5.10 Empathy Board

**Tables:** `empathy_comments`, `channel_likes`, `empathy_photos`

```sql
-- empathy_comments
id, post_id
parent_id     -- NULL = top-level comment
author_name, text, created_at

-- channel_likes
channel_id, user_key

-- empathy_photos
employee_id, img_url, updated_at
```

**Business Rules:**
- Like/comment ใช้ **Optimistic UI** — update local state ก่อน, rollback on error
- Nested comments ผ่าน `parent_id`

---

### 5.11 Birthday System

- ข้อมูลจาก `employees.bd_date` และ `employees.month_idx`
- แสดงบน HomeView (BdayBanner) และ `/bday`

---

### 5.12 Star Gang

**Route:** `/star`  
**Table:** `employees` (filtered `in_star_gang = true`)

- Star Gang = กลุ่มสมาชิก elite ของแต่ละ team
- แสดง points ต่อคน (`s.pts`)
- Join flow: `team.joinStarGang({ id, name, role })`
- Capacity: แสดง `joinCount / 30` + progress bar

---

### 5.13 Culture Page

**Route:** `/culture`

Static page แสดงค่านิยมองค์กร **FIRE**:
- **F** — Flexible
- **I** — Impact
- **R** — Responsibility
- **E** — Excellence

---

### 5.14 Notifications

**RPC:** `get_notifications(p_emp_name, p_month_idx)`

**Notification fields:**
```
id, type, title, msg, color, time, target
```

**Read state:** localStorage key `notif_read` (set of read IDs)

**Target routing:**
| target value | Navigate to |
|---|---|
| `birthday` | Birthday modal |
| `month` | Monthly plan modal |
| `empathy` | Empathy board |
| `reward` | Reward modal |
| default | Home |

---

### 5.15 Presence System

**Tables:** `user_presence`, `user_presence_log`

```sql
-- user_presence
employee_name, dept, last_seen_at   -- upserted every ~3 min

-- user_presence_log
date, employee_name                 -- one row per employee per day
```

- `pingPresence(employeeName, dept)` → ping on mount + every 3 min
- `fetchOnlineUsers(minutes)` → active ใน N นาทีที่แล้ว
- `fetchTodayUsers()` → active ใน 24 ชั่วโมงที่แล้ว
- ใช้ใน AdminDashboard แสดง online/today stats

---

## 6. Image Upload System

### Flow
```
User selects file
  → resizeToBase64(file, 1600, 900, quality=0.88)
  → POST /functions/v1/upload-image
      { base64, fileName, folderType }
  → Supabase Edge Function → Google Drive
  → Returns { img_id, img_url }
  → Save id+url pair to relevant table
```

### Compression Levels (auto-fallback)
| Attempt | Max Size | Quality |
|---|---|---|
| 1 (default) | 1200×600 | 0.88 |
| 2 | 400×400 | 0.72 |
| 3 | 250×250 | 0.55 |
| 4 | 150×90 | 0.40 |
| 5 (last resort) | 100×100 | 0.25 |

### Edge Functions
| Function | Endpoint | Purpose |
|---|---|---|
| uploadImage | `/upload-image` | Upload base64 to Google Drive |
| deleteImage | `/delete-image` | Delete from Storage |
| fixCacheControl | `/fix-cache` | Fix image cache headers |
| getImages | `/get-images` | Batch fetch images as base64 map |

---

## 7. Admin Panel

### Dashboard Metrics
- Employee count / in-team count
- Birthdays this month
- Ideas: pending / total
- Consult requests: unread / total
- Online now + Today active
- **Charts:** Daily Active Users (14/30 day), Birthdays by month, Ideas by status, Top earners, Team ratio

### Admin Routes & Views
| Path | View | Purpose |
|---|---|---|
| `/admin/login` | AdminLoginView | Admin authentication |
| `/admin` | AdminDashboard | Overview + charts |
| `/admin/employees` | AdminEmployeesView | Employee CRUD + search |
| `/admin/empathy` | AdminEmpathyView | Moderate empathy posts |
| `/admin/ideas` | AdminIdeasView | Review / approve ideas |
| `/admin/activities` | AdminActivitiesView | Manage activities |
| `/admin/activities/scan` | AdminTicketScanView | QR check-in scanner |
| `/admin/announcement` | AdminAnnouncementView | Announcement + quiz config |
| `/admin/reward-rules` | AdminRewardRulesView | Point rules management |
| `/admin/rewards` | AdminRewardsView | Reward catalog |
| `/admin/training` | AdminTrainingView | Training content |
| `/admin/mental` | AdminMentalView | Counselors + inbox |
| `/admin/home-cards` | AdminHomeCardsView | Home card visibility + backgrounds |
| `/admin/plans` | AdminPlansView | Monthly plans |
| `/admin/gifts` | AdminGiftsView | Gift catalog |
| `/admin/migrate` | AdminMigrateView | Data migration tools |

### Home Cards Admin Config
- Toggle enabled/disabled per card
- Edit background: preset gradients / custom CSS / upload image
- Save visibility → `settings.card_<key>`
- Save backgrounds → `settings.card_bg_<key>`

---

## 8. User App Routes

| Path | View | Description |
|---|---|---|
| `/login` | UserLoginView | Employee login |
| `/set-password` | UserSetPasswordView | First-time passcode setup |
| `/` | HomeView | Home feed + card grid |
| `/star` | StarView | Star Gang + leaderboard |
| `/settings` | SettingsView | User preferences |
| `/idea` | IdeaView | Submit ideas |
| `/bday` | BdayView | Birthday calendar |
| `/culture` | CultureView | FIRE culture values |
| `/tickets` | ActivityTicketsView | My activity tickets |

---

## 9. File Structure

```
ds-community-care/
├── app/
│   ├── public/
│   │   ├── favicon.svg          -- brand icon (gradient + heart)
│   │   └── logo.svg             -- horizontal logo
│   └── src/
│       ├── App.vue              -- shell + global modals
│       ├── main.js
│       ├── router/index.js
│       ├── styles/
│       │   └── global.css       -- @layer base/components/utilities
│       ├── core/
│       │   ├── composables/     -- useFadeIn, useRipple, useImageCompress, useConfetti
│       │   ├── constants/       -- mentalCardColors
│       │   ├── layout/          -- AppHeader, AppSidebar, AppBottomNav
│       │   ├── services/        -- supabase, api, imageService, edgeFunctions,
│       │   │                       presenceService, userAuthService, adminService
│       │   ├── stores/          -- ui, userAuth, admin, cardConfig
│       │   └── utils/           -- date, cache
│       ├── features/
│       │   ├── activities/
│       │   ├── announcements/
│       │   ├── birthday/
│       │   ├── blog/
│       │   ├── empathy/
│       │   ├── gifts/
│       │   ├── ideas/
│       │   ├── mental/
│       │   ├── notifications/
│       │   ├── plans/
│       │   ├── rewards/
│       │   ├── team/
│       │   └── training/
│       ├── shared/
│       │   └── components/      -- BaseModal, EmptyState, etc.
│       ├── components/
│       │   └── home/            -- BdayBanner, ConsultCards, EmpathyBoard,
│       │                           EmpathyCard, MonthsGrid
│       └── views/
│           ├── HomeView.vue
│           ├── StarView.vue
│           ├── SettingsView.vue
│           ├── IdeaView.vue
│           ├── BdayView.vue
│           ├── CultureView.vue
│           ├── ActivityTicketsView.vue
│           ├── UserLoginView.vue
│           ├── UserSetPasswordView.vue
│           └── admin/
│               ├── admin.css    -- shared admin styles (scoped-imported)
│               ├── AdminLayout.vue
│               ├── AdminPageHeader.vue
│               ├── AdminDashboard.vue
│               ├── Admin*View.vue (×14)
│               └── training/    -- AdminSiteTab, AdminIdpTab
└── .github/
    └── skills/
        ├── uxui/SKILL.md
        └── sa/SKILL.md
```

---

## 10. Naming Conventions

| Layer | Convention | Example |
|---|---|---|
| Supabase table | `snake_case` | `activity_tickets` |
| Vue store (Pinia) | `use[Feature]Store` | `useRewardStore` |
| Feature store file | `[feature].store.js` | `reward.store.js` |
| Service file | `[feature]Service.js` | `rewardService.js` |
| Feature folder | `src/features/[feature]/` | `src/features/rewards/` |
| Admin view | `Admin[Feature]View.vue` | `AdminRewardsView.vue` |
| CSS class (admin) | `al-*` | `al-form-input`, `al-badge` |
| CSS class (feature) | `[prefix]-*` | `emp-search-bar` |

---

## 11. Key Business Rules Summary

| Rule | Detail |
|---|---|
| `year_month` format | ต้องเป็น `'YYYY-MM'` เสมอ — zero-padded month |
| Daily check-in | 1 ครั้ง/วัน — guard ด้วย localStorage |
| Points | เพิ่มอย่างเดียว ไม่มีหักคะแนน |
| Ticket capacity | คำนวณจาก SUM(quantity) ไม่ใช่ row count |
| Gift claim | 1 claim/employee/ปี |
| Surprise Box | Weighted random ตาม quantity ที่เหลือ |
| Optimistic UI | Empathy likes/comments — revert on error |
| Image identity | เก็บ `img_id` + `img_url` คู่กันเสมอ |
| Quiz validation | ต้องมี id, question, ≥2 options |
| Counselor access | เฉพาะ `role = 'counselor'` เท่านั้น |
| RLS session | Anonymous Supabase session สร้างหลัง login สำเร็จ |

---

## 12. Supabase RPCs

| RPC | Input | Output | Use |
|---|---|---|---|
| `set_user_passcode` | emp_code, passcode | — | Hash & save passcode |
| `verify_user_passcode` | emp_code, passcode | bool | Login validation |
| `get_my_points` | employee_name | total, level, levelName, nextPts, nextName | Points summary |
| `get_my_points_history` | employee_name | history[] | Point transactions |
| `daily_checkin` | employee_name | pts_awarded | Daily check-in |
| `get_notifications` | p_emp_name, p_month_idx | notifications[] | Notification feed |

---

## 13. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Dev | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Dev + Prod | Supabase anonymous key |

> Prod URL proxied via Vercel rewrites (`/supabase` → Supabase project)

---

*spec.md — DS Community Care v2.0*
