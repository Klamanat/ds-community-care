<template>
  <BaseModal modal-id="modal-counselor-inbox">
    <!-- Header -->
    <div class="ci-header">
      <div class="ci-orb ci-orb1"></div>
      <div class="ci-orb ci-orb2"></div>
      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div class="ci-header-body">
        <div class="ci-icon">💬</div>
        <div class="ci-title">กล่องข้อความที่ปรึกษา</div>
        <div class="ci-sub">ข้อความจากผู้ขอคำปรึกษา (ปกปิดตัวตน)</div>
      </div>
      <div v-if="mental.unreadCount" class="ci-unread-strip">
        {{ mental.unreadCount }} ข้อความใหม่
      </div>
    </div>

    <!-- Body -->
    <div class="modal-body-scroll" style="padding:16px;">

      <div v-if="mental.requestsLoading" class="ci-loading">⏳ กำลังโหลด...</div>

      <div v-else-if="mental.requestsError" class="ci-error">
        ⚠️ {{ mental.requestsError }}
        <button class="ci-retry" @click="reload">โหลดใหม่</button>
      </div>

      <div v-else-if="!mental.myRequests.length" class="ci-empty">
        <div style="font-size:40px;margin-bottom:8px;">📭</div>
        <div>ยังไม่มีข้อความ</div>
      </div>

      <div v-else>
        <div class="ci-count">ทั้งหมด {{ mental.myRequests.length }} ข้อความ</div>

        <div
          v-for="r in mental.myRequests"
          :key="r.id"
          class="ci-item"
          :class="{ 'ci-item-unread': r.isRead !== 'true' }"
          @click="mental.markRead(r.id)"
        >
          <div class="ci-item-top">
            <span v-if="r.isRead !== 'true'" class="ci-new-badge">ใหม่</span>
            <span class="ci-time">{{ fmtTime(r.createdAt) }}</span>
          </div>
          <div class="ci-msg">{{ r.message }}</div>
        </div>
      </div>

    </div>
  </BaseModal>
</template>

<script setup>
import { onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useMentalStore }   from '../../stores/mental.js'
import { useUserAuthStore } from '../../stores/userAuth.js'
import { useUiStore }       from '../../stores/ui.js'

const mental   = useMentalStore()
const userAuth = useUserAuthStore()
const ui       = useUiStore()

function reload() {
  mental.loadMyRequests(userAuth.userId, true)
}

onMounted(() => {
  mental.loadMyRequests(userAuth.userId, true)
})

function fmtTime(iso) {
  if (!iso) return ''
  try {
    const d    = new Date(iso)
    const diff = Date.now() - d
    if (diff < 60000)    return 'เมื่อกี้'
    if (diff < 3600000)  return Math.floor(diff / 60000) + ' นาทีที่แล้ว'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ชั่วโมงที่แล้ว'
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}
</script>

<style scoped>
.ci-header {
  background: linear-gradient(135deg, #A8E6CF 0%, #56C596 45%, #2EAF7D 100%);
  padding: 0 20px 18px;
  position: relative; overflow: hidden; flex-shrink: 0;
  border-radius: 28px 28px 0 0;
}
.ci-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.ci-orb1 { width: 110px; height: 110px; top: -30px; right: -20px; background: rgba(255,255,255,0.1); }
.ci-orb2 { width: 70px;  height: 70px;  bottom: -20px; left: 10px; background: rgba(255,255,255,0.08); }

.ci-header-body { text-align: center; position: relative; z-index: 1; }
.ci-icon  { font-size: 48px; margin-bottom: 4px; }
.ci-title { font-size: 18px; font-weight: 800; color: white; }
.ci-sub   { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 3px; }

.ci-unread-strip {
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.18); border-radius: 30px; padding: 6px 18px;
  margin-top: 12px; backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
  font-size: 12px; font-weight: 800; color: white;
  position: relative; z-index: 1;
}

.ci-loading { text-align: center; padding: 32px; color: #9CA3AF; font-size: 14px; }
.ci-empty   { text-align: center; padding: 32px; color: #9CA3AF; font-size: 13px; }

.ci-error {
  background: #FEF2F2; border-radius: 10px; padding: 12px 14px;
  font-size: 12px; color: #DC2626;
  display: flex; align-items: center; gap: 8px;
}
.ci-retry {
  background: none; border: 1px solid #DC2626; color: #DC2626;
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 2px 8px; cursor: pointer; margin-left: auto;
}

.ci-count {
  font-size: 11px; font-weight: 700; color: #9CA3AF;
  text-align: center; margin-bottom: 12px;
}

.ci-item {
  padding: 14px;
  background: white;
  border: 1.5px solid #E5E7EB;
  border-radius: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.1s;
}
.ci-item:active { transform: scale(0.99); }
.ci-item-unread {
  background: #F0FDF4;
  border-color: #86EFAC;
}

.ci-item-top {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.ci-new-badge {
  font-size: 10px; font-weight: 800; color: #15803D;
  background: #DCFCE7; padding: 2px 8px; border-radius: 10px;
}
.ci-time { font-size: 10px; color: #9CA3AF; margin-left: auto; }

.ci-msg {
  font-size: 14px; color: #111827; line-height: 1.6;
}
</style>
