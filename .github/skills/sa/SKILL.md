---
name: sa
description: >
  System Analysis guidance for the DS Community Care app.
  Use this skill when asked to analyze requirements, design data models,
  describe business flows, map Supabase collections, define business rules,
  or document system behavior for any feature in this project.
---

# System Analysis Skill — DS Community Care

## Project Overview

**DS Community Care** is an internal employee engagement platform for DS organization.

- **Frontend:** Vue 3 + Vite + Tailwind CSS (PWA, mobile-first)
- **Backend:** Supabase (PostgreSQL + RLS + RPC functions)
- **Auxiliary:** Google Apps Script (image upload, email triggers)
- **Auth model:** Employee code + passcode (no email/OAuth), anonymous Supabase session for RLS
- **Admin panel:** Separate route tree `/admin/*` with username/password auth

---

## System Architecture

```
Browser (Vue 3 PWA)
  ├── User App (/login → / → features)
  │     └── Supabase JS client → PostgreSQL (RLS per employee)
  └── Admin Panel (/admin/login → /admin/*)
        └── Supabase JS client → PostgreSQL (admin service role)

Google Apps Script
  └── Image resize/upload to Supabase Storage
```

---

## Authentication & Authorization

### User Login Flow
1. User enters **employee code** (`emp_code`)
2. `checkEmployee(empCode)` → query `employees` table
   - If not found → error
   - If found but no passcode → redirect to set-passcode page
3. `setPasscode(empCode, passcode)` → RPC `set_user_passcode`
4. `loginWithEmployee(empCode, passcode)` →
   - Fetch employee by `emp_code`
   - Verify via RPC `verify_user_passcode`
   - Create anonymous Supabase session (for RLS)
   - Store session + profile in localStorage

### User Roles
| Role value | Access |
|---|---|
| `admin` | Full admin panel |
| `counselor` | Mental health inbox (counselor view) |
| `employee` | Standard user features |

### Employee Profile Fields
```
id, emp_code, name, role, dept, grad
img_url, img_id
in_team, in_star_gang
star_gang_name, star_gang_role, star_gang_slogan
month_idx, bd_date, fallback_idx
passcode (hashed, write-only)
```

---

## Domain Features & Data Models

### 1. Rewards & Points (`rewards`, `point_rules`)

**Point Levels:**
| Level | Name | Range |
|---|---|---|
| 0 | Newcomer | 0–99 |
| 1 | Member | 100–299 |
| 2 | Active | 300–599 |
| 3 | Champion | 600–999 |
| 4 | Legend | 1000+ |

**Collection: `rewards`**
```
id, name, description
pts_cost        -- points required to redeem
image_id, image_url
stock           -- null = unlimited
active          -- bool, only active shown to users
created_at
```

**Collection: `point_rules`**
```
id, name, description
pts             -- points awarded
active          -- only active rules shown
type, subtype   -- categorize the rule
```

**Point History fields** (returned by RPC `get_my_points_history`):
```
id, type, subtype, amount, desc, createdAt
```

**Business Rules:**
- Daily check-in via RPC `daily_checkin` — once per day (enforced in UI by localStorage `ds_checkin_date`)
- `fetchRewardRules()` returns only `active=true`, sorted by `pts DESC`

---

### 2. Activities (`activities`, `activity_joins`, `activity_tickets`)

**Collection: `activities`**
```
id, month_idx, name, emoji, date, date_end
loc, desc, steps
join_url, join_open (bool), join_label
join_open_at, join_close_at
feedback_url
img_url, img_id
ticket_enabled (bool), ticket_title, ticket_price
ticket_capacity, ticket_note, ticket_open_at
created_at
```

**Collection: `activity_joins`**
```
id, activity_id, activity_name
employee_name
reward_type, reward_claimed (bool)
stamped_at
```

**Collection: `activity_tickets`**
```
id, activity_id, employee_id, employee_name
ticket_no, qr_token
status          -- pending / approved / cancelled
quantity, price
slip_url        -- payment slip image
created_at, cancelled_at, checked_in_at
```

