# DS Community Care

Web App สำหรับทีม **Digital Solutions** — ดูแลสุขภาพ ความเป็นอยู่ และวัฒนธรรมองค์กรของสมาชิกในทีม

---

## Tech Stack

| ส่วน | รายละเอียด |
|---|---|
| **Frontend** | Vue 3 + Vite + Pinia + Vue Router |
| **Styling** | Tailwind CSS v3 + global.css |
| **Backend** | Google Apps Script (Web App) |
| **Database** | Google Sheets |
| **Fonts** | Google Fonts — Sarabun + Noto Sans Thai |
| **Deploy** | Vercel / Netlify (static) |

---

## โครงสร้างโปรเจกต์

```
ds-community-care/
├── app/                          # Vite project (frontend)
│   ├── src/
│   │   ├── styles/global.css     # CSS ทั้งหมด
│   │   ├── main.js               # createApp + Pinia + Router
│   │   ├── App.vue               # Shell: Header + Sidebar + RouterView + BottomNav + Modals
│   │   ├── router/index.js       # Hash history, 7 routes
│   │   ├── stores/               # ui, empathy, birthday, team, ideas, userAuth
│   │   ├── services/             # api.js (gasGet/gasPost), empathy/birthday/team/idea/imageService
│   │   ├── composables/          # useRipple, useConfetti, useFadeIn, useImageCompress
│   │   ├── components/
│   │   │   ├── layout/           # AppHeader, AppSidebar, AppBottomNav, NavItem
│   │   │   ├── shared/           # BaseModal, SkeletonCard, EmptyState
│   │   │   ├── home/             # BdayBanner, EmpathyCard, EmpathyBoard, MonthsGrid, ConsultCards
│   │   │   └── modals/           # BdayModal, EmpathyModal, EmpDetailModal, ProfileModal, ...
│   │   └── views/                # HomeView, StarView, NotifView, SettingsView, IdeaView, ...
│   ├── public/images/            # Static images
│   └── .env                      # VITE_GAS_URL=...
└── gas/                          # Google Apps Script
    ├── Code.gs                   # doGet() router
    ├── Utils.gs                  # helpers: uuid, ok, err, cachedSheetRead, cachedDriveImage, getImages
    ├── Employees.gs              # getEmployees, addTeamMember, joinStarGang, updateEmployeeSelf
    ├── Birthdays.gs              # getBirthdays, getBirthdayWishes, addBirthdayWish
    ├── Empathy.gs                # getEmpathyPosts, getEmpathyPeople, addEmpathyPost, getEmpathyComments, addComment, toggleLike, toggleChannelLike, toggleCommentLike
    ├── Activities.gs             # getActivities
    └── Ideas.gs                  # getIdeas, submitIdea
```

---

## ฟีเจอร์หลัก

### Views (Tab)
| Route | รายละเอียด |
|---|---|
| `/` | Home — กิจกรรม, Consult Service, Empathy Board, Activities |
| `/star` | Star Gang — สมาชิกดาวเด่น |
| `/idea` | เสนอไอเดีย |
| `/notif` | การแจ้งเตือน |
| `/settings` | ตั้งค่า / โปรไฟล์ |
| `/bday` | Birthday Board |
| `/culture` | Team Culture |

### Modals
| Modal | รายละเอียด |
|---|---|
| 🎂 Birthday | Birthday Board รายเดือน + ส่งคำอวยพร |
| 💝 Empathy | ส่งคำชื่นชมเพื่อนร่วมทีม + thread comments + likes |
| 🤝 Team Culture | ค่านิยมทีม FIRE |
| 🧠 Mental Health | เลือกที่ปรึกษา + ปิดตัวตน |
| 💰 Financial | ให้คำปรึกษาด้านการเงิน |
| 🏆 Star Gang | สมาชิกดาวเด่น |
| 👤 Profile | โปรไฟล์ + แก้ไขข้อมูล + อัปโหลดรูป |
| 📅 Monthly Activities | กิจกรรมรายเดือน |

---

## Google Sheets Schema

| Sheet | Columns หลัก |
|---|---|
| Employees | id, empCode, name, role, dept, imgUrl, inTeam, inStarGang |
| Birthdays | key, employeeId, name, role, monthIdx, date, fallbackIdx |
| BirthdayWishes | id, birthdayKey, fromName, fromAvIdx, msg, time, year |
| EmpathyPosts | id, recEmployeeId, recName, recRole, sndName, msg, tag, likeCount, createdAt |
| EmpathyComments | id, postId, parentId, authorName, text, likeCount, createdAt |
| EmpathyLikes | postId, userKey |
| Ideas | id, category, title, detail, submitterName, createdAt, status |

---

## Image Architecture

Drive images ไม่ได้ถูก fetch inline แต่ใช้ 3-tier cache:

```
GAS ScriptCache (60 min, shared)
  → localStorage (60 min, per-device)
    → in-memory Map (per-session)
```

GAS endpoints ทุกตัว return `imgId` แทน base64 → frontend batch-fetch ผ่าน `getImages` หลัง page render → ลด load time จาก ~22s เหลือ < 5s

---

## Dev Setup

```bash
# 1. ติดตั้ง dependencies
cd app && npm install

# 2. ตั้งค่า GAS URL
echo "VITE_GAS_URL=https://script.google.com/macros/s/..." > app/.env

# 3. รัน dev server
npm run dev

# 4. Build production
npm run build
```

---

## GAS Deployment

1. เปิด Google Sheets → Extensions → Apps Script
2. Copy ไฟล์ทั้งหมดจาก `gas/` (Code.gs ก่อน)
3. Deploy → New Deployment → Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy Web App URL → วางใน `app/.env` เป็น `VITE_GAS_URL`
5. ทดสอบ: `GET [URL]?action=getEmployees` → `{ ok: true, data: [] }`

---

## Responsive

| Breakpoint | Layout |
|---|---|
| Mobile `< 640px` | Bottom navigation, single column, sheet modals slide from bottom |
| Desktop `≥ 640px` | Sidebar navigation (240px), centered modals (max 480px) |
