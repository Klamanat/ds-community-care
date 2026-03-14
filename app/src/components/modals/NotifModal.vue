<template>
  <BaseModal modal-id="modal-notif" sheet-class="modal-sheet--notif">

    <!-- ── Header ── -->
    <div class="notif-hdr">
      <!-- Back button (mobile only) -->
      <button class="notif-back-btn" @click="ui.closeModal()">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      <div style="font-size:20px;font-weight:900;color:#050505;">การแจ้งเตือน</div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;margin-left:auto;">
        <button class="fb-tab" :class="{ active: tab === 'all' }"    @click="tab = 'all'">ทั้งหมด</button>
        <button class="fb-tab" :class="{ active: tab === 'unread' }" @click="tab = 'unread'">
          ยังไม่ได้อ่าน
          <span v-if="notif.unreadCount > 0" class="fb-tab-badge">{{ notif.unreadCount }}</span>
        </button>
      </div>
    </div>

    <!-- ── List ── -->
    <div class="modal-body-scroll" style="padding:8px 8px 24px;">

      <!-- Loading -->
      <div v-if="notif.loading && !notif.items.length" style="padding:4px 8px;display:flex;flex-direction:column;gap:4px;">
        <div v-for="i in 5" :key="i" class="fb-skeleton"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filtered.length" style="text-align:center;padding:48px 16px;color:#65676B;">
        <div style="font-size:48px;margin-bottom:12px;">{{ tab === 'unread' ? '✅' : '🔕' }}</div>
        <div style="font-size:14px;font-weight:700;">
          {{ tab === 'unread' ? 'อ่านครบทุกข้อความแล้ว' : 'ยังไม่มีการแจ้งเตือน' }}
        </div>
      </div>

      <!-- Items -->
      <div
        v-for="n in filtered"
        :key="n.id"
        class="fb-notif-item"
        :class="{ 'fb-unread': !notif.isRead(n.id) }"
        @click="handleTap(n)"
      >
        <!-- Icon circle -->
        <div class="fb-notif-avatar" :style="{ background: n.color }">
          <span style="font-size:24px;line-height:1;">{{ typeEmoji(n.type) }}</span>
        </div>

        <!-- Body -->
        <div style="flex:1;min-width:0;">
          <div class="fb-notif-title">{{ n.title }}</div>
          <div v-if="n.msg" class="fb-notif-sub">{{ n.msg }}</div>
          <div class="fb-notif-time" :class="{ 'fb-time-new': !notif.isRead(n.id) }">
            {{ timeAgo(n.time) }}
          </div>
        </div>

        <!-- Unread dot -->
        <div v-if="!notif.isRead(n.id)" class="fb-unread-dot"></div>
      </div>

      <!-- Mark all read (bottom) -->
      <div v-if="notif.unreadCount > 0 && tab === 'all'" style="padding:12px 8px 0;text-align:center;">
        <button
          style="background:none;border:none;color:#1877F2;font-size:13px;font-weight:700;cursor:pointer;padding:8px 16px;border-radius:8px;"
          @click="notif.markAllRead()"
        >อ่านทั้งหมดแล้ว ✓</button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal         from '../shared/BaseModal.vue'
import { useNotifStore } from '../../stores/notif.js'
import { useUiStore }    from '../../stores/ui.js'
import { useUserAuthStore } from '../../stores/userAuth.js'

const notif    = useNotifStore()
const ui       = useUiStore()
const userAuth = useUserAuthStore()
const router   = useRouter()

const tab = ref('all')

const filtered = computed(() =>
  tab.value === 'unread'
    ? notif.items.filter(n => !notif.isRead(n.id))
    : notif.items
)

onMounted(() => {
  notif.load(userAuth.userName || '', true)
})

// ── Icon per type ──────────────────────────────────────────
function typeEmoji(type) {
  if (type === 'birthday') return '🎂'
  if (type === 'activity') return '🎊'
  if (type === 'kudos')    return '💝'
  if (type === 'wish')     return '💌'
  if (type === 'points')   return '🏆'
  if (type === 'stamp')    return '📍'
  return '🔔'
}

// ── Thai time-ago ──────────────────────────────────────────
function timeAgo(raw) {
  if (!raw) return ''
  // GAS formatDate: "dd/MM/yyyy HH:mm"
  let d
  const m = String(raw).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (m) {
    d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5])
  } else {
    d = new Date(raw)
  }
  if (isNaN(d)) return raw

  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)              return 'เมื่อกี้'
  if (diff < 3600)            return Math.floor(diff / 60) + ' นาทีที่แล้ว'
  if (diff < 86400)           return Math.floor(diff / 3600) + ' ชั่วโมงที่แล้ว'
  if (diff < 86400 * 7)       return Math.floor(diff / 86400) + ' วันที่แล้ว'
  // Fallback: show raw date
  const TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${d.getDate()} ${TH[d.getMonth()]} ${d.getFullYear() + 543}`
}

// ── Tap action ─────────────────────────────────────────────
function handleTap(n) {
  notif.markRead(n.id)
  ui.closeModal()
  const t = n.target || ''
  if (t === 'bday')           { setTimeout(() => ui.openModal('modal-bday'),   120); return }
  if (t === 'empathy')        { router.push('/'); return }
  if (t.startsWith('month_')) {
    const idx = parseInt(t.split('_')[1], 10)
    if (idx) setTimeout(() => ui.openMonthModal(idx), 120)
  }
}
</script>

<style scoped>
/* ── Header ── */
.notif-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #F0F2F5;
  flex-shrink: 0;
}
.notif-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #F0F2F5;
  color: #050505;
  cursor: pointer;
  flex-shrink: 0;
}
.notif-back-btn:active { background: #E4E6EB; }
/* Hide back btn on desktop — use X button from BaseModal instead */
@media (min-width: 768px) { .notif-back-btn { display: none; } }

/* ── Tabs ── */
.fb-tab {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: transparent;
  color: #65676B;
  position: relative;
  transition: background 0.15s;
}
.fb-tab.active {
  background: #E7F3FF;
  color: #1877F2;
}
.fb-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #E41E3F;
  color: white;
  font-size: 10px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  padding: 0 4px;
  margin-left: 4px;
  vertical-align: middle;
}

/* ── Notification item ── */
.fb-notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 2px;
}
.fb-notif-item:active { background: #E9EAEB !important; }
.fb-unread { background: #E7F3FF; }

/* ── Avatar circle ── */
.fb-notif-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Text ── */
.fb-notif-title {
  font-size: 13px;
  font-weight: 600;
  color: #050505;
  line-height: 1.35;
  margin-bottom: 1px;
}
.fb-notif-sub {
  font-size: 12px;
  color: #65676B;
  line-height: 1.3;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fb-notif-time {
  font-size: 12px;
  font-weight: 600;
  color: #65676B;
}
.fb-time-new { color: #1877F2; }

/* ── Unread dot ── */
.fb-unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1877F2;
  flex-shrink: 0;
}

/* ── Loading skeleton ── */
.fb-skeleton {
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 50%, #F0F2F5 75%);
  background-size: 200% 100%;
  animation: fb-shimmer 1.4s infinite;
  margin-bottom: 4px;
}
@keyframes fb-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
