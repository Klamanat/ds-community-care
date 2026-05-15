<template>
  <header class="app-header">
    <div class="hdr-logo">
      <div class="hdr-logo-icon">
        <img src="/favicon.svg" alt="" class="hdr-logo-favicon" />
      </div>
      <div class="hdr-logo-text">
        <span class="hdr-logo-name">DS Community</span>
        <span class="hdr-logo-care">Care</span>
      </div>
    </div>

    <div class="hdr-search">
      <span>🔍</span>
      <span>ค้นหา...</span>
    </div>

    <div class="hdr-right">
      <!-- Counselor inbox — only visible when user is a counselor -->
      <div v-if="isCounselor" class="hdr-btn" @click="ui.openModal('modal-counselor-inbox')">
        💬
        <div v-if="mental.unreadCount" class="hbadge">{{ mental.unreadCount > 99 ? '99+' : mental.unreadCount }}</div>
      </div>

      <div class="hdr-btn" @click="ui.openModal('modal-notif')">
        🔔
        <div v-if="ui.notifBadge > 0" class="hbadge">{{ ui.notifBadge }}</div>
      </div>
      <div class="hdr-user" @click="ui.openModal('modal-profile')">
        <div class="hdr-avatar">
          <img v-if="ui.currentUser.img" :src="ui.currentUser.img" class="hdr-avatar-img" @error="e => e.target.style.display='none'" />
          <span v-else>{{ ui.currentUser.emoji || '😊' }}</span>
        </div>
        <div class="hdr-user-info">
          <div class="hdr-user-name">{{ ui.currentUser.name || 'โปรไฟล์' }}</div>
          <div v-if="ui.currentUser.role" class="hdr-user-role">{{ ui.currentUser.role }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUiStore }       from '../stores/ui.js'
import { useMentalStore }   from '../../features/mental/mental.store.js'
import { useUserAuthStore } from '../stores/userAuth.js'

const ui       = useUiStore()
const mental   = useMentalStore()
const userAuth = useUserAuthStore()

const isCounselor = computed(() => mental.isCounselor(userAuth.userId))
</script>

<style scoped>
.hdr-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.hdr-logo-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(255,255,255,0.18);
  border: 1.5px solid rgba(255,255,255,0.35);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hdr-logo-favicon { width: 22px; height: 22px; display: block; }
.hdr-logo-text { display: flex; flex-direction: column; line-height: 1; }
.hdr-logo-name {
  font-size: 14px; font-weight: 900; color: white;
  letter-spacing: -0.2px;
  text-shadow: 0 1px 6px rgba(0,0,0,0.25);
}
.hdr-logo-care {
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.75);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-top: 2px;
}
@media (max-width: 400px) {
  .hdr-logo-text { display: none; }
}
</style>
