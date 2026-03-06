<template>
  <div class="flex flex-col gap-3">
    <div class="text-[12px] font-semibold text-app-mid text-center py-2">
      💝 ชื่นชมเพื่อนร่วมงานของคุณวันนี้ • ทุก Empathy = +10 LINE pts
    </div>

    <button class="modal-close-btn" @click="ui.openModal('modal-emp')">
      💌 ส่งคำชื่นชม
    </button>

    <div v-if="empathy.isLoading" class="grid grid-cols-3 gap-3">
      <SkeletonCard v-for="i in 3" :key="i" height="220px" radius="16px" />
    </div>
    <div v-else class="grid grid-cols-3 gap-3">
      <EmpathyCard
        v-for="(post, idx) in empathy.posts"
        :key="post.id"
        :post="post"
        @click="openDetail(idx)"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import EmpathyCard from './EmpathyCard.vue'
import SkeletonCard from '../shared/SkeletonCard.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useUiStore } from '../../stores/ui.js'

const empathy = useEmpathyStore()
const ui = useUiStore()

onMounted(() => empathy.loadPosts())

function openDetail(idx) {
  ui._empDetailIdx = idx
  ui.openModal('modal-emp-detail')
}
</script>
