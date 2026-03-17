<template>
  <main class="al-main">
      <!-- Welcome -->
      <div style="background:linear-gradient(135deg,#312E81,#4F46E5,#7C3AED);border-radius:16px;padding:20px 18px;color:white;">
        <div style="font-size:22px;font-weight:900;margin-bottom:4px;">👋 สวัสดี, {{ admin.adminName }}</div>
        <div style="font-size:13px;opacity:0.8;">ระบบจัดการ DS Community Care</div>
      </div>

      <!-- Nav cards -->
      <div class="al-nav-grid">
        <router-link v-for="card in navCards" :key="card.to" :to="card.to" class="al-nav-card">
          <div class="al-nav-icon">{{ card.icon }}</div>
          <div class="al-nav-label">{{ card.label }}</div>
          <div class="al-nav-sub">{{ card.sub }}</div>
          <div class="al-nav-arrow">›</div>
        </router-link>
      </div>

      <!-- Info -->
      <div class="al-info-box">
        <div style="font-size:12px;font-weight:800;color:#3730A3;margin-bottom:8px;">📋 วิธีใช้งาน</div>
        <ul style="font-size:12px;color:#4338CA;line-height:2;padding-left:16px;margin:0;">
          <li>กดการ์ดด้านบนเพื่อเข้าสู่หน้าจัดการข้อมูล</li>
          <li>ข้อมูลโหลดจาก Google Sheets ผ่าน GAS API</li>
          <li>การแก้ไข/ลบจะมีผลทันทีกับ Google Sheets</li>
          <li>Token หมดอายุหลัง 24 ชั่วโมง (login ใหม่)</li>
        </ul>
      </div>
    </main>
</template>

<script setup>
import { useAdminStore } from '../../stores/admin.js'

const admin = useAdminStore()

const navCards = [
  { to: '/admin/employees',    icon: '👥', label: 'พนักงาน & วันเกิด', sub: 'Employees · Birthdays' },
  { to: '/admin/empathy',      icon: '💌', label: 'Empathy',            sub: 'Posts · Kudos' },
  { to: '/admin/ideas',        icon: '💡', label: 'ไอเดีย',             sub: 'Ideas sheet' },
  { to: '/admin/activities',   icon: '📅', label: 'กิจกรรม',            sub: 'Activities sheet' },
  { to: '/admin/announcement', icon: '📢', label: 'ประกาศ / Popup',     sub: 'Announcement settings' },
  { to: '/admin/reward-rules', icon: '🏆', label: 'วิธีสะสมคะแนน',     sub: 'PointRules sheet' },
  { to: '/admin/training',     icon: '📚', label: 'Training',           sub: 'หลักสูตรพัฒนาทักษะ' },
  { to: '/admin/mental',       icon: '💚', label: 'Mental Health',       sub: 'ที่ปรึกษาสุขภาพจิต' },
]

</script>

<style scoped>
@import './admin.css';
</style>
