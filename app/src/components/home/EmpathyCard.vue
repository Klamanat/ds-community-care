<template>
  <div class="emp-item" :style="cardStyle" @click="$emit('click', post)">
    <!-- Tag header -->
    <div class="emp-card-hdr" :style="hdrStyle">
      <span class="emp-tag">{{ post.tag }}</span>
      <span class="emp-stat">{{ post.react }}</span>
    </div>

    <!-- Spotlight photo -->
    <div class="emp-card-spotlight">
      <img v-if="post.recImg" :src="post.recImg" :alt="post.recName" />
      <div v-else class="emp-av-board" :style="{ background: fallbackGrad }">
        <span style="display:flex;align-items:center;justify-content:center;height:100%;font-size:32px;font-weight:900;color:white;">{{ initials }}</span>
      </div>

      <!-- Stats overlay -->
      <div class="emp-card-stats">
        <span class="emp-stat-pill">{{ post.react }}</span>
        <span class="emp-stat-pill">💬 {{ post.comments?.length || 0 }}</span>
      </div>

      <!-- Name overlay -->
      <div class="emp-spotlight-name">
        <div style="font-size:13px;font-weight:900;color:white;text-shadow:0 1px 8px rgba(0,0,0,0.5);">{{ post.recName }}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.85);margin-top:1px;">{{ post.recRole }}</div>
      </div>
    </div>

    <!-- Message -->
    <div class="emp-card-msg">
      <div class="emp-card-quote">"</div>
      {{ post.msg }}
    </div>

    <!-- Footer -->
    <div class="emp-card-footer">
      <div class="emp-av emp-av-xs emp-sender-av">
        <img v-if="post.sndImg" :src="post.sndImg" />
        <span v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#7C2D8C;">{{ post.sndName?.[0] }}</span>
      </div>
      <span style="font-size:10px;color:#C084C0;font-weight:600;flex:1;">{{ post.sndName }}</span>
      <span style="font-size:10px;color:#C084C0;">{{ post.time }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  post: { type: Object, required: true }
})
defineEmits(['click'])

const TAG_GRADS = {
  'เก่งมาก ⭐': { bg:'linear-gradient(170deg,#FF8DC7,#EC4899,#BE185D)', hdr:'linear-gradient(135deg,#FFF0FB,#FCE7F3)' },
  'ขอบคุณ 🙏':  { bg:'linear-gradient(170deg,#C4B5FD,#7C3AED,#4C1D95)', hdr:'linear-gradient(135deg,#F5F3FF,#EDE9FE)' },
  'สู้ๆ 💪':    { bg:'linear-gradient(170deg,#F472B6,#C026D3,#6D28D9)', hdr:'linear-gradient(135deg,#FDF4FF,#F3E8FF)' },
}

const GRAD_FALLBACKS = [
  'linear-gradient(135deg,#FBCFE8,#EC4899)',
  'linear-gradient(135deg,#DDD6FE,#7C3AED)',
  'linear-gradient(135deg,#BAE6FD,#38BDF8)',
]

const tagInfo = computed(() => TAG_GRADS[props.post.tag] || { bg:'linear-gradient(135deg,#FBCFE8,#F9A8D4)', hdr:'linear-gradient(135deg,#FFF5FB,#F5F0FF)' })
const cardStyle = computed(() => ({ background: tagInfo.value.hdr }))
const hdrStyle = computed(() => ({ background: tagInfo.value.hdr }))
const fallbackGrad = computed(() => GRAD_FALLBACKS[0])
const initials = computed(() => {
  return props.post.recName?.trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?'
})
</script>
