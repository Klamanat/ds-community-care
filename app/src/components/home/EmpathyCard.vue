<template>
  <div
    class="rounded-2xl overflow-hidden shadow-app-sm cursor-pointer border border-app-border/50"
    :style="{ background: tagInfo.hdr }"
    @click="$emit('click', post)"
  >
    <!-- Tag header -->
    <div class="emp-card-hdr">
      <span class="emp-tag text-white font-bold rounded-full px-3 py-1"
            :style="{ background: tagInfo.bg }">{{ post.tag }}</span>
    </div>

    <!-- Spotlight photo -->
    <div class="emp-card-spotlight">
      <img
        v-if="post.recImg"
        :src="post.recImg"
        :alt="post.recName"
        class="w-full h-[200px] object-cover block"
      />
      <div
        v-else
        class="w-full h-[200px] flex items-center justify-center text-[32px] font-black text-white"
        :style="{ background: fallbackGrad }"
      >{{ initials }}</div>

      <!-- Stats overlay -->
      <div class="emp-card-stats top-3 right-3">
        <span class="emp-stat-pill">{{ post.react }}</span>
        <span class="emp-stat-pill">💬 {{ post.comments?.length || 0 }}</span>
      </div>

      <!-- Name overlay -->
      <div class="emp-spotlight-name p-3 pt-[50px]">
        <div class="text-[13px] font-black text-white" style="text-shadow:0 1px 8px rgba(0,0,0,0.5);">{{ post.recName }}</div>
        <div class="text-[10px] text-white/85 mt-0.5">{{ post.recRole }}</div>
      </div>
    </div>

    <!-- Message -->
    <div class="emp-card-msg">
      <span class="text-[20px] text-pink/40 font-black leading-none mr-1">"</span>{{ post.msg }}
    </div>

    <!-- Footer -->
    <div class="emp-card-footer">
      <div class="flex items-center gap-2 flex-1 px-3 py-2.5">
        <div class="w-6 h-6 rounded-full bg-[linear-gradient(135deg,#FBCFE8,#EC4899)]
                    flex items-center justify-center text-[9px] font-extrabold text-[#7C2D8C]">
          {{ post.sndName?.[0] }}
        </div>
        <span class="text-[11px] text-[#C084C0] font-semibold flex-1 truncate">{{ post.sndName }}</span>
        <span class="text-[10px] text-[#C084C0]">{{ post.time }}</span>
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
