<template>
  <div class="adm-shell">

    <!-- Mobile overlay -->
    <div v-if="sideOpen" class="adm-overlay" @click="sideOpen = false"></div>

    <!-- Sidebar -->
    <aside class="adm-sidebar" :class="{ open: sideOpen }">
      <div class="adm-sb-brand">
        <div class="adm-sb-logo">
          <div class="adm-sb-logo-icon">🛡️</div>
          <div>
            <div class="adm-sb-logo-name">DS Admin</div>
            <div class="adm-sb-logo-ver">v2.0 · Dashboard</div>
          </div>
        </div>
        <button class="adm-sb-close" @click="sideOpen = false">✕</button>
      </div>

      <nav class="adm-sb-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="adm-sb-item"
          :class="{ active: isActive(item) }"
          @click="sideOpen = false"
        >
          <span class="adm-sb-icon">{{ item.icon }}</span>
          <div class="adm-sb-info">
            <div class="adm-sb-label">{{ item.label }}</div>
            <div class="adm-sb-sub">{{ item.sub }}</div>
          </div>
        </router-link>
      </nav>

      <div class="adm-sb-footer">
        <div class="adm-sb-user">
          <div class="adm-sb-user-av">{{ (admin.adminName || 'A')[0].toUpperCase() }}</div>
          <div class="adm-sb-user-info">
            <div class="adm-sb-user-name">{{ admin.adminName }}</div>
            <div class="adm-sb-user-role">Administrator</div>
          </div>
        </div>
        <button class="adm-sb-logout" @click="doLogout">ออกจากระบบ</button>
      </div>
    </aside>

    <!-- Main body -->
    <div class="adm-body">

      <!-- Topbar (mobile only) -->
      <header class="adm-topbar">
        <button class="adm-hamburger" @click="sideOpen = true">☰</button>
        <div class="adm-topbar-logo">🛡️ <strong>DS Admin</strong></div>
        <span class="adm-topbar-user">{{ admin.adminName }}</span>
      </header>

      <!-- Desktop header (hidden on mobile) -->
      <header class="adm-desk-header">
        <div class="adm-desk-bc">
          <span class="adm-desk-bc-root">DS Admin</span>
          <span class="adm-desk-bc-sep">/</span>
          <div class="adm-desk-bc-page">
            <span>{{ currentItem.icon }}</span>
            <span>{{ currentItem.label }}</span>
          </div>
        </div>
        <div class="adm-desk-user">
          <div class="adm-desk-user-av">{{ (admin.adminName || 'A')[0].toUpperCase() }}</div>
          <span class="adm-desk-user-name">{{ admin.adminName }}</span>
        </div>
      </header>

      <!-- Page content -->
      <div class="adm-content">
        <RouterView />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'

const route  = useRoute()
const router = useRouter()
const admin  = useAdminStore()

const sideOpen = ref(false)

const navItems = [
  { to: '/admin',              icon: '🏠', label: 'Dashboard',         sub: 'Overview' },
  { to: '/admin/employees',    icon: '👥', label: 'พนักงาน & วันเกิด', sub: 'Employees · Birthdays' },
  { to: '/admin/empathy',      icon: '💌', label: 'Empathy',            sub: 'Posts · Kudos' },
  { to: '/admin/ideas',        icon: '💡', label: 'ไอเดีย',             sub: 'Ideas' },
  { to: '/admin/activities',   icon: '📅', label: 'กิจกรรม',            sub: 'Activities' },
  { to: '/admin/announcement', icon: '📢', label: 'ประกาศ / Popup',     sub: 'Announcement' },
  { to: '/admin/reward-rules', icon: '🏆', label: 'วิธีสะสมคะแนน',     sub: 'PointRules' },
  { to: '/admin/training',     icon: '📚', label: 'Training',           sub: 'หลักสูตร' },
  { to: '/admin/mental',       icon: '💚', label: 'Mental Health',      sub: 'ที่ปรึกษา' },
  { to: '/admin/home-cards',   icon: '🏠', label: 'Home Cards',         sub: 'เปิด-ปิด cards' },
  { to: '/admin/plans',        icon: '📋', label: 'Monthly Plans',       sub: 'แผนรายเดือน' },
]

function isActive(item) {
  if (item.to === '/admin') return route.path === '/admin'
  return route.path.startsWith(item.to)
}

const currentItem = computed(() => navItems.find(i => isActive(i)) || navItems[0])

function doLogout() {
  admin.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
@import './admin.css';
</style>
