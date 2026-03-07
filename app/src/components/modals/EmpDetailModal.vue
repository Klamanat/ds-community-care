<template>
  <BaseModal modal-id="modal-emp-detail">
    <div v-if="post" class="flex flex-col flex-1 min-h-0">
      <div class="modal-handle flex-shrink-0"></div>

      <!-- Scrollable: banner + message + comments -->
      <div class="flex-1 overflow-y-auto min-h-0">

        <!-- Banner -->
        <div :style="{ background: bannerGrad }" class="relative">
          <img
            v-if="post.recImg"
            :src="post.recImg"
            class="w-full block"
            @error="(e) => e.target.style.display='none'"
          />
          <div
            v-else
            class="w-full h-[200px] flex items-center justify-center text-[64px]"
          >{{ initials }}</div>

          <div class="emp-card-stats top-3 right-3">
            <span class="emp-stat-pill">{{ post.react }}</span>
            <span class="emp-stat-pill">💬 {{ post.comments.length }}</span>
          </div>

          <div class="emp-spotlight-name px-4 pt-[50px] pb-4">
            <div class="text-[18px] font-black text-white" style="text-shadow:0 2px 10px rgba(0,0,0,0.6);">{{ post.recName }}</div>
            <div class="text-[12px] text-white/88 mt-0.5">{{ post.recRole }}</div>
          </div>

          <!-- Like / Comment actions -->
          <div class="flex border-t border-white/20 bg-white/10">
            <button class="emp-act-btn text-white/80" :class="{ liked: post._liked }" @click="empathy.toggleLike(post.id)">
              {{ post._liked ? '❤️' : '🤍' }} {{ post.likeCount || 0 }} ใจ
            </button>
            <button class="emp-act-btn text-white/80">💬 {{ post.comments.length }} ความเห็น</button>
          </div>
        </div>

        <!-- Message -->
        <div class="px-4 py-3.5 bg-white border-b border-app-border">
          <div class="text-[12px] font-bold text-[#BE185D] mb-1.5">💌 คำชื่นชมจาก {{ post.sndName }}</div>
          <div class="text-[13px] text-[#6B21A8] leading-relaxed">{{ post.msg }}</div>
        </div>

        <!-- Comments -->
        <div class="cm-list">
          <div v-if="!post.comments.length" class="text-center py-5 text-app-light text-[13px]">ยังไม่มีความคิดเห็น 💭</div>
          <div v-for="c in post.comments" :key="c.id" class="cm-item">
            <div class="cm-av bg-[linear-gradient(135deg,#FBCFE8,#EC4899)]">{{ c.name?.[0] }}</div>
            <div class="cm-bubble">
              <div class="cm-name">{{ c.name }}</div>
              <div class="cm-text">{{ c.text }}</div>
              <div class="flex items-center gap-3 mt-1">
                <span class="cm-time">{{ formatThaiDatetime(c.time) }}</span>
                <button
                  class="text-[11px] font-bold bg-transparent border-none cursor-pointer p-0 transition-colors"
                  :class="c._liked ? 'text-[#EC4899]' : 'text-[#C084C0]'"
                  @click="empathy.togglePostCommentLike(post.id, c.id)"
                >{{ c._liked ? '❤️' : '🤍' }} {{ c.likeCount || '' }}</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Reply bar — fixed at bottom -->
      <div class="cm-reply-bar flex-shrink-0">
        <input
          v-model="newComment"
          placeholder="เพิ่มความคิดเห็น..."
          class="flex-1 border-[1.5px] border-[rgba(236,72,153,0.2)] rounded-full px-4 py-2
                 text-[13px] text-[#6B21A8] bg-[#FFF5FB] outline-none"
          @keyup.enter="submitComment"
        />
        <button
          class="bg-[linear-gradient(135deg,#EC4899,#7C3AED)] text-white border-none
                 rounded-full px-4 py-2 text-[13px] font-extrabold cursor-pointer"
          @click="submitComment"
        >ส่ง</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useUiStore } from '../../stores/ui.js'
import { formatThaiDatetime } from '../../utils/date.js'

const empathy = useEmpathyStore()
const ui = useUiStore()
const newComment = ref('')

const post = computed(() => {
  const idx = ui._empDetailIdx ?? 0
  return empathy.posts[idx] || null
})

const BANNER_GRADS = {
  'เก่งมาก ⭐': 'linear-gradient(170deg,#FF8DC7,#EC4899,#BE185D)',
  'ขอบคุณ 🙏':  'linear-gradient(170deg,#C4B5FD,#7C3AED,#4C1D95)',
  'สู้ๆ 💪':    'linear-gradient(170deg,#F472B6,#C026D3,#6D28D9)',
}
const bannerGrad = computed(() => BANNER_GRADS[post.value?.tag] || 'linear-gradient(135deg,#FBCFE8,#F9A8D4)')
const initials = computed(() =>
  (post.value?.recName || '').trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?'
)

function submitComment() {
  if (!newComment.value.trim() || !post.value) return
  empathy.addComment(post.value.id, newComment.value.trim(), ui.currentUser.name)
  newComment.value = ''
}
</script>
