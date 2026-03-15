<template>
  <header class="app-header">
    <div class="hdr-logo">
      <span class="hdr-logo-badge">DS</span>
      <span class="hdr-logo-text">Community Care</span>
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
import { useUiStore }       from '../../stores/ui.js'
import { useMentalStore }   from '../../stores/mental.js'
import { useUserAuthStore } from '../../stores/userAuth.js'

const ui       = useUiStore()
const mental   = useMentalStore()
const userAuth = useUserAuthStore()

const isCounselor = computed(() => mental.isCounselor(userAuth.userId))
</script>

<style scoped>
@media (max-width: 480px) {
  .hdr-logo-text { display: none; }
}
</style>
