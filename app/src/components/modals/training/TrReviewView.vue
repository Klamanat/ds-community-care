<template>
  <div class="tr-review-page">

    <!-- Step 1: Select course -->
    <div v-if="!reviewSelectedCourse">
      <div class="tr-rp-label">เลือกหลักสูตรที่ต้องการรีวิว</div>
      <input
        v-model="reviewSearch"
        class="tr-search-input"
        placeholder="🔍 ค้นหาหลักสูตร..."
      />
      <div v-if="reviewSearch.trim()" class="tr-course-pick-list">
        <div v-if="!filteredCourses.length" class="tr-empty" style="padding:24px 0;">ไม่พบหลักสูตร</div>
        <div
          v-for="c in filteredCourses" :key="c.id"
          class="tr-course-pick-item"
          @click="selectCourse(c)"
        >
          <div class="tr-cpi-left">
            <span class="tr-cpi-cat">{{ training.getCategoryInfo(c.category).icon }}</span>
            <div>
              <div class="tr-cpi-title">{{ c.title }}</div>
              <div class="tr-cpi-tag">{{ training.getCategoryInfo(c.category).name }}</div>
            </div>
          </div>
          <div v-if="training.reviews[c.id]?.myStars" class="tr-cpi-my">
            {{ '★'.repeat(training.reviews[c.id].myStars) }}
          </div>
          <div v-else class="tr-cpi-arrow">›</div>
        </div>
      </div>
    </div>

    <!-- Step 2: Rate / Read reviews -->
    <div v-else>
      <div class="tr-selected-chip" @click="clearCourse">
        {{ training.getCategoryInfo(reviewSelectedCourse.category).icon }}
        {{ reviewSelectedCourse.title }}
        <span class="tr-chip-clear">✕</span>
      </div>

      <template v-if="!reviewReadOnly">
        <div class="tr-rp-label" style="margin-top:20px;">ให้คะแนนหลักสูตรนี้</div>
        <div class="tr-star-picker">
          <span
            v-for="s in 5" :key="s"
            class="tr-star-pick"
            :class="s <= (reviewHover || reviewStars) ? 'active' : ''"
            @mouseenter="reviewHover = s"
            @mouseleave="reviewHover = 0"
            @touchstart.passive="reviewHover = s"
            @click="reviewStars = s"
          >★</span>
        </div>
        <div class="tr-rp-stars-label">{{ reviewStars ? starLabel(reviewStars) : 'แตะเพื่อให้คะแนน' }}</div>
        <div class="tr-rp-label" style="margin-top:20px;">
          ความคิดเห็น <span style="font-weight:400;color:#9CA3AF;">(ไม่บังคับ)</span>
        </div>
        <textarea
          v-model="reviewComment"
          class="tr-review-input"
          placeholder="เล่าประสบการณ์การเรียน ข้อดี ข้อเสนอแนะ..."
          rows="4"
          maxlength="300"
        ></textarea>
        <div class="tr-rp-charcount">{{ reviewComment.length }}/300</div>
        <button
          class="tr-submit-btn tr-submit-full"
          :disabled="!reviewStars || reviewSaving"
          @click="saveReview"
        >{{ reviewSaving ? '⏳ กำลังบันทึก...' : '✅ บันทึกคะแนน' }}</button>
      </template>

      <div v-if="courseReviews.length" class="tr-review-list" :style="reviewReadOnly ? 'margin-top:16px;' : ''">
        <div class="tr-rp-label" style="margin-bottom:12px;">รีวิวจากผู้เรียน ({{ courseReviews.length }})</div>
        <div v-for="r in courseReviews" :key="r.id || r.employeeId" class="tr-review-item">
          <div class="tr-ri-top">
            <span class="tr-ri-name">{{ r.employeeName || r.name || 'ไม่ระบุชื่อ' }}</span>
            <span class="tr-ri-stars">
              <span v-for="s in 5" :key="s" :class="s <= r.stars ? 'tr-ri-star filled' : 'tr-ri-star'">★</span>
            </span>
          </div>
          <div v-if="r.comment" class="tr-ri-comment">{{ r.comment }}</div>
        </div>
      </div>
      <div v-else-if="reviewReadOnly" class="tr-section-empty" style="margin-top:16px;">ยังไม่มีรีวิว</div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTrainingStore } from '../../../stores/training.js'
import { useUserAuthStore } from '../../../stores/userAuth.js'

const emit = defineEmits(['done', 'select-course'])

const training = useTrainingStore()
const userAuth = useUserAuthStore()

const reviewSearch         = ref('')
const reviewSelectedCourse = ref(null)
const reviewReadOnly       = ref(false)
const reviewStars          = ref(0)
const reviewHover          = ref(0)
const reviewComment        = ref('')
const reviewSaving         = ref(false)

const filteredCourses = computed(() => {
  const q = reviewSearch.value.toLowerCase().trim()
  return q ? training.courses.filter(c => c.title.toLowerCase().includes(q)) : training.courses
})

const courseReviews = computed(() =>
  reviewSelectedCourse.value ? training.reviewsForCourse(reviewSelectedCourse.value.id) : []
)

function selectCourse(c) {
  const my = training.reviews[c.id]
  reviewSelectedCourse.value = c
  reviewStars.value   = my?.myStars   || 0
  reviewComment.value = my?.myComment || ''
  reviewHover.value   = 0
  emit('select-course', c)
}

function clearCourse() {
  reviewSelectedCourse.value = null
  emit('select-course', null)
}

// Called by parent via ref when opening review for a specific course
function open(course, readOnly = false) {
  reviewSelectedCourse.value = course || null
  reviewReadOnly.value       = readOnly
  reviewSearch.value         = ''
  reviewHover.value          = 0
  if (course) {
    const my = training.reviews[course.id]
    reviewStars.value   = my?.myStars   || 0
    reviewComment.value = my?.myComment || ''
    emit('select-course', course)
  } else {
    reviewStars.value   = 0
    reviewComment.value = ''
    emit('select-course', null)
  }
}

defineExpose({ open })

const STAR_LABELS = ['', 'แย่มาก', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม']
function starLabel(s) { return STAR_LABELS[s] || '' }

async function saveReview() {
  if (!reviewStars.value || reviewSaving.value) return
  reviewSaving.value = true
  await training.submitReview(
    reviewSelectedCourse.value.id,
    userAuth.empCode || userAuth.userName,
    userAuth.userName,
    reviewStars.value,
    reviewComment.value
  )
  reviewSaving.value         = false
  reviewSelectedCourse.value = null
  reviewStars.value          = 0
  reviewComment.value        = ''
  emit('done')
}
</script>

<style scoped>
@import './training.css';
</style>
