<template>
  <div class="months-grid">
    <div
      v-for="m in months"
      :key="m.idx"
      class="m-card"
      :class="{ 'm-current': m.idx === currentMonth }"
      :style="{ background: m.grad }"
      @click="$emit('month-click', m.idx)"
    >
      <div class="m-body">
        <div class="m-head">
          <div class="m-name">{{ m.name }}</div>
        </div>
        <div v-for="ev in m.events" :key="ev" class="m-ev">{{ ev }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineEmits(['month-click'])

const MONTHS = [
  { name:'January',  grad:'linear-gradient(135deg,#DBEAFE,#3B82F6)', events:['🎉 New Year Party','🌟 ปฐมนิเทศ'] },
  { name:'February', grad:'linear-gradient(135deg,#FCE7F3,#EC4899)', events:["💕 Valentine's Day",'🏥 Health Check'] },
  { name:'March',    grad:'linear-gradient(135deg,#EEF2FF,#6366F1)', events:['🏛️ Town Hall','🛠️ Skill Workshop'] },
  { name:'April',    grad:'linear-gradient(135deg,#EFF6FF,#60A5FA)', events:['💧 สงกรานต์','🎂 Birthday'] },
  { name:'May',      grad:'linear-gradient(135deg,#FEF3C7,#F59E0B)', events:['💼 Labor Day','🧘 Yoga Session'] },
  { name:'June',     grad:'linear-gradient(135deg,#D1FAE5,#10B981)', events:['🚌 Company Outing','🎤 Leadership Talk'] },
  { name:'July',     grad:'linear-gradient(135deg,#D1FAE5,#059669)', events:['🤝 Volunteer Day','🎂 Birthday'] },
  { name:'August',   grad:'linear-gradient(135deg,#EDE9FE,#8B5CF6)', events:['👩 วันแม่','💻 Digital Skills'] },
  { name:'September',grad:'linear-gradient(135deg,#E0E7FF,#6366F1)', events:['🚀 Hackathon','💊 Health Week'] },
  { name:'October',  grad:'linear-gradient(135deg,#FED7AA,#F97316)', events:['🎃 Halloween','🏮 ลอยกระทง'] },
  { name:'November', grad:'linear-gradient(135deg,#FEF3C7,#D97706)', events:['❤️ วันพ่อ','📊 Year-End Prep'] },
  { name:'December', grad:'linear-gradient(135deg,#FFE4E6,#EF4444)', events:['🎄 Christmas','🥳 New Year Party'] },
]

const months = computed(() => MONTHS.map((m, i) => ({ ...m, idx: i + 1 })))
const currentMonth = new Date().getMonth() + 1
</script>
