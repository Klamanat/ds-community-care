<template>
  <div class="tv-page">

    <!-- Header -->
    <div class="tv-header">
      <div>
        <div class="tv-title">ตั๋วของฉัน</div>
        <div v-if="!loading" class="tv-subtitle">{{ tickets.length }} รายการ</div>
      </div>
      <div class="tv-header-icon">🎟</div>
    </div>

    <!-- Filter tabs -->
    <div class="tv-tabs">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="tv-tab" :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tabCount(tab.key)" class="tv-tab-count">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="tv-loading">
      <div class="tv-skeleton" v-for="i in 3" :key="i" />
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="tv-empty">
      <div class="tv-empty-icon">🎫</div>
      <div class="tv-empty-text">
        {{ activeTab === 'active' ? 'ไม่มีตั๋วที่ใช้งานได้' : activeTab === 'done' ? 'ยังไม่มีตั๋วที่ผ่านไปแล้ว' : 'ยังไม่มีตั๋วที่จอง' }}
      </div>
      <div class="tv-empty-sub">กิจกรรมที่มีตั๋วจะปรากฎที่นี่</div>
    </div>

    <!-- Ticket list -->
    <div v-else class="tv-list">
      <div
        v-for="t in filtered" :key="t.id"
        class="tv-card" :class="[`tv-card--${t.status}`]"
        @click="handleCardClick(t)"
      >
        <!-- Left accent strip -->
        <div class="tv-strip" :class="`tv-strip--${t.status}`">
          <span class="tv-strip-emoji">{{ t.activityEmoji || '📅' }}</span>
        </div>

        <!-- Perforation edge -->
        <div class="tv-perf">
          <div class="tv-perf-notch tv-perf-notch--top" />
          <div class="tv-perf-line" />
          <div class="tv-perf-notch tv-perf-notch--bottom" />
        </div>

        <!-- Body -->
        <div class="tv-body">
          <div class="tv-body-top">
            <div class="tv-activity-name">{{ t.activityName }}</div>
            <span class="tv-badge" :class="`tv-badge--${t.status}`">{{ statusLabel(t.status) }}</span>
          </div>

          <div class="tv-info-row">
            <span v-if="t.activityDate">📅 {{ t.activityDate }}{{ t.activityDateEnd ? ' – ' + t.activityDateEnd : '' }}</span>
          </div>
          <div v-if="t.activityLoc" class="tv-info-row">📍 {{ t.activityLoc }}</div>

          <div class="tv-footer-row">
            <div class="tv-ticket-no">{{ t.ticketNo }}<span v-if="t.quantity > 1"> · ×{{ t.quantity }}</span></div>
            <button
              v-if="t.status !== 'cancelled'"
              class="tv-action-btn" :class="t.status === 'pending_slip' ? 'tv-action-btn--slip' : ''"
              @click.stop="handleCardClick(t)"
            >
              <span v-if="t.status === 'pending_slip'">📎 แนบสลิป</span>
              <span v-else>ดู QR ▸</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '../stores/ui.js'
import * as svc from '../services/activitiesService.js'

const ui      = useUiStore()
const tickets = ref([])
const loading = ref(true)
const activeTab = ref('all')

const tabs = [
  { key: 'all',    label: 'ทั้งหมด' },
  { key: 'active', label: 'ใช้งานได้' },
  { key: 'done',   label: 'ผ่านไปแล้ว' },
]

function tabCount(key) {
  if (key === 'all') return tickets.value.length
  if (key === 'active') return tickets.value.filter(t => ['pending_slip','booked'].includes(t.status)).length
  if (key === 'done')   return tickets.value.filter(t => ['checked_in','cancelled'].includes(t.status)).length
  return 0
}

const filtered = computed(() => {
  if (activeTab.value === 'active') return tickets.value.filter(t => ['pending_slip','booked'].includes(t.status))
  if (activeTab.value === 'done')   return tickets.value.filter(t => ['checked_in','cancelled'].includes(t.status))
  return tickets.value
})

function statusLabel(s) {
  if (s === 'pending_slip') return 'รอสลิป'
  if (s === 'booked')       return 'รอ check-in'
  if (s === 'checked_in')   return 'เข้าแล้ว ✓'
  if (s === 'cancelled')    return 'ยกเลิก'
  return s
}

onMounted(async () => {
  try {
    tickets.value = await svc.getMyTickets(ui.currentUser.id)
  } finally {
    loading.value = false
  }
})

