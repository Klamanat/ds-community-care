<template>
  <div>
    <div v-if="!courses.length" class="tr-section-empty">ยังไม่มีข้อมูล</div>
    <div v-else class="tr-course-list">
      <div v-for="course in courses" :key="course.id" class="tr-course-card2">
        <div class="tr-card2-bar" :style="{ background: cat?.color || '#6366F1' }"></div>
        <div class="tr-card2-body">
          <div class="tr-card2-title">{{ course.title }}</div>
          <div v-if="course.description" class="tr-card2-desc">{{ course.description }}</div>
          <div class="tr-card2-foot">
            <span
              v-if="course.instructor"
              class="tr-card2-instructor"
              :style="{ color: cat?.color || '#6366F1', background: (cat?.color || '#6366F1') + '18' }"
            >👩‍🏫 {{ course.instructor }}</span>
            <span v-if="training.reviews[course.id]?.count" class="tr-card2-rating">
              ★ {{ training.reviews[course.id].avg }}
              <span class="tr-card2-rating-count">({{ training.reviews[course.id].count }})</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTrainingStore } from '../../../stores/training.js'

const props = defineProps({
  cat: { type: Object, default: null },
})

const training = useTrainingStore()

const courses = computed(() => {
  if (!props.cat) return []
  return (training.courses || []).filter(c => c.category === props.cat.key)
})
</script>

<style scoped>
@import './training.css';
</style>
