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
        <!-- Events from GAS -->
        <template v-if="acts.getMonth(m.idx).length">
          <div v-for="ev in acts.getMonth(m.idx).slice(0, 2)" :key="ev.id" class="m-ev">
            {{ ev.emoji }} {{ ev.name }}
          </div>
          <div v-if="acts.getMonth(m.idx).length > 2" class="m-ev" style="opacity:0.7;">
            +{{ acts.getMonth(m.idx).length - 2 }} อื่นๆ
          </div>
        </template>
        <div v-else class="m-ev" style="opacity:0.55;">ยังไม่มีกิจกรรม</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useActivitiesStore } from '../../stores/activities.js'

defineEmits(['month-click'])

const acts = useActivitiesStore()
onMounted(() => acts.load())

const MONTHS = [
  { name: 'January',   icon: '🎆', grad: 'linear-gradient(160deg,#BFDBFE,#60A5FA)' },
  { name: 'February',  icon: '💕', grad: 'linear-gradient(160deg,#FBCFE8,#F472B6)' },
  { name: 'March',     icon: '🌸', grad: 'linear-gradient(160deg,#C7D2FE,#818CF8)' },
  { name: 'April',     icon: '🎊', grad: 'linear-gradient(160deg,#BAE6FD,#38BDF8)' },
  { name: 'May',       icon: '☀️', grad: 'linear-gradient(160deg,#FEF08A,#FBBF24)' },
  { name: 'June',      icon: '🏕️', grad: 'linear-gradient(160deg,#A7F3D0,#34D399)' },
  { name: 'July',      icon: '🌿', grad: 'linear-gradient(160deg,#6EE7B7,#10B981)' },
  { name: 'August',    icon: '💐', grad: 'linear-gradient(160deg,#DDD6FE,#A78BFA)' },
  { name: 'September', icon: '⚡', grad: 'linear-gradient(160deg,#C7D2FE,#6366F1)' },
  { name: 'October',   icon: '🎃', grad: 'linear-gradient(160deg,#FED7AA,#F97316)' },
  { name: 'November',  icon: '🍂', grad: 'linear-gradient(160deg,#FDE68A,#F59E0B)' },
  { name: 'December',  icon: '🎄', grad: 'linear-gradient(160deg,#FECACA,#F87171)' },
]

const months = computed(() => MONTHS.map((m, i) => ({ ...m, idx: i + 1 })))
const currentMonth = new Date().getMonth() + 1
</script>
