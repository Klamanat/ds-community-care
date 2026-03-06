<template>
  <div class="bday-banner-card ripple-host" @click="onClick">
    <!-- decorative circles -->
    <div class="absolute w-20 h-20 rounded-full opacity-10 bg-[#FF3CAC] -top-5 right-[60px]"></div>
    <div class="absolute w-[50px] h-[50px] rounded-full opacity-10 bg-[#C84B9E] -bottom-4 left-10"></div>

    <div class="bbc-left">
      <div class="bbc-label">{{ label }}</div>
      <div class="text-[15px] font-black text-white leading-tight mt-1">{{ name }}</div>
      <div class="bbc-sub">{{ sub }}</div>
      <div class="bbc-photos">
        <img
          v-for="(p, i) in photos"
          :key="i"
          class="bbc-photo object-cover"
          :src="p.src || ''"
          :style="p.src ? '' : `background:${p.bg};`"
          @error="(e) => e.target.style.display='none'"
        />
        <div
          v-for="(p, i) in placeholders"
          :key="'p'+i"
          class="bbc-photo flex items-center justify-center text-[16px]"
          :style="`background:${p.bg};`"
        >{{ p.emoji }}</div>
      </div>
    </div>

    <div class="relative z-10 px-4 text-[48px]">🎂</div>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'

defineProps({
  label: { type: String, default: '🎂 Birthday Celebration' },
  name:  { type: String, default: '' },
  sub:   { type: String, default: 'เดือนนี้มีใครเกิดบ้าง? 🎉' },
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
