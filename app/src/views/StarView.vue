<template>
  <div class="star-page">
    <div class="star-header fade-in">
      <div style="font-size:48px;margin-bottom:8px;">⭐</div>
      <div class="star-title">Star Gang</div>
      <div class="star-sub">พนักงานดาวเด่นประจำเดือน March 2026 🏆</div>
    </div>

    <!-- Join Star Gang Banner -->
    <div style="margin:0 0 16px;">
      <div style="background:linear-gradient(135deg,#1A1200 0%,#3D2800 40%,#7A4F00 65%,#3D2800 85%,#1A1200 100%);border-radius:20px;padding:20px;position:relative;overflow:hidden;">
        <div style="position:relative;z-index:1;text-align:center;">
          <div style="font-size:15px;font-weight:900;letter-spacing:2px;background:linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;">✦ JOIN STAR GANG ✦</div>
          <div style="font-size:11px;color:rgba(255,210,60,0.75);margin-bottom:12px;line-height:1.6;">พร้อมเป็นส่วนหนึ่งของทีมแล้วหรือยัง? ✨</div>
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border-radius:20px;padding:5px 14px;margin-bottom:12px;">
            <span style="font-size:11px;color:rgba(255,210,60,0.9);font-weight:700;">สมาชิกแล้ว</span>
            <span style="font-size:14px;font-weight:900;color:#FFD700;">{{ team.joinCount }}</span>
            <span style="font-size:11px;color:rgba(255,210,60,0.9);font-weight:700;">/ 30 คน</span>
          </div>
          <div style="width:100%;background:rgba(255,255,255,0.15);border-radius:20px;height:6px;margin-bottom:14px;overflow:hidden;">
            <div :style="`height:100%;background:linear-gradient(90deg,#FFE566,#F5C518);border-radius:20px;transition:width 0.5s;width:${Math.min(100,(team.joinCount/30)*100)}%`"></div>
          </div>
          <button
            style="width:100%;padding:12px;background:linear-gradient(135deg,#F5C518,#C8860A);border:none;border-radius:14px;font-size:14px;font-weight:900;color:#1A1200;cursor:pointer;letter-spacing:1px;"
            @click="handleJoin"
          >✦ {{ joined ? 'เข้าร่วมแล้ว ✓' : 'JOIN TEAM ✦' }}</button>
        </div>
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
        <div class="star-av">{{ s.emoji }}</div>
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
  { emoji:'🦁', name:'Somsak P.', role:'HR Manager',     pts:580 },
  { emoji:'🌸', name:'Nok S.',    role:'Team Lead',       pts:510 },
  { emoji:'🦊', name:'Anya R.',   role:'HR Specialist',   pts:480 },
  { emoji:'🐬', name:'Pam W.',    role:'Developer',       pts:460 },
  { emoji:'🦋', name:'Tom K.',    role:'Designer',        pts:430 },
  { emoji:'🐯', name:'May J.',    role:'Marketing',       pts:400 },
]

function handleJoin() {
  if (joined.value) return
  joined.value = true
  team.joinCount++
  ui.showToast('ยินดีต้อนรับสู่ Star Gang! ⭐')
}
</script>
