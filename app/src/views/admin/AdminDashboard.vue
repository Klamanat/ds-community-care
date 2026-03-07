<template>
  <div class="al-wrap">
    <!-- Top bar -->
    <header class="al-header">
      <div class="al-logo">🛡️ DS Admin</div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;color:#6B7280;">สวัสดี, <strong>{{ admin.adminName }}</strong></span>
        <button class="al-logout-btn" @click="doLogout">ออกจากระบบ</button>
      </div>
    </header>

    <main class="al-main">
      <h2 class="al-page-title">📊 Dashboard</h2>

      <div class="al-grid-4" style="grid-template-columns:repeat(2,1fr);" >
        <router-link v-for="card in navCards" :key="card.to" :to="card.to" class="al-nav-card">
          <div class="al-nav-icon">{{ card.icon }}</div>
          <div class="al-nav-label">{{ card.label }}</div>
          <div class="al-nav-sub">{{ card.sub }}</div>
          <div class="al-nav-arrow">→</div>
        </router-link>
      </div>

      <!-- Quick info -->
      <div class="al-info-box mt-6">
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px;">📋 วิธีใช้งาน</div>
        <ul style="font-size:12px;color:#6B7280;line-height:2;padding-left:16px;margin:0;">
          <li>คลิกการ์ดด้านบนเพื่อเข้าสู่หน้าจัดการข้อมูล</li>
          <li>ข้อมูลโหลดจาก Google Sheets ผ่าน GAS API</li>
          <li>การแก้ไข/ลบจะมีผลทันทีกับ Google Sheets</li>
          <li>Token หมดอายุหลัง 24 ชั่วโมง (login ใหม่)</li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'

const admin  = useAdminStore()
const router = useRouter()

const navCards = [
  { to: '/admin/employees',  icon: '👥', label: 'พนักงาน',      sub: 'Employees sheet' },
  { to: '/admin/birthdays',  icon: '🎂', label: 'วันเกิด',       sub: 'Birthdays sheet' },
  { to: '/admin/empathy',    icon: '💌', label: 'Empathy Posts', sub: 'EmpathyPosts sheet' },
  { to: '/admin/ideas',      icon: '💡', label: 'ไอเดีย',        sub: 'Ideas sheet' },
  { to: '/admin/activities', icon: '📅', label: 'กิจกรรม',       sub: 'Activities sheet' },
]

function doLogout() {
  admin.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
@import './admin.css';
</style>
