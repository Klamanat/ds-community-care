# DS Community Care

แอปพลิเคชัน Web App สำหรับทีม **Digital Solutions** ออกแบบมาเพื่อดูแลสุขภาพ ความเป็นอยู่ และวัฒนธรรมองค์กรของสมาชิกในทีม

---

## ภาพรวม

`ds-community-care.html` เป็นไฟล์ Single-page Application (SPA) แบบ **Zero-dependency** — ไม่ต้องติดตั้ง, ไม่มี build step, เปิดในเบราว์เซอร์ได้ทันที

**ขนาดไฟล์:** ~592 KB (รวม embedded images)

---

## ฟีเจอร์หลัก

### หน้าหลัก (Home)
| ส่วน | รายละเอียด |
|---|---|
| 🎊 กิจกรรมและข่าวสาร | Banner และ card ลิงก์ไปยัง Birthday Celebration, ฝึกอบรม, สิทธิประโยชน์ |
| 💙 บริการให้คำปรึกษา | Mental Health Consultation (ปิดตัวตน 100%), Financial Consultation |
| 🏢 เครื่องมือองค์กร | แผนผังองค์กร, Employee Benefits, Training & Development, Team Culture |
| 💝 Community Empathy Board | พื้นที่แสดงความห่วงใยและสนับสนุนกัน |
| 📅 ตารางกิจกรรม 12 เดือน | ดูกิจกรรมรายเดือนตลอดปี |

### Tab Pages
| Tab | รายละเอียด |
|---|---|
| ⭐ Star Gang | ระบบชื่นชมและให้กำลังใจเพื่อนร่วมทีม |
| 💡 ไอเดีย | กล่องไอเดียแยกตามหมวดหมู่ (กีฬา, เรียนรู้, CSR, ครีเอทีฟ ฯลฯ) |
| 🔔 แจ้งเตือน | ศูนย์รวมการแจ้งเตือนกิจกรรมและข่าวสาร |
| ⚙️ ตั้งค่า | โปรไฟล์ผู้ใช้ และการตั้งค่าต่างๆ |

### Modals
| Modal | รายละเอียด |
|---|---|
| 🎂 Birthday Celebration | Birthday Board รายเดือน + ส่งคำอวยพร + Surprise Box ลุ้นรางวัล |
| 🔥 Team Culture (FIRE) | ค่านิยมทีม — Flexible, Impact, Responsibility, Excellence |
| 🧠 Mental Health | เลือกที่ปรึกษา + ส่งข้อความแบบปิดตัวตน |
| 💰 Financial | ให้คำปรึกษาด้านการเงิน |
| 🏢 Org Chart | แผนผังองค์กร |
| 💝 Employee Benefits | สิทธิประโยชน์พนักงาน |
| 📚 Training | หลักสูตรฝึกอบรม |
| 🎁 Line Rewards | สิทธิประโยชน์ Line |

---

## โครงสร้างไฟล์

```
ds-community-care/
└── ds-community-care.html   # ทั้งหมดอยู่ในไฟล์เดียว
    ├── <style>              # CSS ~1,200 บรรทัด (vars, layout, components, animations)
    ├── <body>
    │   ├── #app
    │   │   ├── .app-header  # Top bar
    │   │   ├── .sidebar     # Desktop navigation
    │   │   ├── .content-area
    │   │   │   ├── #tab-home
    │   │   │   ├── #tab-star
    │   │   │   ├── #tab-idea
    │   │   │   ├── #tab-notif
    │   │   │   ├── #tab-settings
    │   │   │   ├── #tab-bday
    │   │   │   └── #tab-culture
    │   │   └── .bottom-nav  # Mobile navigation
    │   └── Modals (modal-overlay)
    └── <script>             # Vanilla JS — tab switching, modal, data rendering
```

---

## เทคโนโลยี

| ส่วน | รายละเอียด |
|---|---|
| **HTML/CSS/JS** | Vanilla — ไม่มี framework หรือ library ภายนอก |
| **Fonts** | Google Fonts — Sarabun + Noto Sans Thai |
| **Images** | Embedded base64 (ไม่ต้องพึ่ง CDN) |
| **Layout** | CSS Flexbox + Grid, CSS Variables, responsive breakpoints |
| **Animations** | CSS keyframes (`floatY`, `prizePopIn`, `hammerIdle`, `ripple`) |

---

## การเปิดใช้งาน

```bash
# เปิดตรงๆ ในเบราว์เซอร์
open ds-community-care.html

# หรือใช้ local server (แนะนำ)
npx serve .
# หรือ
python -m http.server 8080
```

ไม่จำเป็นต้องติดตั้ง dependencies ใดๆ

---

## Responsive Design

| Breakpoint | Layout |
|---|---|
| Mobile `< 600px` | Bottom navigation bar, single column |
| Tablet `600–767px` | Bottom nav + wider modal |
| Desktop `≥ 768px` | Sidebar navigation (240px), multi-column content |

---

## CSS Variables หลัก

```css
--indigo: #6366F1;   --purple: #A855F7;
--pink:   #EC4899;   --mint:   #10B981;
--bg:     #F0EFFE;   --white:  #FFFFFF;
--dark:   #1E1535;   --mid:    #5B5270;
--light:  #A89DC0;   --border: #E5DEFA;
```