function handleCardClick(t) {
  if (t.status === 'cancelled') return
  ui.ticketActivity = {
    id: t.activityId,
    name: t.activityName,
    emoji: t.activityEmoji,
    date: t.activityDate,
    dateEnd: t.activityDateEnd,
    loc: t.activityLoc,
    ticketNote: t.ticketNote || '',
    ticketPrice: t.ticketPrice || 0,
    ticketCapacity: null,
    ticketEnabled: true,
    _preloadedTicket: t,
  }
  ui.openModal('ticket-modal')
}
</script>

<style scoped>
.tv-page {
  width: 100%;
  min-height: 80dvh;
  background: linear-gradient(160deg, #EDE9FE 0%, #F5F6FF 40%, #F0FDF4 100%);
  font-family: 'Sarabun', sans-serif;
  padding-bottom: 80px;
}

/* ── Header ── */
.tv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 16px 8px;
}
.tv-title {
  font-size: 22px;
  font-weight: 800;
  color: #1E1B4B;
  line-height: 1.2;
}
.tv-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
}
.tv-header-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(99,102,241,0.3));
}

/* ── Tabs ── */
.tv-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
}
.tv-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 20px;
  border: none;
  background: white;
  color: #6B7280;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Sarabun', sans-serif;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  transition: all .15s;
}
.tv-tab.active {
  background: #6366F1;
  color: white;
  box-shadow: 0 2px 8px rgba(99,102,241,0.35);
}
.tv-tab-count {
  background: rgba(255,255,255,0.25);
  color: inherit;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.tv-tab:not(.active) .tv-tab-count {
  background: #EEF2FF;
  color: #6366F1;
}

/* ── Loading skeletons ── */
.tv-loading { display: flex; flex-direction: column; }
.tv-skeleton {
  height: 90px;
  border-radius: 0;
  border-bottom: 1px solid #F0EEFF;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* ── Empty ── */
.tv-empty { text-align: center; padding: 60px 20px; }
.tv-empty-icon { font-size: 52px; margin-bottom: 12px; opacity: .7; }
.tv-empty-text { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 4px; }
.tv-empty-sub { font-size: 13px; color: #9CA3AF; }

/* ── List ── */
.tv-list {
  display: flex;
  flex-direction: column;
}

/* ── Card ── */
.tv-card {
  background: white;
  border-radius: 0;
  border-bottom: 1px solid #F0EEFF;
  box-shadow: none;
  display: flex;
  overflow: hidden;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
  position: relative;
}
.tv-card:active { transform: scale(.98); }
.tv-card--cancelled { opacity: .55; cursor: default; }

/* ── Strip ── */
.tv-strip {
  width: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tv-strip--pending_slip { background: linear-gradient(180deg, #FEF3C7, #FDE68A); }
.tv-strip--booked       { background: linear-gradient(180deg, #EDE9FE, #DDD6FE); }
.tv-strip--checked_in   { background: linear-gradient(180deg, #D1FAE5, #A7F3D0); }
.tv-strip--cancelled    { background: linear-gradient(180deg, #F3F4F6, #E5E7EB); }
.tv-strip-emoji { font-size: 24px; }

/* ── Perforation ── */
.tv-perf {
  width: 14px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.tv-perf-line {
  flex: 1;
  width: 1px;
  border-left: 2px dashed #E5E7EB;
}
.tv-perf-notch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(160deg, #EDE9FE, #F5F6FF);
  flex-shrink: 0;
}

/* ── Body ── */
.tv-body {
  flex: 1;
  padding: 12px 14px 12px 8px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tv-body-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}
.tv-activity-name {
  font-size: 14px;
  font-weight: 700;
  color: #1E1B4B;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}
.tv-info-row {
  font-size: 11.5px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tv-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}
.tv-ticket-no {
  font-size: 11px;
  font-weight: 700;
  color: #6366F1;
  letter-spacing: .5px;
  font-family: 'Courier New', monospace;
}

/* ── Badge ── */
.tv-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.tv-badge--pending_slip { background: #FEF3C7; color: #D97706; }
.tv-badge--booked       { background: #EEF2FF; color: #4F46E5; }
.tv-badge--checked_in   { background: #D1FAE5; color: #059669; }
.tv-badge--cancelled    { background: #F3F4F6; color: #9CA3AF; }

/* ── Action button ── */
.tv-action-btn {
  font-size: 11px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 10px;
  border: none;
  background: #EEF2FF;
  color: #4F46E5;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  white-space: nowrap;
  transition: background .15s;
}
.tv-action-btn--slip {
  background: #FEF3C7;
  color: #D97706;
}
</style>
