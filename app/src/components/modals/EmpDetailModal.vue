<template>
  <BaseModal modal-id="modal-emp-detail">
    <div v-if="post" style="display:flex;flex-direction:column;max-height:90vh;">
      <div class="modal-handle" style="flex-shrink:0;"></div>

      <!-- Banner -->
      <div :style="{ background: bannerGrad }" style="flex-shrink:0;padding:0;position:relative;overflow:hidden;">
        <div id="emp-detail-av" style="position:relative;">
          <img v-if="post.recImg" :src="post.recImg" style="width:100%;display:block;" @error="e => e.target.style.display='none'" />
          <div v-else :style="{ width:'100%',height:'200px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'64px' }">{{ initials }}</div>
          <div class="emp-card-stats" style="top:12px;right:12px;">
            <span class="emp-stat-pill">{{ post.react }}</span>
            <span class="emp-stat-pill">💬 {{ post.comments.length }}</span>
          </div>
          <div class="emp-spotlight-name" style="padding:50px 16px 14px;">
            <div style="font-size:18px;font-weight:900;color:white;text-shadow:0 2px 10px rgba(0,0,0,0.6);">{{ post.recName }}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.88);margin-top:2px;">{{ post.recRole }}</div>
          </div>
        </div>

        <!-- Like / Comment actions -->
        <div style="display:flex;border-top:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);">
          <button class="emp-act-btn" :class="{ liked: post._liked }" @click="empathy.toggleLike(post.id)">
            {{ post._liked ? '❤️' : '🤍' }} {{ post.likeCount || 0 }} ใจ
          </button>
          <button class="emp-act-btn">💬 {{ post.comments.length }} ความเห็น</button>
        </div>
      </div>

      <!-- Message -->
      <div style="padding:14px 16px;background:white;border-bottom:1px solid var(--border);">
        <div style="font-size:12px;font-weight:700;color:#BE185D;margin-bottom:6px;">💌 คำชื่นชมจาก {{ post.sndName }}</div>
        <div style="font-size:13px;color:#6B21A8;line-height:1.7;">{{ post.msg }}</div>
      </div>

      <!-- Comments -->
      <div class="cm-list" style="flex:1;overflow-y:auto;">
        <div v-if="!post.comments.length" style="text-align:center;padding:20px;color:var(--light);">ยังไม่มีความคิดเห็น 💭</div>
        <div v-for="c in post.comments" :key="c.id" class="cm-item">
          <div class="cm-av" style="background:linear-gradient(135deg,#FBCFE8,#EC4899);">{{ c.name?.[0] }}</div>
          <div class="cm-bubble">
            <div class="cm-name">{{ c.name }}</div>
            <div class="cm-text">{{ c.text }}</div>
            <div class="cm-time">{{ c.time }}</div>
          </div>
        </div>
      </div>

      <!-- Reply bar -->
      <div class="cm-reply-bar" style="flex-shrink:0;">
        <input v-model="newComment" placeholder="เพิ่มความคิดเห็น..." style="flex:1;border:1.5px solid rgba(236,72,153,0.2);border-radius:24px;padding:8px 14px;font-family:'Sarabun',sans-serif;font-size:13px;color:#6B21A8;background:#FFF5FB;outline:none;" @keyup.enter="submitComment" />
        <button @click="submitComment" style="background:linear-gradient(135deg,#EC4899,#7C3AED);color:white;border:none;border-radius:24px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;">ส่ง</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useUiStore } from '../../stores/ui.js'

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
const initials = computed(() => {
  return (post.value?.recName || '').trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?'
})

function submitComment() {
  if (!newComment.value.trim() || !post.value) return
  empathy.addComment(post.value.id, newComment.value.trim(), ui.currentUser.name)
  newComment.value = ''
}
</script>
