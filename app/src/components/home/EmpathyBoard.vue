<template>
  <div class="flex flex-col gap-3">
    <div class="text-[12px] font-semibold text-app-mid text-center py-2">
      💝 ชื่นชมเพื่อนร่วมงานของคุณวันนี้ • ทุก Empathy = +10 LINE pts
    </div>

    <button class="modal-close-btn" @click="ui.openModal('modal-emp')">
      💌 ส่งคำชื่นชม
    </button>

    <div v-if="loading" class="grid grid-cols-3 gap-3">
      <SkeletonCard v-for="i in 3" :key="i" height="220px" radius="16px" />
    </div>
    <div v-else-if="!empathy.praisedPeople.length" class="text-center py-6 text-app-light text-[13px]">
      ยังไม่มีคำชื่นชม 💌<br>
      <span class="text-[11px]">กดปุ่มด้านบนเพื่อส่งคำชื่นชมคนแรก</span>
    </div>
    <div v-else class="grid grid-cols-3 gap-3">
      <EmpathyCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @click="openThread(empathy.praisedPeople.find(p => p.id === post.id))"
      />
    </div>
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

onMounted(async () => {
  loading.value = true
  await empathy.loadPeople()
  loading.value = false
})

const GRADS = [
  'linear-gradient(135deg,#FBCFE8,#EC4899)',
  'linear-gradient(135deg,#DDD6FE,#7C3AED)',
  'linear-gradient(135deg,#BAE6FD,#38BDF8)',
  'linear-gradient(135deg,#A7F3D0,#34D399)',
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
]

// Map praisedPeople → shape EmpathyCard expects (computed so channelLikes changes re-render)
const posts = computed(() =>
  empathy.praisedPeople.map((person, idx) => {
    const cl = empathy.channelLikes[person.id]
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

// Click card → open EmpathyModal thread for that person
function openThread(person) {
  ui._empPreselect = person
  ui.openModal('modal-emp')
}
</script>
