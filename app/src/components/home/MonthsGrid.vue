<template>
  <div class="months-grid">
    <div
      v-for="m in months"
      :key="m.idx"
      class="m-card ripple-host"
      :class="{ 'm-current': m.idx === currentMonth }"
      :style="{ background: m.grad }"
      @click="$emit('month-click', m.idx)"
    >
      <div class="m-body">
        <div class="m-head">
          <span class="m-icon">{{ m.icon }}</span>
          <span class="m-num">{{ String(m.idx).padStart(2, '0') }}</span>
        </div>
        <div class="m-name">{{ m.name }}</div>
        <div v-for="ev in m.events" :key="ev" class="m-ev">{{ ev }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineEmits(['month-click'])

const MONTHS = [
  { name: 'January',   icon: '🎆', grad: 'linear-gradient(160deg,#BFDBFE,#60A5FA)', events: ['🎉 New Year', '📚 ปฐมนิเทศ'] },
  { name: 'February',  icon: '💕', grad: 'linear-gradient(160deg,#FBCFE8,#F472B6)', events: ["💝 Valentine's", '🏥 Health Check'] },
  { name: 'March',     icon: '🌸', grad: 'linear-gradient(160deg,#C7D2FE,#818CF8)', events: ['🏛️ Town Hall', '📚 Workshop'] },
  { name: 'April',     icon: '🎊', grad: 'linear-gradient(160deg,#BAE6FD,#38BDF8)', events: ['💧 สงกรานต์', '🎂 Birthday'] },
  { name: 'May',       icon: '☀️', grad: 'linear-gradient(160deg,#FEF08A,#FBBF24)', events: ['💼 Labor Day', '🧘 Yoga'] },
  { name: 'June',      icon: '🏕️', grad: 'linear-gradient(160deg,#A7F3D0,#34D399)', events: ['🏕️ Outing', '👑 Leadership'] },
  { name: 'July',      icon: '🌿', grad: 'linear-gradient(160deg,#6EE7B7,#10B981)', events: ['🤝 Volunteer', '🎂 Birthday'] },
  { name: 'August',    icon: '💐', grad: 'linear-gradient(160deg,#DDD6FE,#A78BFA)', events: ['👩 วันแม่', '💻 Digital'] },
  { name: 'September', icon: '⚡', grad: 'linear-gradient(160deg,#C7D2FE,#6366F1)', events: ['🚀 Hackathon', '💊 Health Week'] },
  { name: 'October',   icon: '🎃', grad: 'linear-gradient(160deg,#FED7AA,#F97316)', events: ['🎃 Halloween', '🏮 ลอยกระทง'] },
  { name: 'November',  icon: '🍂', grad: 'linear-gradient(160deg,#FDE68A,#F59E0B)', events: ['❤️ วันพ่อ', '📋 Year-End'] },
  { name: 'December',  icon: '🎄', grad: 'linear-gradient(160deg,#FECACA,#F87171)', events: ['🎄 Christmas', '🎆 New Year'] },
]

const months = computed(() => MONTHS.map((m, i) => ({ ...m, idx: i + 1 })))
const currentMonth = new Date().getMonth() + 1
</script>
