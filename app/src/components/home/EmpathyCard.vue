<template>
  <div
    class="rounded-2xl overflow-hidden shadow-app-sm cursor-pointer border border-app-border/50"
    @click="$emit('click', post)"
  >
    <!-- Spotlight photo only -->
    <div class="emp-card-spotlight" style="margin:0; border-radius:0;">
      <img
        v-if="post.recImg"
        :src="post.recImg"
        :alt="post.recName"
        class="w-full object-contain block"
      />
      <div
        v-else
        class="w-full h-[120px] flex items-center justify-center text-[28px] font-black text-white"
        :style="{ background: fallbackGrad }"
      >{{ initials }}</div>

      <!-- Stats overlay -->
      <div class="emp-card-stats top-2 right-2">
        <span class="emp-stat-pill">❤️ {{ post.likeCount || 0 }}</span>
        <span class="emp-stat-pill">💬 {{ post.comments?.length || 0 }}</span>
      </div>

      <!-- Name overlay -->
      <div class="emp-spotlight-name p-2 pt-[40px]">
        <div class="text-[11px] font-black text-white" style="text-shadow:0 1px 8px rgba(0,0,0,0.5);">{{ post.recName }}</div>
        <div class="text-[9px] text-white/85 mt-0.5">{{ post.recRole }}</div>
      </div>
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
const fallbackGrad = computed(() => GRAD_FALLBACKS[0])
const initials = computed(() =>
  props.post.recName?.trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?'
)
</script>
