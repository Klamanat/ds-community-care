<template>
  <BaseModal modal-id="modal-org">
    <!-- Star Gang Header -->
    <div id="sg-header" style="background:linear-gradient(135deg,#1A1200 0%,#3D2800 35%,#7A4F00 60%,#3D2800 80%,#1A1200 100%);padding:22px 20px 18px;position:relative;overflow:hidden;border-radius:28px 28px 0 0;flex-shrink:0;">
      <div class="modal-handle" style="background:rgba(255,210,60,0.4);margin-bottom:14px;"></div>
      <div style="text-align:center;position:relative;z-index:1;">
        <div style="font-size:48px;margin-bottom:8px;filter:drop-shadow(0 0 14px rgba(245,197,24,0.9));">⭐</div>
        <div style="font-size:22px;font-weight:900;letter-spacing:3px;background:linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566,#FFF5C0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:6px;">STAR GANG</div>
        <div style="font-size:11px;color:rgba(255,210,60,0.8);font-weight:600;line-height:1.6;padding:0 10px;">Star gang ไม่ได้สร้างได้ในวันเดียว<br>แต่สร้างได้ถ้ามี 'เธอ' มาอยู่ร่วมทีม!</div>
      </div>
    </div>

    <div style="overflow-y:auto;padding:16px 20px 8px;">
      <div id="sg-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <div
          v-for="(m, i) in team.sgMembers"
          :key="m.id || i"
          style="background:white;border-radius:14px;padding:12px;text-align:center;box-shadow:0 2px 10px rgba(245,197,24,0.15);border:1px solid rgba(245,197,24,0.2);"
        >
          <div style="width:44px;height:44px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:24px;" :style="{ background: team.getSgFallback(i) }">{{ emojis[i % emojis.length] }}</div>
          <div style="font-size:11px;font-weight:800;color:#1A1200;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.name }}</div>
          <div style="font-size:9px;color:#92400E;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.role }}</div>
        </div>
        <div v-if="!team.sgMembers.length" style="grid-column:1/-1;text-align:center;padding:20px;color:rgba(150,120,60,0.6);font-size:13px;">
          ยังไม่มีสมาชิก ✦ เชิญเพื่อนมาร่วมกัน!
        </div>
      </div>
      <button @click="addSgMember" style="width:100%;margin-top:14px;padding:11px;background:linear-gradient(135deg,#F5C518,#C8860A);border:none;border-radius:14px;font-family:'Sarabun',sans-serif;font-size:13px;font-weight:800;color:#1A1200;cursor:pointer;">✦ เพิ่มสมาชิก</button>
    </div>
    <div style="padding:8px 20px 20px;">
      <button class="modal-close-btn" @click="ui.closeModal()" style="background:linear-gradient(135deg,#1A1200,#3D2800);color:#FFD700;font-weight:800;border:1px solid #C8860A;">ปิด</button>
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
