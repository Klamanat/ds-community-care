<template>
  <div class="tab-page star-page">

    <!-- Header -->
    <div class="text-center fade-in">
      <div class="text-[48px] mb-2" style="filter:drop-shadow(0 0 16px rgba(255,200,0,0.5));">⭐</div>
      <div class="text-[22px] font-black bg-[linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566)]
                  bg-clip-text text-transparent tracking-widest">Star Gang</div>
      <div class="text-[11px] text-app-light mt-1">พนักงานดาวเด่นประจำเดือน March 2026 🏆</div>
    </div>

    <!-- Join Star Gang Banner -->
    <div class="rounded-[20px] p-5 relative overflow-hidden"
         style="background:linear-gradient(135deg,#1A1200 0%,#3D2800 40%,#7A4F00 65%,#3D2800 85%,#1A1200 100%);">
      <div class="relative z-10 text-center">
        <div class="text-[15px] font-black tracking-[2px] mb-1
                    bg-[linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566)]
                    bg-clip-text text-transparent">✦ JOIN STAR GANG ✦</div>
        <div class="text-[11px] text-[rgba(255,210,60,0.75)] mb-3 leading-relaxed">
          พร้อมเป็นส่วนหนึ่งของทีมแล้วหรือยัง? ✨
        </div>
        <div class="inline-flex items-center gap-1.5 bg-white/10 rounded-[20px] px-4 py-1.5 mb-3">
          <span class="text-[11px] text-[rgba(255,210,60,0.9)] font-bold">สมาชิกแล้ว</span>
          <span class="text-[14px] font-black text-[#FFD700]">{{ team.joinCount }}</span>
          <span class="text-[11px] text-[rgba(255,210,60,0.9)] font-bold">/ 30 คน</span>
        </div>
        <!-- Progress bar -->
        <div class="w-full bg-white/15 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            class="h-full rounded-full bg-[linear-gradient(90deg,#FFE566,#F5C518)] transition-all duration-500"
            :style="{ width: Math.min(100,(team.joinCount/30)*100) + '%' }"
          ></div>
        </div>
        <button
          class="w-full py-3 bg-[linear-gradient(135deg,#F5C518,#C8860A)] border-none rounded-md
                 text-[14px] font-black text-[#1A1200] cursor-pointer tracking-wide"
          @click="handleJoin"
        >✦ {{ joined ? 'เข้าร่วมแล้ว ✓' : 'JOIN TEAM ✦' }}</button>
      </div>
    </div>

    <!-- Star Grid -->
    <div class="star-grid fade-in">
      <div
        v-for="s in starPlayers"
        :key="s.name"
        class="star-card ripple-host"
        @click="handleRippleClick"
      >
        <div class="star-av" :style="{ background: s.grad }">{{ s.emoji }}</div>
        <div class="star-name">{{ s.name }}</div>
        <div class="star-role">{{ s.role }}</div>
        <div class="star-pts">⭐ {{ s.pts }} pts</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTeamStore } from '../stores/team.js'
import { useUiStore } from '../stores/ui.js'
import { useRipple } from '../composables/useRipple.js'
import { useFadeIn } from '../composables/useFadeIn.js'

const team = useTeamStore()
const ui = useUiStore()
const { handleRippleClick } = useRipple()
useFadeIn()

const joined = ref(false)
const starPlayers = [
  { emoji:'🦁', name:'Somsak P.', role:'HR Manager',   pts:580, grad:'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  { emoji:'🌸', name:'Nok S.',    role:'Team Lead',     pts:510, grad:'linear-gradient(135deg,#FBCFE8,#EC4899)' },
  { emoji:'🦊', name:'Anya R.',   role:'HR Specialist', pts:480, grad:'linear-gradient(135deg,#C7D2FE,#818CF8)' },
  { emoji:'🐬', name:'Pam W.',    role:'Developer',     pts:460, grad:'linear-gradient(135deg,#BAE6FD,#38BDF8)' },
  { emoji:'🦋', name:'Tom K.',    role:'Designer',      pts:430, grad:'linear-gradient(135deg,#BBF7D0,#4ADE80)' },
  { emoji:'🐯', name:'May J.',    role:'Marketing',     pts:400, grad:'linear-gradient(135deg,#FED7AA,#F97316)' },
]

function handleJoin() {
  if (joined.value) return
  joined.value = true
  team.joinCount++
  ui.showToast('ยินดีต้อนรับสู่ Star Gang! ⭐')
}
</script>
