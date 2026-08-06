<template>
  <div
    class="relative rounded-xl overflow-hidden shadow-app-sm cursor-pointer border border-app-border"
    @click="$emit('click', post)"
  >
    <!-- Accent bar -->
    <div class="absolute top-0 left-0 right-0 h-[3px] bg-[#BE185D] z-10"></div>

    <!-- Photo — card height follows the image's own height, nothing cropped -->
    <img
      v-if="post.recImg"
      :src="post.recImg"
      :alt="post.recName"
      class="w-full h-auto block"
      @error="(e) => e.target.style.display='none'"
    />

    <!-- Fallback: neutral tint + initials (when no image) -->
    <div v-else class="w-full h-[180px] flex items-center justify-center bg-[#FDF2F8]">
      <span class="text-[28px] font-bold text-[#BE185D]">{{ initials }}</span>
    </div>

    <!-- Stats -->
    <div class="absolute top-2 right-1.5 flex gap-1">
      <span class="emp-stat-pill">❤️ {{ post.likeCount || 0 }}</span>
      <span class="emp-stat-pill">💬 {{ post.comments?.length || 0 }}</span>
    </div>

    <!-- Name / role / message overlay -->
    <div class="absolute bottom-0 left-0 right-0 px-2 pt-8 pb-2 emp-card-scrim">
      <div class="text-[11px] font-bold text-white truncate emp-card-shadow">{{ post.recName }}</div>
      <div class="text-[9px] text-white/85 truncate emp-card-shadow">{{ post.recRole }}</div>
      <div v-if="displayText" class="text-[11px] font-semibold text-white mt-1 emp-card-text emp-card-shadow" v-html="renderMentionsHtml(displayText)"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMentionsHtml } from '../../features/empathy/mentions.js'

const props = defineProps({
  post: { type: Object, required: true }
})
defineEmits(['click'])

const initials = computed(() =>
  props.post.recName?.trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?'
)

// Strip a leading "[tag]" prefix (e.g. "[เก่งมาก ⭐] ...") for a clean preview
const displayText = computed(() => {
  const raw = props.post.text?.trim()
  if (!raw) return ''
  const m = raw.match(/^\[(.+?)\]\s*([\s\S]*)$/)
  return (m ? m[2] : raw).trim()
})
</script>

<style scoped>
.emp-stat-pill {
  background: rgba(255,255,255,0.92);
  color: #7C2D8C;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
.emp-card-scrim {
  background: linear-gradient(transparent, rgba(0,0,0,0.72));
}
.emp-card-shadow {
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}
.emp-card-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}
</style>
