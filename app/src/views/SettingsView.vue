<template>
  <div class="tab-page settings-page">

    <!-- Profile Card -->
    <div
      class="flex items-center gap-4 p-5 rounded-xl shadow-app cursor-pointer"
      style="background:linear-gradient(135deg,#6366F1,#A855F7,#EC4899);"
      @click="ui.openModal('modal-profile')"
    >
      <div class="w-14 h-14 rounded-full bg-[linear-gradient(135deg,#FDE68A,#F59E0B)]
                  flex items-center justify-center text-[28px] border-[3px] border-white/50 flex-shrink-0">
        {{ ui.currentUser.emoji }}
      </div>
      <div class="flex-1">
        <div class="text-[17px] font-extrabold text-white">{{ ui.currentUser.name }}</div>
        <div class="text-[12px] text-white/80 mt-0.5">{{ ui.currentUser.role }}</div>
        <div class="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 mt-1.5">
          <div class="w-[7px] h-[7px] rounded-full bg-[#4ADE80]"></div>
          <span class="text-[11px] text-white font-semibold">ออนไลน์</span>
        </div>
      </div>
      <div class="text-white/70 text-xl">›</div>
    </div>

    <!-- Account -->
    <div class="setting-group">
      <div class="setting-group-title">บัญชีผู้ใช้</div>
      <div class="setting-item" @click="ui.openModal('modal-profile')">
        <span class="setting-ico">👤</span>
        <div class="setting-info">
          <div class="setting-title">แก้ไขโปรไฟล์</div>
          <div class="setting-sub">ชื่อ, รูปภาพ, แผนก</div>
        </div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item" @click="ui.showToast('ความปลอดภัย — เร็วๆ นี้ 🚀')">
        <span class="setting-ico">🔐</span>
        <div class="setting-info">
          <div class="setting-title">ความปลอดภัย</div>
          <div class="setting-sub">รหัสผ่าน, การยืนยันตัวตน</div>
        </div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item" @click="ui.showToast('เชื่อมต่อบัญชี — เร็วๆ นี้ 🚀')">
        <span class="setting-ico">🔗</span>
        <div class="setting-info">
          <div class="setting-title">เชื่อมต่อบัญชี</div>
          <div class="setting-sub">LINE, Google</div>
        </div>
        <span class="setting-arr">›</span>
      </div>
    </div>

    <!-- Notifications -->
    <div class="setting-group">
      <div class="setting-group-title">การแจ้งเตือน</div>
      <div v-for="tog in toggles" :key="tog.key" class="setting-item">
        <span class="setting-ico">{{ tog.ico }}</span>
        <div class="setting-info">
          <div class="setting-title">{{ tog.title }}</div>
          <div class="setting-sub">{{ tog.sub }}</div>
        </div>
        <div class="toggle" :class="{ on: tog.on }" @click="tog.on = !tog.on; ui.showToast('การตั้งค่าการแจ้งเตือน — เร็วๆ นี้ 🚀')"></div>
      </div>
    </div>

    <!-- Privacy -->
    <div class="setting-group">
      <div class="setting-group-title">ความเป็นส่วนตัว</div>
      <div class="setting-item">
        <span class="setting-ico">👁️</span>
        <div class="setting-info">
          <div class="setting-title">แสดงสถานะออนไลน์</div>
          <div class="setting-sub">ให้คนอื่นเห็นว่าคุณออนไลน์</div>
        </div>
        <div class="toggle on" @click="ui.showToast('การตั้งค่าความเป็นส่วนตัว — เร็วๆ นี้ 🚀')"></div>
      </div>
      <div class="setting-item">
        <span class="setting-ico">🎉</span>
        <div class="setting-info">
          <div class="setting-title">แสดงวันเกิดในปฏิทิน</div>
          <div class="setting-sub">ให้ทีมเห็นวันเกิดของคุณ</div>
        </div>
        <div class="toggle on" @click="ui.showToast('การตั้งค่าความเป็นส่วนตัว — เร็วๆ นี้ 🚀')"></div>
      </div>
    </div>

    <!-- General -->
    <div class="setting-group">
      <div class="setting-group-title">ทั่วไป</div>
      <div class="setting-item" @click="ui.showToast('การตั้งค่าภาษา — เร็วๆ นี้ 🚀')">
        <span class="setting-ico">🌏</span>
        <div class="setting-info">
          <div class="setting-title">ภาษา</div>
          <div class="setting-sub">ภาษาไทย</div>
        </div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item" @click="ui.showToast('การตั้งค่าธีม — เร็วๆ นี้ 🚀')">
        <span class="setting-ico">🎨</span>
        <div class="setting-info">
          <div class="setting-title">ธีม</div>
          <div class="setting-sub">สีม่วง (ค่าเริ่มต้น)</div>
        </div>
        <span class="setting-arr">›</span>
      </div>
      <div class="setting-item" @click="ui.showToast('DS Community Care v2.0 🚀')">
        <span class="setting-ico">ℹ️</span>
        <div class="setting-info">
          <div class="setting-title">เกี่ยวกับแอป</div>
          <div class="setting-sub">DS Community Care v2.0</div>
        </div>
        <span class="setting-arr">›</span>
      </div>
    </div>

    <!-- Logout -->
    <div class="bg-white rounded-lg border border-red-100 shadow-app-sm overflow-hidden mb-8">
      <div class="setting-item text-red-500" @click="handleLogout">
        <span class="setting-ico">🚪</span>
        <div class="setting-info">
          <div class="setting-title text-red-500">ออกจากระบบ</div>
          <div class="setting-sub">Sign out จากอุปกรณ์นี้</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui.js'
import { useUserAuthStore } from '../stores/userAuth.js'

const ui       = useUiStore()
const userAuth = useUserAuthStore()
const router   = useRouter()

const toggles = ref([
  { key:'push',    ico:'🔔', title:'Push Notification', sub:'รับแจ้งเตือนกิจกรรมทั้งหมด',          on: true  },
  { key:'bday',    ico:'🎂', title:'แจ้งเตือนวันเกิด',  sub:'แจ้งเตือนล่วงหน้า 1 วัน',               on: true  },
  { key:'empathy', ico:'💝', title:'Community Empathy', sub:'แจ้งเมื่อมีคนส่งความรู้สึกดีๆ',          on: true  },
  { key:'event',   ico:'📅', title:'กิจกรรมใหม่',       sub:'แจ้งเตือนเมื่อมีกิจกรรมใหม่',            on: false },
])

function handleLogout() {
  userAuth.logout()
  router.push('/login')
}
</script>
