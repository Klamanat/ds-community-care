<template>
  <div>
    <div v-for="sec in sections" :key="sec.key" class="tr-section">
      <div class="tr-sec-hd">
        <div class="tr-sec-hd-left">
          <span
            class="tr-sec-hd-pill"
            :style="sec.key === 'top'
              ? { background: '#F59E0B22', color: '#D97706' }
              : sec.key === 'new'
              ? { background: '#10B98122', color: '#059669' }
              : { background: cat.color + '22', color: cat.color }"
          >{{ sec.icon }} {{ sec.label }}</span>
        </div>
        <div class="tr-sec-hd-right">
          <span class="tr-sec-hd-count">{{ sec.courses?.length ?? 0 }}</span>
          <button
            v-if="sec.key === 'top'"
            class="tr-add-review-btn-sm"
            @click.stop="$emit('open-review', null, false)"
          >+ รีวิว</button>
        </div>
      </div>

      <div v-if="!sec.courses?.length" class="tr-section-empty">ยังไม่มีข้อมูล</div>
      <div v-else class="tr-course-list">
        <div
          v-for="course in sec.courses" :key="course.id"
          class="tr-course-card2"
          :class="sec.key === 'top' ? 'tr-course-card2--click' : ''"
          @click="sec.key === 'top' && $emit('open-review', course, true)"
        >
          <div class="tr-card2-bar" :style="{ background: cat.color }"></div>
          <div class="tr-card2-body">
            <div class="tr-card2-title">{{ course.title }}</div>
            <div v-if="course.description" class="tr-card2-desc">{{ course.description }}</div>
            <div class="tr-card2-foot">
              <span
                v-if="course.instructor"
                class="tr-card2-instructor"
                :style="{ color: cat.color, background: cat.color + '18' }"
              >👩‍🏫 {{ course.instructor }}</span>
              <span v-if="training.reviews[course.id]?.count" class="tr-card2-rating">
                ★ {{ training.reviews[course.id].avg }}
                <span class="tr-card2-rating-count">({{ training.reviews[course.id].count }})</span>
              </span>
            </div>
          </div>
          <span v-if="sec.key === 'top'" class="tr-card2-arrow" :style="{ color: cat.color }">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTrainingStore } from '../../../stores/training.js'

const props = defineProps({
  cat: { type: Object, required: true },
})
defineEmits(['open-review'])

const training = useTrainingStore()

const catCourses = computed(() =>
  (training.courses || []).filter(c => c.category === props.cat.key)
)

const sections = computed(() => [
  {
    key: 'train2026', icon: '📅', label: 'Training trend 2026',
    courses: catCourses.value.filter(c => c.section?.startsWith('train')),
  },
  {
    key: 'new', icon: '✨', label: 'อัพเดตหลักสูตรใหม่',
    courses: catCourses.value.filter(c => c.section === 'new'),
  },
  {
    key: 'top', icon: '⭐', label: 'คอร์สดีบอกต่อ',
    courses: [...catCourses.value]
      .filter(c => (training.reviews[c.id]?.count || 0) >= 1)
      .sort((a, b) => (training.reviews[b.id]?.avg || 0) - (training.reviews[a.id]?.avg || 0)),
  },
])
</script>

<style scoped>
@import './training.css';
</style>
