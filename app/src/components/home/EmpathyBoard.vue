<template>
  <div class="flex flex-col gap-3">
    <div class="rounded-2xl px-4 py-3 text-center"
         style="background:linear-gradient(135deg,#FDF2F8,#F5F0FF);border:1.5px solid rgba(236,72,153,0.15);">
      <div class="text-[15px] font-black bg-[linear-gradient(135deg,#BE185D,#7C3AED)] bg-clip-text text-transparent">
        💝 ชื่นชมเพื่อนร่วมงานของคุณวันนี้
      </div>
      <div class="mt-1 inline-flex items-center gap-1.5 bg-[linear-gradient(135deg,#FFF7ED,#FEF3C7)] border border-[#FCD34D] rounded-full px-3 py-0.5">
        <span class="text-[12px]">🌟</span>
        <span class="text-[11px] font-extrabold text-[#92400E]">ทุก Empathy = +10 DS pts</span>
      </div>
    </div>

<div v-if="loading" class="grid grid-cols-3 md:grid-cols-4 gap-3">
      <SkeletonCard v-for="i in 6" :key="i" height="220px" radius="16px" />
    </div>
    <div v-else-if="!empathy.praisedPeople.length" class="text-center py-6 text-app-light text-[13px]">
      ยังไม่มีคำชื่นชม 💌<br>
      <span class="text-[11px]">กดปุ่มด้านบนเพื่อส่งคำชื่นชมคนแรก</span>
    </div>
    <div v-else class="grid grid-cols-3 md:grid-cols-4 gap-3">
      <EmpathyCard
        v-for="post in visiblePosts"
        :key="post.id"
        :post="post"
        @click="openThread(empathy.praisedPeople.find(p => p.id === post.id))"
      />
    </div>

    <!-- Load more -->
    <button
      v-if="!loading && posts.length > visibleCount"
      class="emp-load-more"
      @click="visibleCount += 6"
    >
      ดูเพิ่มเติม {{ posts.length - visibleCount }} คน ↓
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EmpathyCard from './EmpathyCard.vue'
import SkeletonCard from '../shared/SkeletonCard.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useUiStore } from '../../stores/ui.js'

const empathy = useEmpathyStore()
const ui = useUiStore()
const loading = ref(false)

onMounted(() => {
  // ถ้ามี cache อยู่แล้ว → ไม่ต้อง spinner รอ GAS
  loading.value = !empathy.praisedPeople.length
  empathy.loadPeople().finally(() => { loading.value = false })
})

const GRADS = [
  'linear-gradient(135deg,#FBCFE8,#EC4899)',
  'linear-gradient(135deg,#DDD6FE,#7C3AED)',
  'linear-gradient(135deg,#BAE6FD,#38BDF8)',
  'linear-gradient(135deg,#A7F3D0,#34D399)',
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
]

const visibleCount = ref(6)

// Map praisedPeople → shape EmpathyCard expects
const posts = computed(() =>
  empathy.praisedPeople.map((person, idx) => {
    const cl = empathy.channelLikes[person.empCode || person.id]
    return {
      id:        person.id,
      recImg:    person.imgUrl || '',
      recName:   person.name,
      recRole:   person.role,
      react:     '💝',
      comments:  { length: person.commentCount || 0 },
      likeCount: cl?.count ?? 0,
      _liked:    cl?.liked ?? false,
      grad:      GRADS[idx % GRADS.length],
    }
  })
)

const visiblePosts = computed(() => posts.value.slice(0, visibleCount.value))

// Click card → open EmpathyModal thread for that person
function openThread(person) {
  ui._empPreselect = person
  ui.openModal('modal-emp')
}
</script>

<style scoped>
.emp-load-more {
  width: 100%;
  padding: 10px;
  border-radius: 14px;
  border: 1.5px dashed #FBCFE8;
  background: #FFF7FB;
  color: #BE185D;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s;
}
.emp-load-more:hover { background: #FCE7F3; }
</style>
