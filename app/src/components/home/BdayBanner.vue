<template>
  <div
    class="ripple-host"
    style="position:relative;overflow:hidden;border-radius:16px;cursor:pointer;background:linear-gradient(160deg,#FF6BC8 0%,#A855F7 45%,#3B82F6 100%);"
    @click="onClick"
  >
    <!-- Background image -->
    <img
      src="/images/bday-header.jpg"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%;"
    />
    <!-- Overlay -->
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(20,0,50,0.15) 0%,rgba(10,0,40,0.55) 100%);"></div>

    <!-- Content -->
    <div style="position:relative;z-index:2;padding:14px 16px 12px;">
      <!-- Title row -->
      <div style="font-size:16px;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.5);letter-spacing:0.3px;">
        🎂 Birthday Celebration 🎊
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.88);margin-top:2px;text-shadow:0 1px 4px rgba(0,0,0,0.4);letter-spacing:0.5px;">
        ✨ ฉลองวันเกิดพนักงานรายเดือน ✨
      </div>

      <!-- Bottom row: name/sub + photos -->
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:12px;">
        <div>
          <div v-if="name" style="font-size:13px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.4);">{{ name }}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.75);margin-top:1px;text-shadow:0 1px 3px rgba(0,0,0,0.35);">{{ sub }}</div>
        </div>

        <!-- Avatar stack -->
        <div class="bbc-photos" style="margin-top:0;">
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
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'

defineProps({
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
