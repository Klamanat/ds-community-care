<template>
  <div class="tab-page notif-page">

    <!-- Header row -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div class="text-[15px] font-extrabold text-app-dark">🔔 แจ้งเตือน</div>
      <button
        v-if="unreadCount > 0"
        class="text-[11px] font-bold"
        style="background:none;border:none;color:#6366F1;cursor:pointer;padding:2px 6px;"
        @click="notif.markAllRead()"
      >อ่านทั้งหมด ✓</button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="notif.loading && !notif.items.length" style="display:flex;flex-direction:column;gap:10px;">
      <div v-for="i in 4" :key="i" class="notif-skeleton"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!notif.items.length" class="text-center py-14 text-app-light">
      <div class="text-[44px] mb-3">🔕</div>
      <div class="text-[14px] font-bold">ยังไม่มีการแจ้งเตือน</div>
      <div class="text-[12px] mt-1">ระบบจะแจ้งเตือนกิจกรรม วันเกิด และ kudos ที่นี่</div>
    </div>

    <!-- Notification list -->
    <div v-else class="bg-white rounded-2xl border border-app-border overflow-hidden shadow-app-sm">
      <div
        v-for="n in notif.items"
        :key="n.id"
        class="notif-item ripple-host"
        :class="{ unread: !notif.isRead(n.id) }"
        @click="handleTap(n)"
      >
        <!-- Color dot -->
        <div class="notif-dot" :style="{ background: n.color }"></div>

        <!-- Body -->
        <div class="notif-body" style="flex:1;min-width:0;">
          <div class="notif-title">{{ n.title }}</div>
          <div v-if="n.msg" class="notif-msg">{{ n.msg }}</div>
          <div v-if="n.time" class="notif-time">{{ n.time }}</div>
        </div>

        <!-- Unread badge dot -->
        <div
          v-if="!notif.isRead(n.id)"
          style="width:8px;height:8px;border-radius:50%;background:#6366F1;flex-shrink:0;margin-top:4px;"
        ></div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifStore } from '../stores/notif.js'
import { useUiStore }    from '../stores/ui.js'
import { useUserAuthStore } from '../stores/userAuth.js'

const notif    = useNotifStore()
const ui       = useUiStore()
const userAuth = useUserAuthStore()
const router   = useRouter()

const unreadCount = computed(() => notif.unreadCount)

onMounted(() => {
  notif.load(userAuth.userName || '', true)   // force-refresh when page opens
})

function handleTap(n) {
  notif.markRead(n.id)
  const t = n.target || ''

  if (t === 'bday')         { ui.openModal('modal-bday'); return }
  if (t === 'empathy')      { router.push('/'); return }
  if (t.startsWith('month_')) {
    const idx = parseInt(t.split('_')[1], 10)
    if (idx) ui.openMonthModal(idx)
    return
  }
}
</script>

<style scoped>
.notif-skeleton {
  height: 68px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  border-radius: 14px;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
