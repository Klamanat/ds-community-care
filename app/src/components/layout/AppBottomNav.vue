<template>
  <nav class="bottom-nav">
    <NavItem to="/"         icon="🏠" label="หน้าหลัก"  mobile />
    <NavItem to="/star"     icon="⭐" label="Star"      mobile />
    <NavItem to="/idea"     icon="💡" label="ไอเดีย"    mobile />
    <NavItem to="/notif"      icon="🔔" label="แจ้งเตือน" mobile :badge="ui.notifBadge" />
    <NavItem to="/settings" icon="⚙️" label="ตั้งค่า"   mobile />
  </nav>
</template>

<script setup>
import NavItem from './NavItem.vue'
import { useUiStore } from '../../stores/ui.js'
const ui = useUiStore()
</script>
