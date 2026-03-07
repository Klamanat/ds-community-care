<template>
  <nav class="sidebar">
    <div class="sidebar-section-label">เมนูหลัก</div>

    <NavItem to="/" icon="🏠" label="หน้าหลัก" />
    <NavItem to="/star" icon="⭐" label="Star Gang" />
    <NavItem to="/idea" icon="💡" label="ไอเดีย" />

    <div class="sidebar-divider"></div>
    <div class="sidebar-section-label">บัญชี</div>

    <NavItem to="/notif" icon="🔔" label="แจ้งเตือน" :badge="ui.notifBadge" />
    <NavItem to="/settings" icon="⚙️" label="ตั้งค่า" />
  </nav>
</template>

<script setup>
import NavItem from './NavItem.vue'
import { useUiStore } from '../../stores/ui.js'
const ui = useUiStore()
</script>