**Business Rules:**
- Duplicate joins prevented by checking existing row before insert
- Ticket capacity enforced by **sum of quantities** (not row count)
- Cancelled tickets can be **revived** (status update) instead of creating duplicate
- QR code scan validates `qr_token` for check-in

---

### 3. Mental Health (`mental_advisors`, `consult_requests`)

**Collection: `mental_advisors`**
```
id, name, role, employee_id
img_id, img_url
order           -- display order
card_bg_type, card_bg_value, card_bg_id, card_bg_emoji
```

**Collection: `consult_requests`**
```
id, counselor_employee_id, counselor_name
employee_id, employee_name
message
created_at
is_read (bool)
reply, replied_at
```

**Business Rules:**
- Only employees with `role = 'counselor'` see the counselor inbox
- Reply sets `is_read = true` and `replied_at = now()`
- Unread count drives notification badge on header

---

### 4. Training (multiple tables)

**Category Tables** (each is a separate Supabase table):
```
annual_trainings
idp_trainings
external_trainings
compulsory_trainings
superskills_trainings
leadership_trainings
```
Common fields: `id, category, title, description, instructor, section, created_at`

**Collection: `training_registrations`**
```
id, training_id, employee_id, employee_name
```
Business rule: de-register by deleting row with `(training_id, employee_id)`

**Collection: `training_reviews`**
```
id, training_id, employee_id, employee_name
stars (1–5), comment, created_at
```

**Site Visit tables:**
- `site_visits` — visit logs, ordered by `created_at`
- `site_votes` — `{ site_id, employee_id, employee_name }` — one vote per employee per site
- `site_suggestions` — `{ employee_id, employee_name, description }`

**IDP Content:**
- `idp_posters` — `{ title, image_url, image_id, description, date, created_at }`
- `idp_videos` — `{ title, video_url, description, created_at }`

---

### 5. Ideas (`ideas`)

**Collection: `ideas`**
```
id, category, title (max 200), detail (max 500)
submitter_name, created_at
status          -- pending / approved / rejected
```

---

### 6. Blog (`blog_posts`)

**Collection: `blog_posts`**
```
id, title, body, category
author_name, author_id, created_at
```
Filterable by `category`.

---

### 7. Monthly Plans (`monthly_plans`)

**Collection: `monthly_plans`**
```
id, year_month   -- format: 'YYYY-MM' (e.g. '2026-05')
title, description
poster_url, poster_id
created_at
```

---

### 8. Gifts (`gifts`, `gift_claims`)

**Collection: `gifts`**
```
id, name, description, category, icon
price, quantity  -- null = unlimited
img_id, img_url
status           -- available / unavailable
created_at
```
Available gifts: `status = 'available'` AND `(quantity IS NULL OR quantity > 0)`

**Collection: `gift_claims`**
```
id, employee_id, employee_name
gift_id, gift_name
claimed_year     -- int (e.g. 2026)
claimed_at
```

**Business Rules:**
- One claim per employee per year (unique constraint on `employee_id, claimed_year`)
- Surprise Box selection: weighted random by remaining `quantity`

---

### 9. Announcements (`settings`, `quiz_answers`)

**Collection: `settings`** (key-value store)
| key | description |
|---|---|
| `ann_enabled` | bool — show announcement |
| `ann_id` | current announcement ID |
| `ann_title` | announcement title |
| `ann_desc` | description text |
| `ann_video` | YouTube URL |
| `ann_video_enabled` | bool |
| `ann_image` | image URL |
| `ann_image_enabled` | bool |
| `ann_quiz_enabled` | bool |
| `ann_quiz_questions` | JSON array of quiz questions |

**Collection: `quiz_answers`**
```
ann_id, employee_name, question_id
selected         -- chosen answer
created_at
```
Upsert key: `(ann_id, employee_name, question_id)` — one answer per question per person.

**Business Rule:** Valid quiz question must have `id`, `question`, and ≥ 2 options.

---

### 10. Empathy Board (`empathy_comments`, `channel_likes`, `empathy_photos`)

