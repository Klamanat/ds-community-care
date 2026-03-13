<template>
  <nav class="bottom-nav">
    <NavItem to="/"         icon="🏠" label="หน้าหลัก"  mobile />
    <NavItem to="/star"     icon="⭐" label="Star"      mobile />
    <NavItem to="/idea"     icon="💡" label="ไอเดีย"    mobile />

    <!-- Notification bell — popup -->
    <button class="notif-bell-btn" @click.stop="ui.openModal('modal-notif')">
      <span class="notif-bell-ico">
        🔔
        <span v-if="ui.notifBadge > 0" class="notif-bell-badge">{{ ui.notifBadge > 99 ? '99+' : ui.notifBadge }}</span>
      </span>
      <span class="notif-bell-lbl">แจ้งเตือน</span>
    </button>

    <NavItem to="/settings" icon="⚙️" label="ตั้งค่า"   mobile />
  </nav>
</template>

<script setup>
import NavItem from './NavItem.vue'
import { useUiStore } from '../../stores/ui.js'
const ui = useUiStore()
</script>

<style scoped>
.notif-bell-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 6px 4px;
  border-radius: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}
.notif-bell-btn:active { background: rgba(99,102,241,0.08); }
.notif-bell-ico {
  font-size: 22px;
  line-height: 1;
  position: relative;
  display: inline-block;
}
.notif-bell-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 15px;
  height: 15px;
  background: #FF6B6B;
  color: white;
  font-size: 8px;
  font-weight: 800;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1.5px solid white;
}
.notif-bell-lbl {
  font-size: 10px;
  font-weight: 700;
  color: #9B8FBB;
}
</style>
