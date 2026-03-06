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
      <div class="hdr-btn" @click="router.push('/notif')">
        🔔
        <div v-if="ui.notifBadge > 0" class="hbadge">{{ ui.notifBadge }}</div>
      </div>
      <div class="hdr-avatar" @click="ui.openModal('modal-profile')">😊</div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUiStore } from '../../stores/ui.js'

const router = useRouter()
const ui = useUiStore()
</script>
