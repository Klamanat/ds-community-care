<template>
  <BaseModal modal-id="modal-org">
    <!-- Star Gang Header -->
    <div class="px-5 pt-5 pb-4 rounded-t-2xl flex-shrink-0 relative overflow-hidden"
         style="background:linear-gradient(135deg,#1A1200 0%,#3D2800 35%,#7A4F00 60%,#3D2800 80%,#1A1200 100%);">
      <div class="modal-handle" style="background:rgba(255,210,60,0.4);"></div>
      <div class="text-center relative z-10">
        <div class="text-[48px] mb-2" style="filter:drop-shadow(0 0 14px rgba(245,197,24,0.9));">⭐</div>
        <div class="text-[22px] font-black tracking-[3px] mb-1.5
                    bg-[linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566,#FFF5C0)]
                    bg-clip-text text-transparent">STAR GANG</div>
        <div class="text-[11px] text-[rgba(255,210,60,0.8)] font-semibold leading-relaxed px-2">
          Star gang ไม่ได้สร้างได้ในวันเดียว<br>แต่สร้างได้ถ้ามี 'เธอ' มาอยู่ร่วมทีม!
        </div>
      </div>
    </div>

    <div class="overflow-y-auto px-5 py-4">
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="(m, i) in team.sgMembers"
          :key="m.id || i"
          class="star-card"
        >
          <div
            class="w-11 h-11 rounded-full mx-auto mb-2 overflow-hidden flex items-center justify-center text-[24px]"
            :style="{ background: team.getSgFallback(i) }"
          >
            <img v-if="m.imgUrl" :src="m.imgUrl" class="w-full h-full object-cover" @error="e => e.target.style.display='none'" />
            <span v-else>{{ emojis[i % emojis.length] }}</span>
          </div>
          <div class="star-name">{{ m.name }}</div>
          <div class="star-role">{{ m.starGangRole || m.role }}</div>
          <div v-if="m.starGangSlogan" class="text-[10px] text-[rgba(255,210,60,0.65)] mt-0.5 leading-tight px-1 text-center italic">"{{ m.starGangSlogan }}"</div>
        </div>
        <div v-if="!team.sgMembers.length" class="col-span-3 text-center py-5 text-[13px] text-[rgba(150,120,60,0.6)]">
          ยังไม่มีสมาชิก ✦ เชิญเพื่อนมาร่วมกัน!
        </div>
      </div>
      <button
        class="w-full mt-4 py-3 border-none rounded-md text-[13px] font-extrabold transition-opacity"
        :class="joined
          ? 'bg-white/10 text-[rgba(255,210,60,0.7)] cursor-default'
          : 'bg-[linear-gradient(135deg,#F5C518,#C8860A)] text-[#1A1200] cursor-pointer'"
        :disabled="joined || joining"
        @click="handleJoin"
      >
        <span v-if="joining">⏳ กำลังเข้าร่วม...</span>
        <span v-else-if="joined">✓ เป็นสมาชิก Star Gang แล้ว</span>
        <span v-else>✦ JOIN STAR GANG</span>
      </button>
    </div>

    <div class="px-5 pb-5">
      <button
        class="modal-close-btn"
        style="background:linear-gradient(135deg,#1A1200,#3D2800);color:#FFD700;border:1px solid #C8860A;"
        @click="ui.closeModal()"
      >ปิด</button>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useTeamStore } from '../../stores/team.js'
import { useUiStore } from '../../stores/ui.js'
import { useUserAuthStore } from '../../stores/userAuth.js'

const team = useTeamStore()
const ui = useUiStore()
const userAuth = useUserAuthStore()
const emojis = ['⭐','🌟','✨','💫','🌠','🏆','🦁','🌸','🦊','🐬','🦋','🐯']
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
