<template>
  <BaseModal modal-id="modal-month" sheet-class="modal-sheet--full">
    <!-- Hero header -->
    <div class="month-hero" :style="{ background: month.grad }">
      <div class="month-hero-inner">
        <div class="month-icon-wrap">
          <span class="month-icon-txt">{{ month.icon }}</span>
        </div>
        <div class="month-hero-title">{{ month.title }}</div>
        <div class="month-pills">
          <span v-for="ev in month.events" :key="ev.id" class="month-pill">
            {{ ev.emoji }} {{ ev.name }}
          </span>
          <span v-if="!month.events.length" class="month-pill">ยังไม่มีกิจกรรม</span>
        </div>
      </div>
      <button class="month-close-btn" @click="ui.closeModal()">✕</button>
    </div>

    <!-- Events list -->
    <div class="month-events-list">
      <!-- Empty state -->
      <div v-if="!month.events.length" class="month-empty">
        <div class="month-empty-icon">📭</div>
        <div class="month-empty-title">ยังไม่มีกิจกรรมเดือนนี้</div>
        <div class="month-empty-sub">ติดตามกิจกรรมใหม่ๆ ได้เร็วๆ นี้ค่ะ ✨</div>
      </div>

      <!-- Event cards grid -->
      <div v-else class="month-events-grid">
      <div v-for="ev in month.events" :key="ev.id" class="month-ev-card">
        <img v-if="ev.img" :src="ev.img" class="month-ev-img" />
        <div v-else class="month-ev-banner" :style="{ background: ev.bg }">
          <div class="month-ev-emoji">{{ ev.emoji }}</div>
          <div class="month-ev-name-hero">{{ ev.name }}</div>
        </div>
        <div class="month-ev-body">
          <div class="month-ev-title">{{ ev.name }}</div>
          <div class="month-ev-meta">
            <span>📅 {{ ev.date }}</span>
            <span>📍 {{ ev.loc }}</span>
          </div>
          <div class="month-ev-desc">{{ ev.desc }}</div>
          <div class="month-ev-actions">
            <button class="month-ev-detail" @click="ui.showToast('เปิดดูรายละเอียดแล้ว 📋')">📋 รายละเอียด</button>
            <a v-if="ev.joinUrl" :href="ev.joinUrl" target="_blank" rel="noopener" class="month-ev-join">✅ Join กิจกรรม</a>
            <button
              v-else
              class="month-ev-join"
              :class="{ 'month-ev-join--joined': joined[ev.id] }"
              @click="toggleJoin(ev.id)"
            >
              {{ joined[ev.id] ? '✅ Joined แล้ว!' : '✅ Join กิจกรรม' }}
            </button>
          </div>
        </div>
      </div>
      </div><!-- end month-events-grid -->
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()
const joined = ref({})

const MONTH_DATA = [
  {
    title: 'January 🎆', icon: '🎆', grad: 'linear-gradient(135deg,#BFDBFE,#3B82F6)',
    events: [
      { id: '1a', emoji: '🎉', bg: 'linear-gradient(145deg,#DBEAFE,#60A5FA)', img: '/images/event-bimeet.jpg', name: 'BI-Monthly Meeting', date: '5 ม.ค. 2568', loc: 'Event Hall ชั้น 10', desc: 'ปาร์ตี้ฉลองปีใหม่พร้อมกัน เล่นเกม ลุ้นรางวัลและรับอาหารดินเนอร์' },
      { id: '1b', emoji: '📚', bg: 'linear-gradient(145deg,#E0E7FF,#6366F1)', name: 'ไหว้พระพรหม', date: '10 ม.ค. 2568', loc: 'ห้องประชุม A ชั้น 5', desc: 'ต้อนรับสมาชิกใหม่ของทีม DS พร้อม Buddy Program' }
    ]
  },
  {
    title: 'February 💕', icon: '💕', grad: 'linear-gradient(135deg,#FBCFE8,#EC4899)',
    events: [
      { id: '2a', emoji: '💝', bg: 'linear-gradient(145deg,#FCE7F3,#F472B6)', img: '/images/event-cupid.jpg', name: 'DS Secret Cupid Bot', date: 'วันนี้ – 16 ก.พ. 69', loc: 'สแกน QR Code เข้า Padlet', desc: 'ภารกิจสายลับจับหัวใจ', joinUrl: 'https://padlet.com/somnisa1993/ds-secret-cupid-bot-2026-qj6c8mx1uic4zm1c' },
      { id: '2b', emoji: '🎡', bg: 'linear-gradient(145deg,#FEE2E2,#EF4444)', img: '/images/event-angpao.jpg', name: 'Digital Angpao Hunt', date: '17 ก.พ. 69 (09:00–18:00)', loc: 'ลิงก์ออนไลน์', desc: 'หมุนปีบ รับทรัพย์!', joinUrl: 'https://lucky-draw-azure-eta.vercel.app' }
    ]
  },
  { title: 'March 🌸',     icon: '🌸', grad: 'linear-gradient(135deg,#C7D2FE,#818CF8)',  events: [] },
  { title: 'April 🎊',     icon: '🎊', grad: 'linear-gradient(135deg,#BAE6FD,#38BDF8)',  events: [] },
  { title: 'May ☀️',       icon: '☀️', grad: 'linear-gradient(135deg,#FEF08A,#FBBF24)',  events: [] },
  { title: 'June 🏕️',     icon: '🏕️', grad: 'linear-gradient(135deg,#A7F3D0,#34D399)',  events: [] },
  { title: 'July 🌿',      icon: '🌿', grad: 'linear-gradient(135deg,#6EE7B7,#10B981)',  events: [] },
  { title: 'August 💐',    icon: '💐', grad: 'linear-gradient(135deg,#DDD6FE,#A78BFA)',  events: [] },
  { title: 'September ⚡', icon: '⚡', grad: 'linear-gradient(135deg,#C7D2FE,#6366F1)',  events: [] },
  { title: 'October 🎃',   icon: '🎃', grad: 'linear-gradient(135deg,#FED7AA,#F97316)',  events: [] },
  { title: 'November 🍂',  icon: '🍂', grad: 'linear-gradient(135deg,#FDE68A,#F59E0B)',  events: [] },
  { title: 'December 🎄',  icon: '🎄', grad: 'linear-gradient(135deg,#FECACA,#F87171)',  events: [] },
]

const month = computed(() => MONTH_DATA[(ui.selectedMonthIdx ?? 1) - 1] ?? MONTH_DATA[0])

function toggleJoin(evId) {
  joined.value[evId] = !joined.value[evId]
  if (joined.value[evId]) ui.showToast('เข้าร่วมกิจกรรมแล้ว 🎉')
}
</script>
