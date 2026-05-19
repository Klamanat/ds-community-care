<template>
  <main class="al-main">
    <div class="al-body">

    <!-- Welcome banner -->
    <div class="dash-welcome">
      <div>
        <div class="dash-welcome-title">👋 สวัสดี, {{ admin.adminName }}</div>
        <div class="dash-welcome-sub">{{ dateStr }} · DS Community Care</div>
      </div>
      <div class="dash-welcome-badge">Admin</div>
    </div>

    <!-- Stat cards -->
    <div class="dash-stats">
      <router-link v-for="s in statCards" :key="s.key" :to="s.to" class="dash-stat-card">
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

    <!-- Online users -->
    <div class="al-card dash-online-card">
      <div class="al-card-header">
        <span class="al-card-title">🟢 ออนไลน์ตอนนี้</span>
        <div class="dash-online-meta">
          <span class="al-badge al-badge-green">{{ onlineUsers.length }} คน</span>
          <span class="al-badge al-badge-gray">วันนี้ {{ todayUsers.length }} คน</span>
          <button class="dash-online-refresh" @click="loadPresence" :disabled="presenceLoading">
            {{ presenceLoading ? '⏳' : '↻' }}
          </button>
        </div>
      </div>

      <div v-if="presenceLoading && !onlineUsers.length" class="dash-online-empty">⏳ กำลังโหลด...</div>
      <div v-else-if="!onlineUsers.length" class="dash-online-empty">ไม่มีผู้ใช้ออนไลน์ขณะนี้</div>
      <div v-else class="dash-online-list">
        <div v-for="u in onlineUsers" :key="u.employee_name" class="dash-online-item">
          <span class="dash-online-dot"></span>
          <span class="dash-online-name">{{ u.employee_name }}</span>
          <span v-if="u.dept" class="dash-online-dept">{{ u.dept }}</span>
          <span class="dash-online-time">{{ relTime(u.last_seen_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Daily active users chart -->
    <div class="al-card dau-card">
      <div class="al-card-header">
        <span class="al-card-title">📊 ผู้เข้าใช้งานรายวัน</span>
        <div class="dau-header-right">
          <span class="al-badge al-badge-blue">เฉลี่ย {{ dauAvg }} คน/วัน</span>
          <div class="dau-range-tabs">
            <button :class="['dau-tab', dauRange === 14 ? 'active' : '']" @click="dauRange = 14; loadDau()">14 วัน</button>
            <button :class="['dau-tab', dauRange === 30 ? 'active' : '']" @click="dauRange = 30; loadDau()">30 วัน</button>
          </div>
        </div>
      </div>
      <div class="dau-body">
        <div v-if="dauLoading" class="dash-chart-skeleton mt-2 mx-3 mb-3"></div>
        <template v-else>
          <!-- Summary pills -->
          <div class="dau-summary">
            <div class="dau-pill">
              <div class="dau-pill-val">{{ dauMax }}</div>
              <div class="dau-pill-label">สูงสุด</div>
            </div>
            <div class="dau-pill dau-pill--accent">
              <div class="dau-pill-val">{{ dailyUsers.find(d => dauIsToday(d.date))?.count ?? 0 }}</div>
              <div class="dau-pill-label">วันนี้</div>
            </div>
            <div class="dau-pill">
              <div class="dau-pill-val">{{ dauAvg }}</div>
              <div class="dau-pill-label">เฉลี่ย/วัน</div>
            </div>
            <div class="dau-pill">
              <div class="dau-pill-val">{{ dauTotal }}</div>
              <div class="dau-pill-label">รวม {{ dauRange }} วัน</div>
            </div>
          </div>

          <!-- Bar chart SVG — fixed 560×110 viewBox -->
          <div class="dau-chart-wrap">
            <svg viewBox="0 0 560 110" class="dau-svg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#6366F1" stop-opacity="0.9"/>
                  <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.7"/>
                </linearGradient>
              </defs>

              <!-- Y-axis labels + grid lines -->
              <g v-for="(tick, ti) in dauTicks" :key="ti">
                <line x1="34" :y1="tick.y" x2="556" :y2="tick.y" stroke="#E2DCFB" stroke-width="1"/>
                <text x="28" :y="tick.y + 3" text-anchor="end" font-size="7" fill="#7A6F9E" font-weight="600">{{ tick.val }}</text>
              </g>

              <!-- Bars -->
              <g v-for="(d, i) in dailyUsers" :key="d.date">
                <rect
                  :x="dauBarX(i)"
                  :y="dauBarTop(d.count)"
                  :width="dauBarW"
                  :height="dauBarH(d.count) || 2"
                  :fill="dauIsToday(d.date) ? 'url(#dauGrad)' : d.count === dauMax && dauMax > 0 ? '#A855F7' : '#E2DCFB'"
                  :opacity="d.count === 0 ? 0.25 : 1"
                  rx="3"
                />
                <!-- Count on top (only for bars with space) -->
                <text
                  v-if="d.count > 0 && dauBarH(d.count) > 14"
                  :x="dauBarX(i) + dauBarW / 2"
                  :y="dauBarTop(d.count) - 3"
                  text-anchor="middle"
                  font-size="7"
                  :fill="dauIsToday(d.date) ? '#A855F7' : '#6366F1'"
                  font-weight="800"
                >{{ d.count }}</text>
                <!-- Date label -->
                <text
                  v-if="dauShowLabel(i, d.date)"
                  :x="dauBarX(i) + dauBarW / 2"
                  y="101"
                  text-anchor="middle"
                  font-size="7"
                  :fill="dauIsToday(d.date) ? '#A855F7' : '#7A6F9E'"
                  :font-weight="dauIsToday(d.date) ? '800' : '400'"
                >{{ dauIsToday(d.date) ? 'วันนี้' : dauDayLabel(d.date) }}</text>
              </g>
            </svg>
          </div>
          <div class="dash-chart-legend dau-legend">
            <span class="dash-leg-dot bg-indigo"></span>วันนี้
            <span class="dash-leg-dot bg-purple ml-2.5"></span>สูงสุด
            <span class="dash-leg-dot bg-app-border ml-2.5"></span>วันอื่น
          </div>
        </template>
      </div>
    </div>

    <!-- Charts row 1 -->
    <div class="dash-charts-row">

      <!-- Birthdays by month — bar chart -->
      <div class="al-card dash-chart-card">
        <div class="al-card-header">
          <span class="al-card-title">🎂 วันเกิดรายเดือน</span>
          <span class="al-badge al-badge-blue">{{ counts.employees }} คน</span>
        </div>
        <div class="dash-chart-body">
          <div v-if="loading" class="dash-chart-skeleton"></div>
          <svg v-else viewBox="0 0 276 88" class="dash-bar-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Bars -->
            <g v-for="(cnt, i) in bdayByMonth" :key="i">
              <rect
                :x="i * 23 + 2"
                :y="68 - barH(cnt)"
                :width="18"
                :height="barH(cnt) || 2"
                :fill="i === currentMonth ? '#6366F1' : '#E2DCFB'"
                :opacity="cnt === 0 ? 0.4 : 1"
                rx="3"
              />
              <!-- value label on top -->
              <text
                v-if="cnt > 0"
                :x="i * 23 + 11"
                :y="65 - barH(cnt)"
                text-anchor="middle"
                font-size="7"
                :fill="i === currentMonth ? '#6366F1' : '#7A6F9E'"
                font-weight="700"
              >{{ cnt }}</text>
            </g>
            <!-- Month labels -->
            <text
              v-for="(m, i) in MONTHS_SHORT" :key="'lbl'+i"
              :x="i * 23 + 11"
              y="80"
              text-anchor="middle"
              font-size="7"
              :fill="i === currentMonth ? '#A855F7' : '#7A6F9E'"
              :font-weight="i === currentMonth ? '800' : '500'"
            >{{ m }}</text>
          </svg>
          <div class="dash-chart-legend">
            <span class="dash-leg-dot bg-indigo"></span>เดือนปัจจุบัน
            <span class="dash-leg-dot bg-app-border ml-2.5"></span>เดือนอื่น
          </div>
        </div>
      </div>

      <!-- Ideas by status — donut -->
      <div class="al-card dash-chart-card">
        <div class="al-card-header">
          <span class="al-card-title">💡 ไอเดีย</span>
          <span class="al-badge al-badge-blue">{{ counts.ideasTotal }} รายการ</span>
        </div>
        <div class="dash-chart-body dash-donut-wrap">
          <div v-if="loading" class="dash-chart-skeleton"></div>
          <template v-else-if="counts.ideasTotal > 0">
            <svg viewBox="0 0 120 120" class="dash-donut-svg" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="44" fill="none" stroke="#E2DCFB" stroke-width="14"/>
              <circle
                v-for="seg in ideaSegments" :key="seg.status"
                cx="60" cy="60" r="44"
                fill="none"
                :stroke="seg.color"
                stroke-width="14"
                :stroke-dasharray="seg.dash"
                :stroke-dashoffset="seg.offset"
                stroke-linecap="round"
                style="transform:rotate(-90deg);transform-origin:60px 60px;"
              />
              <text x="60" y="56" text-anchor="middle" font-size="18" font-weight="900" fill="#1A1235">{{ counts.ideasTotal }}</text>
              <text x="60" y="70" text-anchor="middle" font-size="9" fill="#7A6F9E">รายการ</text>
            </svg>
            <div class="dash-donut-legend">
              <div v-for="seg in ideaSegments" :key="seg.status" class="dash-donut-leg-row">
                <span class="dash-leg-dot" :style="{ background: seg.color }"></span>
                <span class="dash-donut-leg-label">{{ seg.label }}</span>
                <span class="dash-donut-leg-val">{{ seg.count }}</span>
              </div>
            </div>
          </template>
          <div v-else class="dash-chart-empty">ยังไม่มีไอเดีย</div>
        </div>
      </div>
    </div>

    <!-- Charts row 2 -->
    <div class="dash-charts-row">

      <!-- Points top earners — horizontal bar -->
      <div class="al-card dash-chart-card">
        <div class="al-card-header">
          <span class="al-card-title">🏆 Top Earners</span>
        </div>
        <div class="dash-chart-body">
          <div v-if="loading" class="dash-chart-skeleton"></div>
          <div v-else-if="!allTopEarners.length" class="dash-chart-empty">ยังไม่มีข้อมูลคะแนน</div>
          <template v-else>
            <div class="dash-hbar-list">
              <div v-for="(e, i) in displayedEarners" :key="e.name" class="dash-hbar-row">
                <div class="dash-hbar-rank">{{ i + 1 }}</div>
                <div class="dash-hbar-body">
                  <div class="dash-hbar-label">{{ e.name }}</div>
                  <div class="dash-hbar-track">
                    <div
                      class="dash-hbar-fill"
                      :style="{ width: (e.total / allTopEarners[0].total * 100) + '%', background: RANK_COLORS[i] }"
                    ></div>
                  </div>
                </div>
                <div class="dash-hbar-val" :style="{ color: RANK_COLORS[i] }">{{ e.total.toLocaleString() }}</div>
              </div>
            </div>
            <button
              v-if="allTopEarners.length > 5"
              class="dash-earners-more"
              @click="showAllEarners = !showAllEarners"
            >
              {{ showAllEarners ? '▲ แสดงน้อยลง' : `▼ ดูทั้งหมด (${allTopEarners.length})` }}
            </button>
          </template>
        </div>
      </div>

      <!-- Team ratio — donut + bar -->
      <div class="al-card dash-chart-card">
        <div class="al-card-header">
          <span class="al-card-title">👥 สัดส่วนพนักงาน</span>
        </div>
        <div class="dash-chart-body">
          <div v-if="loading" class="dash-chart-skeleton"></div>
          <template v-else>
            <!-- Team ratio ring -->
            <div class="dash-ratio-wrap">
              <svg viewBox="0 0 80 80" class="dash-ratio-svg" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#E2DCFB" stroke-width="10"/>
                <circle
                  cx="40" cy="40" r="30"
                  fill="none" stroke="#6366F1" stroke-width="10"
                  :stroke-dasharray="`${inTeamPct * 188.5 / 100} 188.5`"
                  stroke-linecap="round"
                  style="transform:rotate(-90deg);transform-origin:40px 40px;"
                />
                <text x="40" y="37" text-anchor="middle" font-size="13" font-weight="900" fill="#1A1235">{{ counts.inTeam }}</text>
                <text x="40" y="49" text-anchor="middle" font-size="7" fill="#7A6F9E">ในทีม</text>
              </svg>
              <div class="dash-ratio-info">
                <div class="dash-ratio-row">
                  <span class="dash-leg-dot bg-indigo"></span>
                  <span>ในทีม</span>
                  <strong>{{ counts.inTeam }}</strong>
                </div>
                <div class="dash-ratio-row">
                  <span class="dash-leg-dot bg-app-border"></span>
                  <span>ทั้งหมด</span>
                  <strong>{{ counts.employees }}</strong>
                </div>
                <div class="dash-ratio-pct">{{ inTeamPct }}%</div>
              </div>
            </div>
            <!-- Role breakdown bars -->
            <div class="dash-role-list">
              <div v-for="r in roleBreakdown" :key="r.label" class="dash-role-row">
                <span class="dash-role-label">{{ r.label }}</span>
                <div class="dash-role-track">
                  <div class="dash-role-fill" :style="{ width: (r.count / counts.employees * 100) + '%', background: r.color }"></div>
                </div>
                <span class="dash-role-val">{{ r.count }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '../../core/stores/admin.js'
import * as svc from '../../core/services/adminService.js'
import { supabase } from '../../core/services/supabase.js'
import { fetchOnlineUsers, fetchTodayUsers, fetchDailyActiveUsers } from '../../core/services/presenceService.js'

const admin   = useAdminStore()
const loading = ref(true)

const counts = reactive({
  employees: 0, inTeam: 0,
  bdayThisMonth: 0,
  ideasPending: 0, ideasTotal: 0,
  consultUnread: 0, consultTotal: 0,
})

// ── Presence ──────────────────────────────────────────────────
const onlineUsers    = ref([])
const todayUsers     = ref([])
const presenceLoading = ref(false)

async function loadPresence() {
  presenceLoading.value = true
  try {
    const [online, today] = await Promise.all([fetchOnlineUsers(5), fetchTodayUsers()])
    onlineUsers.value = online
    todayUsers.value  = today
  } catch { /* silent */ } finally {
    presenceLoading.value = false
  }
}

function relTime(iso) {
  const diff = Math.round((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)  return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h`
}

let _presenceTimer = null

const dailyUsers     = ref([])
const dauRange       = ref(14)   // 14 or 30 days
const dauLoading     = ref(true)

async function loadDau() {
  dauLoading.value = true
  try { dailyUsers.value = await fetchDailyActiveUsers(dauRange.value) }
  catch { /* silent */ } finally { dauLoading.value = false }
}

const dauMax    = computed(() => Math.max(...dailyUsers.value.map(d => d.count), 1))
const dauTotal  = computed(() => dailyUsers.value.reduce((s, d) => s + d.count, 0))
const dauAvg    = computed(() => dailyUsers.value.length ? Math.round(dauTotal.value / dailyUsers.value.filter(d => d.count > 0).length) || 0 : 0)

// Fixed SVG geometry (viewBox 560×110, chart area x:34-556, y:6-90)
const DAU_X0 = 34, DAU_W = 522, DAU_H = 76, DAU_Y0 = 6
const dauBarW   = computed(() => Math.max(4, DAU_W / dauRange.value - 2))
const dauSlotW  = computed(() => DAU_W / dauRange.value)
function dauBarX(i)    { return DAU_X0 + i * dauSlotW.value + (dauSlotW.value - dauBarW.value) / 2 }
function dauBarH(cnt)  { return Math.round((cnt / dauMax.value) * DAU_H) }
function dauBarTop(cnt){ return DAU_Y0 + DAU_H - dauBarH(cnt) }

// Y-axis ticks (3 nice round numbers)
const dauTicks = computed(() => {
  const step = Math.ceil(dauMax.value / 3) || 1
  return [1, 2, 3].map(n => {
    const val = n * step
    const y   = DAU_Y0 + DAU_H - Math.round((val / dauMax.value) * DAU_H)
    return { val, y }
  }).filter(t => t.val <= dauMax.value)
})

function dauShowLabel(i, dateStr) {
  if (dauIsToday(dateStr)) return true
  const every = dauRange.value <= 14 ? 1 : 3
  return i % every === 0
}
function dauDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}
function dauIsToday(dateStr) { return dateStr === new Date().toISOString().slice(0, 10) }

const bdayByMonth = ref(Array(12).fill(0))
const ideaCounts  = reactive({ pending: 0, reviewed: 0, approved: 0, rejected: 0 })
const allTopEarners  = ref([])
const showAllEarners = ref(false)
const displayedEarners = computed(() =>
  showAllEarners.value ? allTopEarners.value : allTopEarners.value.slice(0, 5)
)
const empsByRole  = ref([])

const MONTHS_TH    = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const MONTHS_SHORT = ['ม.ค','ก.พ','มี.ค','เม.ย','พ.ค','มิ.ย','ก.ค','ส.ค','ก.ย','ต.ค','พ.ย','ธ.ค']
const DAYS_TH      = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์']
const RANK_COLORS = [
  '#F59E0B','#9CA3AF','#CD7F32',   // 1-3 gold/silver/bronze
  '#6366F1','#10B981','#3B82F6',   // 4-6
  '#EC4899','#8B5CF6','#F97316',   // 7-9
  '#0EA5E9','#84CC16','#64748B',   // 10-12
  '#A78BFA','#34D399','#FB923C',   // 13-15
  '#60A5FA','#F472B6','#C084FC',   // 16-18
  '#4ADE80','#FBBF24',             // 19-20
]

const currentMonth = new Date().getMonth()

const dateStr = computed(() => {
  const d = new Date()
  return `${DAYS_TH[d.getDay()]} ${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`
})

// ── Bar chart helpers ──────────────────────────────────────────
const maxBday = computed(() => Math.max(...bdayByMonth.value, 1))
function barH(cnt) { return Math.round((cnt / maxBday.value) * 55) }

// ── Ideas donut segments ──────────────────────────────────────
const IDEA_COLORS = { pending: '#F59E0B', reviewed: '#3B82F6', approved: '#10B981', rejected: '#EF4444' }
const IDEA_LABELS = { pending: 'รอรีวิว', reviewed: 'รีวิวแล้ว', approved: 'อนุมัติ', rejected: 'ปฏิเสธ' }

const ideaSegments = computed(() => {
  const total = counts.ideasTotal || 1
  const C = 2 * Math.PI * 44   // circumference ≈ 276.5
  const statuses = ['pending', 'reviewed', 'approved', 'rejected']
  let offset = 0
  return statuses
    .filter(s => ideaCounts[s] > 0)
    .map(s => {
      const pct = ideaCounts[s] / total
      const seg = { status: s, count: ideaCounts[s], color: IDEA_COLORS[s], label: IDEA_LABELS[s],
        dash: `${pct * C * 0.95} ${C}`,
        offset: -offset * C,
      }
      offset += pct
      return seg
    })
})

// ── Team ratio ────────────────────────────────────────────────
const inTeamPct = computed(() =>
  counts.employees ? Math.round(counts.inTeam / counts.employees * 100) : 0
)

const ROLE_COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#0EA5E9']
const roleBreakdown = computed(() => {
  const map = {}
  empsByRole.value.forEach(e => { const r = e.role || 'อื่นๆ'; map[r] = (map[r] || 0) + 1 })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count], i) => ({ label, count, color: ROLE_COLORS[i % ROLE_COLORS.length] }))
})

// ── Stat cards ────────────────────────────────────────────────
const statCards = computed(() => [
  { key: 'emp',    icon: '👥', label: 'พนักงาน',        to: '/admin/employees',    value: counts.employees,     sub: `${counts.inTeam} ในทีม`,          bg: 'rgba(99,102,241,0.1)',  color: '#6366F1' },
  { key: 'bday',   icon: '🎂', label: 'วันเกิดเดือนนี้', to: '/admin/employees',   value: counts.bdayThisMonth, sub: 'คน',                               bg: 'rgba(236,72,153,0.1)',  color: '#EC4899' },
  { key: 'idea',   icon: '💡', label: 'ไอเดียรอรีวิว',   to: '/admin/ideas',       value: counts.ideasPending,  sub: `${counts.ideasTotal} ทั้งหมด`,    bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
  { key: 'consult',icon: '💚', label: 'Consult รอตอบ',   to: '/admin/mental',      value: counts.consultUnread, sub: `${counts.consultTotal} ทั้งหมด`,  bg: 'rgba(16,185,129,0.1)',  color: '#10B981' },
  { key: 'reward', icon: '🎁', label: 'ของรางวัล',       to: '/admin/rewards',     value: '›',                  sub: 'จัดการ',                           bg: 'rgba(168,85,247,0.1)',  color: '#A855F7' },
  { key: 'ann',    icon: '📢', label: 'ประกาศ / Popup',  to: '/admin/announcement', value: '›',                 sub: 'จัดการ',                           bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B' },
])

// ── Load data ─────────────────────────────────────────────────
onMounted(async () => {
  loadPresence()
  loadDau()
  _presenceTimer = setInterval(loadPresence, 60 * 1000)  // refresh every 1 min
  try {
    const [emps, bdays, ideas, consults, pointsRes] = await Promise.all([
      svc.getEmployees(),
      svc.getBirthdays(),
      svc.getAdminIdeas(),
      svc.getConsultRequests(),
      supabase.from('points').select('employee_name, amount').then(r => r.data || []),
    ])

    // employees
    counts.employees     = emps.length
    counts.inTeam        = emps.filter(e => e.inTeam).length
    empsByRole.value     = emps

    // birthdays
    counts.bdayThisMonth = bdays.filter(b => b.monthIdx === currentMonth).length
    const byMonth = Array(12).fill(0)
    bdays.forEach(b => { if (b.monthIdx != null) byMonth[b.monthIdx]++ })
    bdayByMonth.value = byMonth

    // ideas
    counts.ideasTotal   = ideas.length
    counts.ideasPending = ideas.filter(i => i.status === 'pending').length
    ideas.forEach(i => { const s = i.status || 'pending'; if (s in ideaCounts) ideaCounts[s]++ })

    // consults
    counts.consultTotal  = consults.length
    counts.consultUnread = consults.filter(c => !c.isRead).length

    // points top earners
    const totals = {}
    pointsRes.forEach(p => { totals[p.employee_name] = (totals[p.employee_name] || 0) + (p.amount || 0) })
    allTopEarners.value = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, total]) => ({ name, total }))

  } catch { /* silent */ } finally {
    loading.value = false
  }
})
onUnmounted(() => clearInterval(_presenceTimer))
</script>

<style scoped>
@import './admin.css';

/* ── Welcome banner ── */
.dash-welcome {
  background: linear-gradient(135deg, #4F52C8 0%, #7C3AC2 50%, #C83D8E 100%);
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 10px 36px rgba(99,102,241,0.32);
  position: relative;
  overflow: hidden;
}
.dash-welcome::before {
  content: '';
  position: absolute;
  right: -30px; top: -30px;
  width: 140px; height: 140px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  pointer-events: none;
}
.dash-welcome::after {
  content: '';
  position: absolute;
  left: -20px; bottom: -25px;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  pointer-events: none;
}
.dash-welcome-title { font-size: 20px; font-weight: 900; color: white; margin-bottom: 4px; letter-spacing: -0.02em; }
.dash-welcome-sub   { font-size: 12px; color: rgba(255,255,255,0.70); font-weight: 600; }
.dash-welcome-badge {
  padding: 6px 16px;
  background: rgba(255,255,255,0.20);
  border: 1px solid rgba(255,255,255,0.28);
  border-radius: 9999px;
  font-size: 12px; font-weight: 800;
  color: rgba(255,255,255,0.95);
  white-space: nowrap; flex-shrink: 0;
  backdrop-filter: blur(8px);
}

/* ── Stat cards ── */
.dash-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (min-width: 480px) {
  .dash-stats { grid-template-columns: 1fr 1fr 1fr; }
}
.dash-stat-card {
  background: white;
  border-radius: 16px;
  border: 1.5px solid #E2DCFB;
  padding: 16px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.22s, transform 0.22s;
  box-shadow: 0 4px 14px rgba(99,102,241,0.09);
  position: relative;
  overflow: hidden;
}
.dash-stat-card:hover { box-shadow: 0 10px 30px rgba(99,102,241,0.18); transform: translateY(-3px); }
.dash-stat-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px; flex-shrink: 0;
}
.dash-stat-body { flex: 1; min-width: 0; }
.dash-stat-num  { font-size: 24px; font-weight: 900; color: #1A1235; line-height: 1; margin-bottom: 4px; }
.dash-stat-loading {
  display: inline-block; width: 28px; height: 20px;
  background: #E2DCFB; border-radius: 5px;
  animation: dash-pulse 1.2s ease-in-out infinite;
}
@keyframes dash-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.dash-stat-label { font-size: 11px; font-weight: 700; color: #52497A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dash-stat-sub   { font-size: 10px; color: #7A6F9E; margin-top: 2px; }
.dash-stat-arrow { position: absolute; right: 10px; bottom: 10px; font-size: 16px; color: #E2DCFB; }

/* ── Online users ── */
.dash-online-card { padding: 0; }
.dash-online-meta { display: flex; align-items: center; gap: 6px; }
.dash-online-refresh {
  background: none;
  border: 1.5px solid #E2DCFB;
  border-radius: 9px;
  width: 30px; height: 30px;
  cursor: pointer; font-size: 15px; color: #7A6F9E;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.dash-online-refresh:hover { background: #F2F0FB; border-color: #6366F1; color: #6366F1; }
.dash-online-empty { padding: 20px; font-size: 13px; color: #7A6F9E; text-align: center; }
.dash-online-list  { display: flex; flex-direction: column; }
.dash-online-item  {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 18px;
  border-top: 1px solid #F2F0FB;
  font-size: 13px;
  transition: background 0.12s;
}
.dash-online-item:hover { background: rgba(99,102,241,0.03); }
.dash-online-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.22);
  flex-shrink: 0;
}
.dash-online-name { font-weight: 700; color: #1A1235; flex: 1; }
.dash-online-dept { font-size: 11px; color: #7A6F9E; }
.dash-online-time { font-size: 11px; color: #7A6F9E; margin-left: auto; flex-shrink: 0; }

/* ── Charts layout ── */
.dash-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 480px) { .dash-charts-row { grid-template-columns: 1fr; } }

.dash-chart-card { flex: 1; }
.dash-chart-body { padding: 10px 14px 14px; }
.dash-chart-skeleton {
  height: 120px;
  background: #F2F0FB;
  border-radius: 12px;
  animation: dash-pulse 1.4s ease-in-out infinite;
}
.dash-chart-empty { text-align: center; padding: 32px 0; font-size: 12px; color: #7A6F9E; }

/* ── Bar chart ── */
.dash-bar-svg { width: 100%; display: block; }
.dash-chart-legend {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: #7A6F9E; margin-top: 4px;
}
.dash-leg-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block;
}

/* ── Donut chart ── */
.dash-donut-wrap  { display: flex; align-items: center; gap: 10px; }
.dash-donut-svg   { width: 90px; height: 90px; flex-shrink: 0; }
.dash-donut-legend { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.dash-donut-leg-row {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #52497A;
}
.dash-donut-leg-label { flex: 1; }
.dash-donut-leg-val   { font-weight: 800; color: #1A1235; }

/* ── Horizontal bar (top earners) ── */
.dash-earners-more {
  display: block; width: 100%; margin-top: 10px;
  background: rgba(168,85,247,0.07);
  border: 1px solid rgba(168,85,247,0.18);
  border-radius: 10px;
  color: #A855F7; font-size: 11px; font-weight: 700; cursor: pointer;
  padding: 6px 0; text-align: center;
  transition: background 0.15s;
}
.dash-earners-more:hover { background: rgba(168,85,247,0.14); }
.dash-hbar-list { display: flex; flex-direction: column; gap: 8px; }
.dash-hbar-row  { display: flex; align-items: center; gap: 7px; }
.dash-hbar-rank { width: 16px; font-size: 11px; font-weight: 800; color: #7A6F9E; flex-shrink: 0; text-align: center; }
.dash-hbar-body { flex: 1; min-width: 0; }
.dash-hbar-label { font-size: 11px; font-weight: 700; color: #52497A; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dash-hbar-track { height: 6px; background: #F2F0FB; border-radius: 4px; overflow: hidden; }
.dash-hbar-fill  { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
.dash-hbar-val   { font-size: 11px; font-weight: 800; flex-shrink: 0; }

/* ── Team ratio ── */
.dash-ratio-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.dash-ratio-svg  { width: 80px; height: 80px; flex-shrink: 0; }
.dash-ratio-info { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.dash-ratio-row  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #52497A; }
.dash-ratio-row strong { margin-left: auto; font-weight: 800; color: #1A1235; }
.dash-ratio-pct  { font-size: 20px; font-weight: 900; color: #6366F1; line-height: 1; }

/* ── Daily Active Users ── */
.dau-header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dau-range-tabs { display: flex; border: 1px solid #E2DCFB; border-radius: 10px; overflow: hidden; }
.dau-tab {
  padding: 4px 10px; font-size: 11px; font-weight: 700; border: none; cursor: pointer;
  background: white; color: #7A6F9E; font-family: 'Sarabun', sans-serif;
  transition: background 0.15s;
}
.dau-tab.active { background: #6366F1; color: white; }
.dau-summary {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 8px; padding: 10px 14px 14px;
}
.dau-pill {
  background: #F2F0FB; border-radius: 12px; padding: 10px 8px;
  text-align: center; border: 1.5px solid #E2DCFB;
}
.dau-pill--accent { background: rgba(99,102,241,0.09); border-color: rgba(99,102,241,0.22); }
.dau-pill-val { font-size: 19px; font-weight: 900; color: #1A1235; line-height: 1; }
.dau-pill--accent .dau-pill-val { color: #6366F1; }
.dau-pill-label { font-size: 10px; color: #7A6F9E; margin-top: 3px; font-weight: 600; }
.dau-chart-wrap { padding: 0 14px; }
.dau-svg { width: 100%; height: auto; display: block; }
.dau-legend { padding: 0 14px 14px; }

/* ── Role bars ── */
.dash-role-list { display: flex; flex-direction: column; gap: 6px; }
.dash-role-row  { display: flex; align-items: center; gap: 6px; }
.dash-role-label { font-size: 10px; color: #7A6F9E; width: 72px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.dash-role-track { flex: 1; height: 5px; background: #F2F0FB; border-radius: 3px; overflow: hidden; }
.dash-role-fill  { height: 100%; border-radius: 3px; }
.dash-role-val   { font-size: 10px; font-weight: 700; color: #52497A; flex-shrink: 0; }
</style>
