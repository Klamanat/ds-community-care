<template>
  <div class="settings-page">
    <!-- Profile Card -->
    <div
      style="background:linear-gradient(135deg,#6366F1,#A855F7,#EC4899);border-radius:var(--r-xl);padding:20px;margin-bottom:20px;display:flex;align-items:center;gap:16px;cursor:pointer;box-shadow:var(--sh);"
      @click="ui.openModal('modal-profile')"
    >
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#FDE68A,#F59E0B);display:flex;align-items:center;justify-content:center;font-size:28px;border:3px solid rgba(255,255,255,0.5);flex-shrink:0;">{{ ui.currentUser.emoji }}</div>
      <div style="flex:1;">
        <div style="font-size:17px;font-weight:800;color:white;">{{ ui.currentUser.name }}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px;">{{ ui.currentUser.role }}</div>
        <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.18);border-radius:20px;padding:3px 10px;margin-top:6px;">
          <div style="width:7px;height:7px;border-radius:50%;background:#4ADE80;"></div>
          <span style="font-size:11px;color:white;font-weight:600;">ออนไลน์</span>
        </div>
      </div>
      <div style="color:rgba(255,255,255,0.7);font-size:20px;">›</div>
    </div>

    <!-- Account -->
    <div class="setting-group">
      <div class="setting-group-title">บัญชีผู้ใช้</div>
      <div class="setting-item" @click="ui.openModal('modal-profile')">
        <span class="setting-ico">👤</span>
        <div class="setting-info"><div class="setting-title">แก้ไขโปรไฟล์</div><div class="setting-sub">ชื่อ, รูปภาพ, แผนก</div></div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-ico">🔐</span>
        <div class="setting-info"><div class="setting-title">ความปลอดภัย</div><div class="setting-sub">รหัสผ่าน, การยืนยันตัวตน</div></div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-ico">🔗</span>
        <div class="setting-info"><div class="setting-title">เชื่อมต่อบัญชี</div><div class="setting-sub">LINE, Google</div></div>
        <span class="setting-arr">›</span>
      </div>
    </div>

    <!-- Notifications -->
    <div class="setting-group">
      <div class="setting-group-title">การแจ้งเตือน</div>
      <div v-for="tog in toggles" :key="tog.key" class="setting-item">
        <span class="setting-ico">{{ tog.ico }}</span>
        <div class="setting-info"><div class="setting-title">{{ tog.title }}</div><div class="setting-sub">{{ tog.sub }}</div></div>
        <div class="toggle" :class="{ on: tog.on }" @click="tog.on = !tog.on"></div>
      </div>
    </div>

    <!-- Privacy -->
    <div class="setting-group">
      <div class="setting-group-title">ความเป็นส่วนตัว</div>
      <div class="setting-item">
        <span class="setting-ico">👁️</span>
        <div class="setting-info"><div class="setting-title">แสดงสถานะออนไลน์</div><div class="setting-sub">ให้คนอื่นเห็นว่าคุณออนไลน์</div></div>
        <div class="toggle on" @click="e => e.target.classList.toggle('on')"></div>
      </div>
      <div class="setting-item">
        <span class="setting-ico">🎉</span>
        <div class="setting-info"><div class="setting-title">แสดงวันเกิดในปฏิทิน</div><div class="setting-sub">ให้ทีมเห็นวันเกิดของคุณ</div></div>
        <div class="toggle on" @click="e => e.target.classList.toggle('on')"></div>
      </div>
    </div>

    <!-- General -->
    <div class="setting-group">
      <div class="setting-group-title">ทั่วไป</div>
      <div class="setting-item">
        <span class="setting-ico">🌏</span>
        <div class="setting-info"><div class="setting-title">ภาษา</div><div class="setting-sub">ภาษาไทย</div></div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-ico">🎨</span>
        <div class="setting-info"><div class="setting-title">ธีม</div><div class="setting-sub">สีม่วง (ค่าเริ่มต้น)</div></div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-ico">ℹ️</span>
        <div class="setting-info"><div class="setting-title">เกี่ยวกับแอป</div><div class="setting-sub">DS Community Care v2.0</div></div>
        <span class="setting-arr">›</span>
      </div>
    </div>

    <!-- Logout -->
    <div style="background:white;border-radius:var(--r-lg);box-shadow:var(--sh-sm);overflow:hidden;border:1px solid #FFE4E4;margin-bottom:32px;">
      <div class="setting-item" style="color:#EF4444;">
        <span class="setting-ico">🚪</span>
        <div class="setting-info"><div class="setting-title" style="color:#EF4444;">ออกจากระบบ</div><div class="setting-sub">Sign out จากอุปกรณ์นี้</div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUiStore } from '../stores/ui.js'
const ui = useUiStore()

const toggles = ref([
  { key:'push',    ico:'🔔', title:'Push Notification', sub:'รับแจ้งเตือนกิจกรรมทั้งหมด',          on: true  },
  { key:'bday',    ico:'🎂', title:'แจ้งเตือนวันเกิด',   sub:'แจ้งเตือนล่วงหน้า 1 วัน',               on: true  },
  { key:'empathy', ico:'💝', title:'Community Empathy', sub:'แจ้งเมื่อมีคนส่งความรู้สึกดีๆ',          on: true  },
  { key:'event',   ico:'📅', title:'กิจกรรมใหม่',        sub:'แจ้งเตือนเมื่อมีกิจกรรมใหม่',            on: false },
])
</script>