**Collection: `empathy_comments`**
```
id, post_id, parent_id (null = top-level)
author_name, text, created_at
```

**Collection: `channel_likes`**
```
channel_id, user_key
```

**Collection: `empathy_photos`**
```
employee_id, img_url, updated_at
```

**Business Rules:**
- Likes and comments use **optimistic UI** — update locally first, rollback on API error
- Nested comments via `parent_id`

---

### 11. Birthdays & Team (`employees`)

- Birthday data sourced from `employees.bd_date` and `employees.month_idx`
- Team/Star Gang grouping via `in_star_gang`, `star_gang_name`, `star_gang_role`

---

## Admin Panel Routes

| Path | View | Description |
|---|---|---|
| `/admin/login` | AdminLoginView | Admin auth (username/password) |
| `/admin` | AdminDashboard | Overview |
| `/admin/employees` | AdminEmployeesView | Employee CRUD |
| `/admin/empathy` | AdminEmpathyView | Moderate empathy posts |
| `/admin/ideas` | AdminIdeasView | Review/approve ideas |
| `/admin/activities` | AdminActivitiesView | Manage activities |
| `/admin/activities/scan` | AdminTicketScanView | QR ticket check-in scanner |
| `/admin/announcement` | AdminAnnouncementView | Configure announcement + quiz |
| `/admin/reward-rules` | AdminRewardRulesView | Manage point rules |
| `/admin/rewards` | AdminRewardsView | Manage reward catalog |
| `/admin/training` | AdminTrainingView | Training content management |
| `/admin/mental` | AdminMentalView | Counselor management + inbox |
| `/admin/home-cards` | AdminHomeCardsView | Home screen card config |
| `/admin/plans` | AdminPlansView | Monthly plan management |
| `/admin/gifts` | AdminGiftsView | Gift catalog management |
| `/admin/migrate` | AdminMigrateView | Data migration tools |

---

## User App Routes

| Path | View | Description |
|---|---|---|
| `/login` | UserLoginView | Employee login |
| `/` | HomeView | Home feed |
| `/star` | StarView | Star Gang / leaderboard |
| `/settings` | SettingsView | User settings |
| `/idea` | IdeaView | Submit ideas |
| `/bday` | BdayView | Birthday calendar |
| `/culture` | CultureView | Culture content |
| `/tickets` | ActivityTicketsView | My activity tickets |

---

## Naming Conventions

| Layer | Convention | Example |
|---|---|---|
| Supabase table | `snake_case` | `activity_tickets` |
| Vue store | `use[Feature]Store` | `useRewardStore` |
| Service file | `[feature]Service.js` | `rewardService.js` |
| Store file | `[feature].store.js` | `reward.store.js` |
| Feature folder | `src/features/[feature]/` | `src/features/rewards/` |
| Admin view | `Admin[Feature]View.vue` | `AdminRewardsView.vue` |

---

## Key Supabase RPCs

| RPC | Purpose |
|---|---|
| `set_user_passcode` | Hash and save employee passcode |
| `verify_user_passcode` | Validate login |
| `get_my_points` | Return total + level for employee |
| `get_my_points_history` | Return point transaction history |
| `daily_checkin` | Award daily check-in points (idempotent per day) |

---

## SA Guidelines for This Project

1. **Always use `year_month` format `'YYYY-MM'` with zero-padded month** — e.g., `'2026-05'`, not `'2026-5'`
2. **Points are additive only** — no deduction transactions; redemption is separate
3. **Capacity checks use quantity sum**, not row count (for tickets)
4. **One-per-year limits** use `claimed_year` integer, not date range
5. **Announcements** are a single active record managed via `settings` key-value — not a collection of posts
6. **Employee identity** in most tables is stored as `employee_name` (denormalized string) for read performance, alongside `employee_id` where RLS enforcement is needed
7. **Images** are uploaded via Google Apps Script proxy → Supabase Storage; stored as `img_id` + `img_url` pair
8. **Admin auth** is separate from user auth — uses `adminService.js` with a different credential mechanism
