<template>
  <BaseModal modal-id="modal-training">
    <!-- Header -->
    <div class="tr-header" :style="headerStyle">
      <span class="tr-float" style="font-size:22px;top:18px;left:16px;animation-duration:2.2s;">📚</span>
      <span class="tr-float" style="font-size:18px;top:14px;left:52px;animation-duration:3s;animation-delay:0.5s;">✏️</span>
      <span class="tr-float" style="font-size:20px;top:20px;right:48px;animation-duration:2.8s;animation-delay:0.8s;">💡</span>
      <span class="tr-float" style="font-size:16px;top:12px;right:16px;animation-duration:2.5s;animation-delay:0.3s;">🎯</span>

      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>

      <div style="text-align:center;position:relative;z-index:1;margin-top:10px;">
        <button v-if="view === 'courses'" class="tr-back-btn" @click="goBack">← กลับ</button>

        <div style="font-size:36px;margin-bottom:4px;">
          <span v-if="view === 'categories'">📚</span>
          <span v-else>{{ activeCat?.icon || '📚' }}</span>
        </div>
        <div style="font-size:21px;font-weight:800;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.15);">
          <span v-if="view === 'categories'">Training & Development</span>
          <span v-else>{{ activeCat?.name }}</span>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:3px;letter-spacing:0.5px;">
          <span v-if="view === 'categories'">หลักสูตรพัฒนาทักษะ 2026 🌱</span>
          <span v-else>{{ activeCat?.tag }} · {{ catCourses.length }} หลักสูตร</span>
        </div>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="modal-body-scroll" style="padding:16px;">

      <!-- ── Categories ── -->
      <div v-if="view === 'categories'">
        <div class="train-grid">
          <div
            v-for="cat in training.categories"
            :key="cat.key"
            class="t-card ripple-host"
            :class="{ 'col-span-2': cat.wide }"
            :style="{ background: cat.bgColor, border: `1.5px solid ${cat.color}30` }"
            @click="openCategory(cat)"
          >
            <div class="tc-icon-sm">{{ cat.icon }}</div>
            <div class="tc-name-dark">{{ cat.name }}</div>
            <div class="tc-tag-color" :style="{ color: cat.color, background: cat.color + '20' }">{{ cat.tag }}</div>
            <div v-if="courseCountByKey(cat.key) > 0" class="tc-count" :style="{ color: cat.color }">
              {{ courseCountByKey(cat.key) }} หลักสูตร
            </div>
          </div>
        </div>
      </div>

      <!-- ── Courses ── -->
      <div v-else>
        <div v-if="training.isLoading" class="tr-loading">⏳ กำลังโหลด...</div>

        <div v-else-if="catCourses.length === 0" class="tr-empty">
          <div style="font-size:36px;margin-bottom:8px;">📭</div>
          <div>ยังไม่มีหลักสูตรในหมวดนี้</div>
          <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">ติดตามข่าวสารเร็วๆ นี้ 🚀</div>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div v-for="course in catCourses" :key="course.id" class="tr-course-card">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="tr-course-title">{{ course.title }}</div>
              <span class="tr-status-tag" :class="courseStatusClass(course)">{{ courseStatusLabel(course) }}</span>
            </div>

            <div v-if="course.description" class="tr-course-desc mb-2">{{ course.description }}</div>

            <div class="flex flex-wrap gap-x-4 gap-y-1 mb-3">
              <span v-if="course.instructor" class="tr-meta">👨‍🏫 {{ course.instructor }}</span>
              <span v-if="course.location"   class="tr-meta">📍 {{ course.location }}</span>
              <span v-if="course.date"       class="tr-meta">📅 {{ fmtDate(course.date) }}</span>
              <span v-if="course.capacity > 0" class="tr-meta">👥 รับ {{ course.capacity }} คน</span>
            </div>

            <a
              v-if="course.courseUrl"
              :href="course.courseUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="tr-link-btn"
            >🔗 ดูรายละเอียดหลักสูตร</a>
          </div>
        </div>
      </div>

    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useTrainingStore } from '../../stores/training.js'

const training = useTrainingStore()

const view      = ref('categories')
const activeCat = ref(null)

onMounted(() => training.loadCourses())

const catCourses = computed(() =>
  activeCat.value ? training.coursesByCategory(activeCat.value.key) : []
)

const headerStyle = computed(() => {
  if (view.value === 'courses' && activeCat.value) {
    const c = activeCat.value.color
    return `background:linear-gradient(135deg,${c}CC 0%,${c} 60%,${c}99 100%);padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;`
  }
  return 'background:linear-gradient(135deg,#FFD6DC 0%,#FF8FA3 40%,#FF4D6D 100%);padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;'
})

function courseCountByKey(key) { return training.coursesByCategory(key).length }
function openCategory(cat) { activeCat.value = cat; view.value = 'courses' }
function goBack() { view.value = 'categories'; activeCat.value = null }

function courseStatusClass(course) {
  if (course.status === 'closed') return 'tr-tag-closed'
  return 'tr-tag-open'
}
function courseStatusLabel(course) {
  return course.status === 'closed' ? '🔒 ปิดแล้ว' : '🟢 เปิด'
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}
</script>

<style scoped>
.tr-float {
  position: absolute; opacity: 0.3;
  animation: floatY ease-in-out infinite;
}
.tr-back-btn {
  position: absolute; top: 14px; left: 16px;
  background: rgba(255,255,255,0.2); border: none;
  color: white; font-size: 12px; font-weight: 700;
  padding: 5px 12px; border-radius: 12px; cursor: pointer;
}
.tr-back-btn:active { background: rgba(255,255,255,0.35); }
.tc-count { font-size: 10px; font-weight: 700; margin-top: 4px; }
.tr-loading { text-align: center; padding: 32px 0; font-size: 14px; color: #9CA3AF; }
.tr-empty   { text-align: center; padding: 32px 0; font-size: 14px; color: #9CA3AF; }
.tr-course-card {
  background: #fff;
  border: 1.5px solid #E2DCFB;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(99,102,241,0.07);
}
.tr-course-title { font-size: 14px; font-weight: 800; color: #1A1235; line-height: 1.3; flex: 1; }
.tr-course-desc  { font-size: 12px; color: #52497A; line-height: 1.6; }
.tr-meta         { font-size: 11px; color: #9B8FBB; font-weight: 600; }
.tr-status-tag   { font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 10px; white-space: nowrap; flex-shrink: 0; }
.tr-tag-open     { background: #D1FAE5; color: #065F46; }
.tr-tag-closed   { background: #F3F4F6; color: #6B7280; }
.tr-link-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; padding: 10px 14px; border-radius: 12px; text-decoration: none;
  font-size: 13px; font-weight: 800;
  background: #EEF2FF; color: #4338CA;
  border: 1.5px solid #C7D2FE;
  transition: background 0.15s;
}
.tr-link-btn:active { background: #E0E7FF; }
</style>
