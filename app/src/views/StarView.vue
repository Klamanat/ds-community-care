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
          class="w-full py-3 border-none rounded-md text-[14px] font-black tracking-wide transition-opacity"
          :class="joined
            ? 'bg-white/20 text-[rgba(255,210,60,0.8)] cursor-default'
            : 'bg-[linear-gradient(135deg,#F5C518,#C8860A)] text-[#1A1200] cursor-pointer'"
          :disabled="joined || joining"
          @click="handleJoin"
        >
          <span v-if="joining">⏳ กำลังเข้าร่วม...</span>
          <span v-else-if="joined">✓ เป็นสมาชิก Star Gang แล้ว</span>
          <span v-else>✦ JOIN TEAM ✦</span>
        </button>
      </div>
    </div>

    <!-- Star Grid -->
    <div v-if="team.isLoading" class="text-center py-8 text-[13px]" style="color:#9CA3AF;">กำลังโหลด...</div>
    <div v-else-if="team.sgMembers.length === 0" class="text-center py-8 text-[13px]" style="color:#9CA3AF;">
      ยังไม่มีสมาชิก Star Gang
    </div>
    <div v-else class="star-grid fade-in">
      <div
        v-for="(s, idx) in team.sgMembers"
        :key="s.id || s.name"
        class="star-card ripple-host"
        @click="ui.showToast('Star Gang Profile — เร็วๆ นี้ 🚀')"
      >
        <div class="star-av" :style="{ background: team.getGrad(idx), overflow: 'hidden' }">
          <img v-if="s.imgUrl" :src="s.imgUrl" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" @error="e => e.target.style.display='none'" />
          <span v-else>{{ EMOJIS[idx % EMOJIS.length] }}</span>
        </div>
        <div class="star-name">{{ s.name }}</div>
        <div class="star-role">{{ s.starGangRole || s.role }}</div>
        <div v-if="s.starGangSlogan" class="text-[10px] text-[rgba(255,210,60,0.65)] mt-0.5 leading-tight px-1 text-center italic">"{{ s.starGangSlogan }}"</div>
        <div v-if="s.pts" class="star-pts">⭐ {{ s.pts }} pts</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTeamStore } from '../stores/team.js'
import { useUiStore } from '../stores/ui.js'
import { useUserAuthStore } from '../stores/userAuth.js'
import { useFadeIn } from '../composables/useFadeIn.js'

const team = useTeamStore()
const ui = useUiStore()
const userAuth = useUserAuthStore()
useFadeIn()

const EMOJIS = ['🦁','🌸','🦊','🐬','🦋','🐯','⭐','🌟','🦄','😎','🐺','✨']

const joining = ref(false)

const joined = computed(() => {
  const name = userAuth.userName
  if (!name) return false
  return team.sgMembers.some(m =>
    (m.name || '').trim().toLowerCase() === name.trim().toLowerCase()
  )
})

onMounted(() => team.loadStarGang())

async function handleJoin() {
  if (joined.value || joining.value) return
  if (!userAuth.userName) { ui.showToast('กรุณาเข้าสู่ระบบก่อน'); return }
  joining.value = true
  try {
    await team.joinStarGang({ id: userAuth.userId, name: userAuth.userName, role: userAuth.userRole })
    ui.showToast('ยินดีต้อนรับสู่ Star Gang! ⭐')
  } finally {
    joining.value = false
  }
}
</script>
