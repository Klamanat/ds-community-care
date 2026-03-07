<template>
  <BaseModal modal-id="modal-month" sheet-class="modal-sheet--full">
    <!-- Hero header -->
    <div class="month-hero" :style="{ background: meta.grad }">
      <div class="month-hero-inner">
        <div class="month-icon-wrap">
          <span class="month-icon-txt">{{ meta.icon }}</span>
        </div>
        <div class="month-hero-title">{{ meta.title }}</div>
        <div class="month-pills">
          <span v-for="ev in events" :key="ev.id" class="month-pill">
            {{ ev.emoji }} {{ ev.name }}
          </span>
          <span v-if="!events.length" class="month-pill">ยังไม่มีกิจกรรม</span>
        </div>
      </div>
      <button class="month-close-btn" @click="ui.closeModal()">✕</button>
    </div>

    <!-- Events list -->
    <div class="month-events-list">
      <!-- Loading -->
      <div v-if="acts.isLoading" class="month-empty">
        <div class="month-empty-icon">⏳</div>
        <div class="month-empty-title">กำลังโหลด...</div>
      </div>

      <!-- Empty -->
      <div v-else-if="!events.length" class="month-empty">
        <div class="month-empty-icon">📭</div>
        <div class="month-empty-title">ยังไม่มีกิจกรรมเดือนนี้</div>
        <div class="month-empty-sub">ติดตามกิจกรรมใหม่ๆ ได้เร็วๆ นี้ค่ะ ✨</div>
      </div>

      <!-- Event cards -->
      <div v-else class="month-events-grid">
        <div v-for="ev in events" :key="ev.id" class="month-ev-card">
          <img v-if="ev.imgUrl" :src="ev.imgUrl" class="month-ev-img" />
          <div v-else class="month-ev-banner" :style="{ background: 'linear-gradient(145deg,#E0E7FF,#6366F1)' }">
            <div class="month-ev-emoji">{{ ev.emoji || '🎉' }}</div>
            <div class="month-ev-name-hero">{{ ev.name }}</div>
          </div>
          <div class="month-ev-body">
            <div class="month-ev-title">{{ ev.name }}</div>
            <div class="month-ev-meta">
              <span>📅 {{ ev.date }}</span>
              <span v-if="ev.loc">📍 {{ ev.loc }}</span>
            </div>
            <div v-if="ev.desc" class="month-ev-desc">{{ ev.desc }}</div>
            <div class="month-ev-actions">
              <a v-if="ev.joinUrl" :href="ev.joinUrl" target="_blank" rel="noopener" class="month-ev-join">
                ✅ Join กิจกรรม
              </a>
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
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'
import { useActivitiesStore } from '../../stores/activities.js'

const ui   = useUiStore()
const acts = useActivitiesStore()
const joined = ref({})

const MONTH_META = [
  { title: 'January 🎆',   icon: '🎆', grad: 'linear-gradient(135deg,#BFDBFE,#3B82F6)' },
  { title: 'February 💕',  icon: '💕', grad: 'linear-gradient(135deg,#FBCFE8,#EC4899)' },
  { title: 'March 🌸',     icon: '🌸', grad: 'linear-gradient(135deg,#C7D2FE,#818CF8)' },
  { title: 'April 🎊',     icon: '🎊', grad: 'linear-gradient(135deg,#BAE6FD,#38BDF8)' },
  { title: 'May ☀️',       icon: '☀️', grad: 'linear-gradient(135deg,#FEF08A,#FBBF24)' },
  { title: 'June 🏕️',     icon: '🏕️', grad: 'linear-gradient(135deg,#A7F3D0,#34D399)' },
  { title: 'July 🌿',      icon: '🌿', grad: 'linear-gradient(135deg,#6EE7B7,#10B981)' },
  { title: 'August 💐',    icon: '💐', grad: 'linear-gradient(135deg,#DDD6FE,#A78BFA)' },
  { title: 'September ⚡', icon: '⚡', grad: 'linear-gradient(135deg,#C7D2FE,#6366F1)' },
  { title: 'October 🎃',   icon: '🎃', grad: 'linear-gradient(135deg,#FED7AA,#F97316)' },
  { title: 'November 🍂',  icon: '🍂', grad: 'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  { title: 'December 🎄',  icon: '🎄', grad: 'linear-gradient(135deg,#FECACA,#F87171)' },
]

const meta   = computed(() => MONTH_META[(ui.selectedMonthIdx ?? 1) - 1] ?? MONTH_META[0])
const events = computed(() => acts.getMonth(ui.selectedMonthIdx ?? 1))

function toggleJoin(evId) {
  joined.value[evId] = !joined.value[evId]
  if (joined.value[evId]) ui.showToast('เข้าร่วมกิจกรรมแล้ว 🎉')
}
</script>
