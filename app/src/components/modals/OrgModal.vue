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
            class="w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center text-[24px]"
            :style="{ background: team.getSgFallback(i) }"
          >{{ emojis[i % emojis.length] }}</div>
          <div class="star-name">{{ m.name }}</div>
          <div class="star-role">{{ m.role }}</div>
        </div>
        <div v-if="!team.sgMembers.length" class="col-span-3 text-center py-5 text-[13px] text-[rgba(150,120,60,0.6)]">
          ยังไม่มีสมาชิก ✦ เชิญเพื่อนมาร่วมกัน!
        </div>
      </div>
      <button
        class="w-full mt-4 py-3 bg-[linear-gradient(135deg,#F5C518,#C8860A)] border-none rounded-md
               text-[13px] font-extrabold text-[#1A1200] cursor-pointer"
        @click="addSgMember"
      >✦ เพิ่มสมาชิก</button>
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
import BaseModal from '../shared/BaseModal.vue'
import { useTeamStore } from '../../stores/team.js'
import { useUiStore } from '../../stores/ui.js'

const team = useTeamStore()
const ui = useUiStore()
const emojis = ['⭐','🌟','✨','💫','🌠','🏆','🦁','🌸','🦊','🐬','🦋','🐯']

function addSgMember() {
  const name = prompt('ชื่อสมาชิก Star Gang:')
  if (!name) return
  const role = prompt('ตำแหน่ง:') || 'DS Team'
  team.joinStarGang({ name: name.trim(), role })
}
</script>
