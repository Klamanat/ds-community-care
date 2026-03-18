<template>
  <main class="al-main">

    <!-- Welcome banner -->
    <div class="dash-welcome">
      <div class="dash-welcome-left">
        <div class="dash-welcome-title">👋 สวัสดี, {{ admin.adminName }}</div>
        <div class="dash-welcome-sub">{{ dateStr }} · ระบบจัดการ DS Community Care</div>
      </div>
      <div class="dash-welcome-badge">Admin</div>
    </div>

    <!-- Stat cards -->
    <div class="dash-stats">
      <router-link
        v-for="s in statCards" :key="s.key"
        :to="s.to"
        class="dash-stat-card"
      >
        <div class="dash-stat-icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</div>
        <div class="dash-stat-body">
          <div class="dash-stat-num">
            <span v-if="loading" class="dash-stat-loading"></span>
            <span v-else>{{ s.value }}</span>
          </div>
          <div class="dash-stat-label">{{ s.label }}</div>
          <div v-if="s.sub" class="dash-stat-sub">{{ s.sub }}</div>
        </div>
        <div class="dash-stat-arrow">›</div>
      </router-link>
    </div>

    <!-- Quick nav -->
    <div class="al-card">
      <div class="al-card-header">
        <span class="al-card-title">🗂 เมนูทั้งหมด</span>
      </div>
      <div class="dash-nav-grid">
        <router-link v-for="card in navCards" :key="card.to" :to="card.to" class="dash-nav-item">
          <span class="dash-nav-ico">{{ card.icon }}</span>
          <span class="dash-nav-lbl">{{ card.label }}</span>
        </router-link>
      </div>
    </div>

  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin = useAdminStore()
const loading = ref(true)

const counts = reactive({
  employees: 0, inTeam: 0,
  bdayThisMonth: 0,
  ideasPending: 0, ideasTotal: 0,
  consultUnread: 0, consultTotal: 0,
  empathyChannels: 0,
})

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const DAYS_TH   = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์']

const dateStr = computed(() => {
  const d = new Date()
  return `${DAYS_TH[d.getDay()]} ${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`
})

const statCards = computed(() => [
  {
    key: 'emp', icon: '👥', label: 'พนักงาน', to: '/admin/employees',
    value: counts.employees, sub: `${counts.inTeam} ในทีม`,
    bg: '#EEF2FF', color: '#4F46E5',
  },
  {
    key: 'bday', icon: '🎂', label: 'วันเกิดเดือนนี้', to: '/admin/employees?filter=bday',
    value: counts.bdayThisMonth, sub: 'คน',
    bg: '#FDF2F8', color: '#DB2777',
  },
  {
    key: 'idea', icon: '💡', label: 'ไอเดียรอรีวิว', to: '/admin/ideas',
    value: counts.ideasPending, sub: `${counts.ideasTotal} ทั้งหมด`,
    bg: '#FFFBEB', color: '#D97706',
  },
  {
    key: 'empathy', icon: '💌', label: 'Empathy Channels', to: '/admin/empathy',
    value: counts.empathyChannels, sub: 'ช่อง',
    bg: '#FFF1F2', color: '#E11D48',
  },
  {
    key: 'consult', icon: '💚', label: 'Consult รอตอบ', to: '/admin/mental',
    value: counts.consultUnread, sub: `${counts.consultTotal} ทั้งหมด`,
    bg: '#F0FDFA', color: '#0D9488',
  },
  {
    key: 'ann', icon: '📢', label: 'ประกาศ / Popup', to: '/admin/announcement',
    value: '—', sub: 'จัดการ',
    bg: '#F0F9FF', color: '#0284C7',
  },
])

const navCards = [
  { to: '/admin/employees',    icon: '👥', label: 'พนักงาน & วันเกิด' },
  { to: '/admin/empathy',      icon: '💌', label: 'Empathy' },
  { to: '/admin/ideas',        icon: '💡', label: 'ไอเดีย' },
  { to: '/admin/activities',   icon: '📅', label: 'กิจกรรม' },
  { to: '/admin/announcement', icon: '📢', label: 'ประกาศ / Popup' },
  { to: '/admin/reward-rules', icon: '🏆', label: 'วิธีสะสมคะแนน' },
  { to: '/admin/training',     icon: '📚', label: 'Training' },
  { to: '/admin/mental',       icon: '💚', label: 'Mental Health' },
  { to: '/admin/home-cards',   icon: '🏠', label: 'Home Cards' },
]

onMounted(async () => {
  try {
    const [emps, bdays, ideas, consults] = await Promise.all([
      svc.getEmployees(),
      svc.getBirthdays(),
      svc.getAdminIdeas(),
      svc.getConsultRequests(),
    ])
    counts.employees     = emps.length
    counts.inTeam        = emps.filter(e => e.inTeam).length
    counts.bdayThisMonth = bdays.filter(b => b.monthIdx === new Date().getMonth()).length
    counts.ideasTotal    = ideas.length
    counts.ideasPending  = ideas.filter(i => i.status === 'pending').length
    counts.consultTotal  = consults.length
    counts.consultUnread = consults.filter(c => !c.isRead).length
    // Unique empathy channels = unique employee empCodes with comments
    counts.empathyChannels = new Set(
      (await svc.getAll('EmpathyComments')).map(c => c.post_id || c.postId || '')
        .filter(Boolean)
    ).size
  } catch { /* silent */ } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import './admin.css';

/* ── Welcome ── */
.dash-welcome {
  background: linear-gradient(135deg, #1E1B4B 0%, #4338CA 60%, #7C3AED 100%);
  border-radius: 16px;
  padding: 22px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 4px 24px rgba(67,56,202,0.3);
}
.dash-welcome-title {
  font-size: 20px;
  font-weight: 900;
  color: white;
  margin-bottom: 5px;
}
.dash-welcome-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.65);
  font-weight: 600;
}
.dash-welcome-badge {
  padding: 5px 14px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Stat cards ── */
.dash-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (min-width: 560px) { .dash-stats { grid-template-columns: repeat(3, 1fr); } }

.dash-stat-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #EBEBF4;
  padding: 14px 14px 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s, transform 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}
.dash-stat-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.dash-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.dash-stat-body { flex: 1; min-width: 0; }
.dash-stat-num {
  font-size: 26px;
  font-weight: 900;
  color: #111827;
  line-height: 1;
  margin-bottom: 3px;
}
.dash-stat-loading {
  display: inline-block;
  width: 28px;
  height: 20px;
  background: #E5E7EB;
  border-radius: 4px;
  animation: dash-pulse 1.2s ease-in-out infinite;
}
@keyframes dash-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.dash-stat-label {
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dash-stat-sub {
  font-size: 10px;
  color: #9CA3AF;
  margin-top: 2px;
}
.dash-stat-arrow {
  position: absolute;
  right: 10px;
  bottom: 10px;
  font-size: 16px;
  color: #D1D5DB;
}

/* ── Quick nav ── */
.dash-nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #F3F4F6;
}
@media (min-width: 560px) { .dash-nav-grid { grid-template-columns: repeat(4, 1fr); } }

.dash-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 14px 8px;
  background: white;
  text-decoration: none;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  transition: background 0.15s, color 0.15s;
  text-align: center;
}
.dash-nav-item:hover { background: #F5F5FF; color: #4F46E5; }
.dash-nav-ico { font-size: 20px; }
.dash-nav-lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 72px; }
</style>
