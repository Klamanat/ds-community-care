<template>
  <div class="bday-banner-card ripple-host" @click="onClick">
    <div class="bbc-bg">
      <!-- decorative dots -->
      <div class="bbc-dot" style="width:80px;height:80px;background:#FF3CAC;top:-20px;right:60px;"></div>
      <div class="bbc-dot" style="width:50px;height:50px;background:#C84B9E;bottom:-15px;left:40px;"></div>

      <div class="bbc-left">
        <div class="bbc-label">{{ label }}</div>
        <div class="bbc-sub">{{ sub }}</div>
      </div>

      <div class="bbc-photos">
        <img
          v-for="(p, i) in photos"
          :key="i"
          class="bbc-photo"
          :src="p.src || ''"
          :style="p.src ? '' : `background:${p.bg};`"
          @error="(e) => e.target.style.display='none'"
        />
        <div
          v-for="(p, i) in placeholders"
          :key="'p'+i"
          class="bbc-photo"
          :style="`background:${p.bg};display:flex;align-items:center;justify-content:center;font-size:16px;`"
        >{{ p.emoji }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'

defineProps({
  label: { type: String, default: '🎂 Birthday Celebration' },
  sub: { type: String, default: 'เดือนนี้มีใครเกิดบ้าง? 🎉' },
  photos: { type: Array, default: () => [] },
  placeholders: { type: Array, default: () => [
    { bg: 'linear-gradient(135deg,#C7D2FE,#818CF8)', emoji: '😄' },
    { bg: 'linear-gradient(135deg,#FBCFE8,#F472B6)', emoji: '🌟' },
    { bg: 'linear-gradient(135deg,#BBF7D0,#4ADE80)', emoji: '🦊' },
  ] }
})

const ui = useUiStore()
function onClick() { ui.openModal('modal-bday') }
</script>
