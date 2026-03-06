<template>
  <div class="empathy-box">
    <div class="emp-intro">
      💝 ชื่นชมเพื่อนร่วมงานของคุณวันนี้ • ทุก Empathy = +10 LINE pts
    </div>

    <!-- Send button -->
    <button
      class="modal-close-btn"
      style="margin-bottom:14px;margin-top:0;"
      @click="ui.openModal('modal-emp')"
    >
      💌 ส่งคำชื่นชม
    </button>

    <div v-if="empathy.isLoading" class="emp-feed">
      <SkeletonCard v-for="i in 3" :key="i" height="280px" radius="20px" />
    </div>
    <div v-else class="emp-feed">
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
import EmpathyCard from './EmpathyCard.vue'
import SkeletonCard from '../shared/SkeletonCard.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useUiStore } from '../../stores/ui.js'

const empathy = useEmpathyStore()
const ui = useUiStore()

function openDetail(idx) {
  ui.openModal('modal-emp-detail')
  // store current post index in ui for detail modal
  ui._empDetailIdx = idx
}
</script>
