<template>
  <BaseModal modal-id="modal-training" sheet-class="modal-sheet--training">
    <!-- Header -->
    <div class="tr-header" :style="headerStyle">
      <span class="tr-float" style="font-size:22px;top:18px;left:16px;animation-duration:2.2s;">📚</span>
      <span class="tr-float" style="font-size:18px;top:14px;left:52px;animation-duration:3s;animation-delay:0.5s;">✏️</span>
      <span class="tr-float" style="font-size:20px;top:20px;right:48px;animation-duration:2.8s;animation-delay:0.8s;">💡</span>
      <span class="tr-float" style="font-size:16px;top:12px;right:16px;animation-duration:2.5s;animation-delay:0.3s;">🎯</span>

      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>

      <div style="text-align:center;position:relative;z-index:1;margin-top:10px;">
        <button v-if="view !== 'cats'" class="tr-back-btn" @click="goBack">← กลับ</button>

        <div style="font-size:36px;margin-bottom:4px;">
          <span v-if="view === 'review'">⭐</span>
          <span v-else-if="view === 'courses'">{{ selectedCat?.icon || '📚' }}</span>
          <span v-else>📚</span>
        </div>
        <div style="font-size:21px;font-weight:800;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.15);">
          <span v-if="view === 'review'">รีวิวหลักสูตร</span>
          <span v-else-if="view === 'courses'">{{ selectedCat?.name || 'หลักสูตร' }}</span>
          <span v-else>Training & Development</span>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:3px;letter-spacing:0.5px;">
          <span v-if="view === 'review'">{{ reviewSelectedCourse?.title || 'เลือกหลักสูตร' }}</span>
          <span v-else-if="view === 'courses'">{{ catCourses.length }} {{ selectedCat?.key === 'site' ? 'สถานที่' : 'หลักสูตร' }}</span>
          <span v-else>หลักสูตรพัฒนาทักษะ 2026 🌱</span>
        </div>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="modal-body-scroll" style="padding:16px;">

      <!-- ── View: Category cards ── -->
      <div v-if="view === 'cats'">
        <div v-if="training.isLoading" class="tr-loading">⏳ กำลังโหลด...</div>
        <div v-else class="tr-cat-grid">
          <button
            v-for="cat in training.categories"
            :key="cat.key"
            class="tr-cat-card"
            :style="{ '--cat-color': cat.color, '--cat-bg': cat.bgColor }"
            @click="openCategory(cat)"
          >
            <div class="tr-cat-icon">{{ cat.icon }}</div>
            <div class="tr-cat-name">{{ cat.name }}</div>
            <div class="tr-cat-tag">{{ cat.tag }}</div>
            <div class="tr-cat-count">
              {{ countByCategory(cat.key) }} {{ cat.key === 'site' ? 'สถานที่' : 'หลักสูตร' }}
            </div>
          </button>
        </div>

      </div>

      <!-- ── View: Courses in category ── -->
      <div v-else-if="view === 'courses'">

        <!-- Site Visit: voting UI -->
        <template v-if="selectedCat?.key === 'site'">
          <div v-if="!training.siteVisits.length" class="tr-section-empty">ยังไม่มีข้อมูล</div>
          <div v-else class="tr-site-list">
            <div
              v-for="site in training.siteVisits" :key="site.id"
              class="tr-site-card"
              :class="training.isSiteVoted(site.id) ? 'tr-site-card--voted' : ''"
            >
              <!-- Hero -->
              <div class="tr-site-hero" :style="siteHeroStyle(site)">
                <div class="tr-site-hero-bg"></div>
                <div class="tr-site-hero-content">
                  <div class="tr-site-hero-icon">🏭</div>
                  <div class="tr-site-hero-title">{{ site.title }}</div>
                </div>
                <div v-if="training.isSiteVoted(site.id)" class="tr-site-check">✓</div>
              </div>

              <!-- Body -->
              <div class="tr-site-body">
                <div v-if="site.description" class="tr-site-desc">{{ site.description }}</div>
                <div v-if="site.instructor" class="tr-site-meta">
                  <span class="tr-site-meta-pill">👤 {{ site.instructor }}</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="tr-site-foot">
                <div class="tr-site-vote-info">
                  <span class="tr-site-vote-num"
                    :style="{ color: (site.color?.startsWith('#') ? site.color : '#0EA5E9') }">
                    {{ site.voteCount || 0 }}</span>
                  <span class="tr-site-vote-label">คนโหวต</span>
                </div>
                <button
                  class="tr-site-vote-btn"
                  :class="training.isSiteVoted(site.id) ? 'tr-site-vote-btn--voted' : ''"
                  :disabled="siteVotingId === site.id"
                  @click="voteToggle(site)"
                >
                  <span v-if="siteVotingId === site.id">⏳</span>
                  <span v-else-if="training.isSiteVoted(site.id)">✅ โหวตแล้ว</span>
                  <span v-else>🗳️ โหวต</span>
                </button>
              </div>
            </div>

            <!-- Card: อื่นๆ -->
            <div class="tr-site-card tr-site-card--other" :class="otherVoted ? 'tr-site-card--voted' : ''">
              <div class="tr-site-hero tr-site-hero--other">
                <div class="tr-site-hero-content">
                  <div class="tr-site-hero-icon">✍️</div>
                  <div class="tr-site-hero-title">อื่นๆ / ขอเสนอสถานที่</div>
                </div>
                <div v-if="otherVoted" class="tr-site-check">✓</div>
              </div>
              <div class="tr-site-body">
                <textarea
                  v-model="otherText"
                  class="tr-other-input"
                  :disabled="otherVoted"
                  placeholder="ชื่อสถานที่ที่อยากไป (ไม่บังคับ)"
                  rows="2"
                  maxlength="200"
                ></textarea>
              </div>
              <div class="tr-site-foot">
                <div class="tr-site-vote-info">
                  <span class="tr-site-vote-num" style="color:#94A3B8;">—</span>
                  <span class="tr-site-vote-label">{{ otherVoted ? 'โหวตแล้ว' : 'เสนอเพิ่ม' }}</span>
                </div>
                <button
                  class="tr-site-vote-btn"
                  :class="otherVoted ? 'tr-site-vote-btn--voted' : ''"
                  :disabled="otherSubmitting"
                  @click="voteOther"
                >
                  <span v-if="otherSubmitting">⏳</span>
                  <span v-else-if="otherVoted">✅ โหวตแล้ว</span>
                  <span v-else>🗳️ โหวต</span>
                </button>
              </div>
            </div>

          </div>
        </template>

        <!-- Annual: 3 sections -->
        <template v-else-if="selectedCat?.key === 'annual'">
          <div v-for="sec in catSections" :key="sec.key" class="tr-section">
            <div class="tr-sec-hd">
              <div class="tr-sec-hd-left">
                <span class="tr-sec-hd-pill"
                  :style="sec.key === 'top'
                    ? { background: '#F59E0B22', color: '#D97706' }
                    : sec.key === 'new'
                    ? { background: '#10B98122', color: '#059669' }
                    : { background: (selectedCat.color) + '22', color: selectedCat.color }">
                  {{ sec.icon }} {{ sec.label }}
                </span>
              </div>
              <div class="tr-sec-hd-right">
                <span class="tr-sec-hd-count">{{ sec.courses?.length ?? 0 }}</span>
                <button v-if="sec.key === 'top'" class="tr-add-review-btn-sm" @click.stop="openReviewPage(null)">+ รีวิว</button>
              </div>
            </div>
            <div v-if="!sec.courses?.length" class="tr-section-empty">ยังไม่มีข้อมูล</div>
            <div v-else class="tr-course-list">
              <div v-for="course in sec.courses" :key="course.id"
                class="tr-course-card2"
                :class="sec.key === 'top' ? 'tr-course-card2--click' : ''"
                @click="sec.key === 'top' && openReviewPage(course, true)"
              >
                <div class="tr-card2-bar" :style="{ background: selectedCat.color }"></div>
                <div class="tr-card2-body">
                  <div class="tr-card2-title">{{ course.title }}</div>
                  <div v-if="course.description" class="tr-card2-desc">{{ course.description }}</div>
                  <div class="tr-card2-foot">
                    <span v-if="course.instructor" class="tr-card2-instructor"
                      :style="{ color: selectedCat.color, background: selectedCat.color + '18' }">
                      👩‍🏫 {{ course.instructor }}
                    </span>
                    <span v-if="training.reviews[course.id]?.count" class="tr-card2-rating">
                      ★ {{ training.reviews[course.id].avg }}
                      <span class="tr-card2-rating-count">({{ training.reviews[course.id].count }})</span>
                    </span>
                  </div>
                </div>
                <span v-if="sec.key === 'top'" class="tr-card2-arrow" :style="{ color: selectedCat.color }">›</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Other categories: flat list -->
        <template v-else-if="selectedCat?.key !== 'site' && selectedCat?.key !== 'annual'">
          <div v-if="!catCourses.length" class="tr-section-empty">ยังไม่มีข้อมูล</div>
          <div v-else class="tr-course-list">
            <div v-for="course in catCourses" :key="course.id" class="tr-course-card2">
              <div class="tr-card2-bar" :style="{ background: selectedCat?.color || '#6366F1' }"></div>
              <div class="tr-card2-body">
                <div class="tr-card2-title">{{ course.title }}</div>
                <div v-if="course.description" class="tr-card2-desc">{{ course.description }}</div>
                <div class="tr-card2-foot">
                  <span v-if="course.instructor" class="tr-card2-instructor"
                    :style="{ color: selectedCat?.color || '#6366F1', background: (selectedCat?.color || '#6366F1') + '18' }">
                    👩‍🏫 {{ course.instructor }}
                  </span>
                  <span v-if="training.reviews[course.id]?.count" class="tr-card2-rating">
                    ★ {{ training.reviews[course.id].avg }}
                    <span class="tr-card2-rating-count">({{ training.reviews[course.id].count }})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

      </div>

      <!-- ── View: Review page ── -->
      <div v-else-if="view === 'review'" class="tr-review-page">

        <!-- Step 1: Select course -->
        <div v-if="!reviewSelectedCourse">
          <div class="tr-rp-label">เลือกหลักสูตรที่ต้องการรีวิว</div>
          <input
            v-model="reviewSearch"
            class="tr-search-input"
            placeholder="🔍 ค้นหาหลักสูตร..."
          />
          <div v-if="reviewSearch.trim()" class="tr-course-pick-list">
            <div v-if="!filteredMasterCourses.length" class="tr-empty" style="padding:24px 0;">
              ไม่พบหลักสูตร
            </div>
            <div
              v-for="c in filteredMasterCourses"
              :key="c.id"
              class="tr-course-pick-item"
              @click="selectReviewCourse(c)"
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
          <!-- Selected course chip -->
          <div class="tr-selected-chip" @click="reviewSelectedCourse = null">
            {{ training.getCategoryInfo(reviewSelectedCourse.category).icon }}
            {{ reviewSelectedCourse.title }}
            <span class="tr-chip-clear">✕</span>
          </div>

          <!-- Rating form (hidden in read-only mode) -->
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
              @click="saveReviewPage"
            >{{ reviewSaving ? '⏳ กำลังบันทึก...' : '✅ บันทึกคะแนน' }}</button>
          </template>

          <!-- Reviews list -->
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

    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useTrainingStore }  from '../../stores/training.js'
import { useUserAuthStore }  from '../../stores/userAuth.js'
import * as svc from '../../services/trainingService.js'

const training  = useTrainingStore()
const userAuth  = useUserAuthStore()

const view                 = ref('cats')
const selectedCat          = ref(null)
const isTopCat             = ref(false)

const reviewSearch         = ref('')
const reviewSelectedCourse = ref(null)
const reviewReadOnly       = ref(false)
const reviewStars          = ref(0)
const reviewHover          = ref(0)
const reviewComment        = ref('')
const reviewSaving         = ref(false)

const allCourses = computed(() => training.courses || [])

const catCourses = computed(() => {
  if (!selectedCat.value) return []
  if (isTopCat.value) return allCourses.value
  return allCourses.value.filter(c => c.category === selectedCat.value.key)
})

const topRatedCourses = computed(() =>
  [...allCourses.value]
    .filter(c => (training.reviews[c.id]?.count || 0) >= 1)
    .sort((a, b) => (training.reviews[b.id]?.avg || 0) - (training.reviews[a.id]?.avg || 0))
)

const catSections = computed(() => {
  const base = catCourses.value
  return [
    {
      key: 'train2026', icon: '📅', label: 'Training trend 2026',
      courses: base.filter(c => c.section?.startsWith('train')),
    },
    {
      key: 'new', icon: '✨', label: 'อัพเดตหลักสูตรใหม่',
      courses: base.filter(c => c.section === 'new'),
    },
    {
      key: 'top', icon: '⭐', label: 'คอร์สดีบอกต่อ',
      courses: [...base]
        .filter(c => (training.reviews[c.id]?.count || 0) >= 1)
        .sort((a, b) => (training.reviews[b.id]?.avg || 0) - (training.reviews[a.id]?.avg || 0)),
    },
  ]
})

function countByCategory(key) {
  if (key === 'site') return training.siteVisits.length
  return (training.courses || []).filter(c => c.category === key).length
}

const courseReviews = computed(() =>
  reviewSelectedCourse.value ? training.reviewsForCourse(reviewSelectedCourse.value.id) : []
)

const filteredMasterCourses = computed(() => {
  const q = reviewSearch.value.toLowerCase().trim()
  return q ? training.courses.filter(c => c.title.toLowerCase().includes(q)) : training.courses
})

function openCategory(cat) {
  selectedCat.value = cat
  isTopCat.value    = false
  view.value        = 'courses'
}

function openTopRated() {
  selectedCat.value = { icon: '⭐', name: 'คอร์สดีบอกต่อ', key: 'top', color: '#F59E0B' }
  isTopCat.value    = true
  view.value        = 'courses'
}

function selectReviewCourse(c) {
  const my = training.reviews[c.id]
  reviewSelectedCourse.value = c
  reviewStars.value   = my?.myStars   || 0
  reviewComment.value = my?.myComment || ''
  reviewHover.value   = 0
}

function openReviewPage(course, readOnly = false) {
  reviewSelectedCourse.value = course || null
  reviewReadOnly.value = readOnly
  reviewSearch.value  = ''
  reviewHover.value   = 0
  if (course) {
    const my = training.reviews[course.id]
    reviewStars.value   = my?.myStars   || 0
    reviewComment.value = my?.myComment || ''
  } else {
    reviewStars.value   = 0
    reviewComment.value = ''
  }
  view.value = 'review'
}

async function saveReviewPage() {
  if (!reviewStars.value || reviewSaving.value) return
  reviewSaving.value = true
  const c = reviewSelectedCourse.value
  await training.submitReview(c.id, userAuth.empCode || userAuth.userName, userAuth.userName, reviewStars.value, reviewComment.value)
  reviewSaving.value         = false
  reviewSelectedCourse.value = null
  reviewStars.value          = 0
  reviewComment.value        = ''
  view.value = 'cats'
}

const STAR_LABELS = ['', 'แย่มาก', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม']
function starLabel(s) { return STAR_LABELS[s] || '' }

function goBack() {
  if (view.value === 'review') {
    reviewSelectedCourse.value = null
    view.value = 'courses'
  } else {
    view.value = 'cats'
    selectedCat.value = null
    isTopCat.value    = false
  }
}

function siteHeroStyle(site) {
  const c = (site.color && site.color.startsWith('#')) ? site.color : '#0EA5E9'
  return { background: `linear-gradient(140deg, ${c} 0%, ${c}cc 55%, ${c}88 100%)` }
}

const siteVotingId   = ref(null)   // track which site is being voted on
const otherVoted     = ref(false)
const otherText      = ref('')
const otherSubmitting = ref(false)

async function voteToggle(site) {
  if (siteVotingId.value) return
  siteVotingId.value = site.id
  const empId   = userAuth.empCode || userAuth.userName
  const empName = userAuth.userName || empId

  if (training.isSiteVoted(site.id)) {
    await training.cancelSiteVote(site.id, empId)
  } else {
    // ยกเลิกสถานที่เดิมก่อน (โหวตได้แค่ 1)
    const prevVoted = training.siteVisits.find(s => s.id !== site.id && training.isSiteVoted(s.id))
    if (prevVoted) await training.cancelSiteVote(prevVoted.id, empId)
    // ยกเลิก "อื่นๆ" ถ้าเคยโหวต
    if (otherVoted.value) {
      otherVoted.value = false
      otherText.value  = ''
      try { await svc.cancelSiteSuggestion(empId) } catch {}
    }
    await training.voteSite(site.id, empId, empName)
  }
  siteVotingId.value = null
}

async function voteOther() {
  if (otherSubmitting.value) return
  const empId   = userAuth.empCode || userAuth.userName
  const empName = userAuth.userName || empId
  otherSubmitting.value = true
  try {
    if (otherVoted.value) {
      // ยกเลิก
      await svc.cancelSiteSuggestion(empId)
      otherVoted.value       = false
      otherText.value        = ''
      training.mySuggestion  = null
    } else {
      // ยกเลิกสถานที่จริงที่เคยโหวต
      const prevVoted = training.siteVisits.find(s => training.isSiteVoted(s.id))
      if (prevVoted) await training.cancelSiteVote(prevVoted.id, empId)
      const text = otherText.value || 'อื่นๆ'
      await svc.submitSiteSuggestion(empId, empName, text)
      otherVoted.value      = true
      training.mySuggestion = { suggestion: text }
    }
  } catch {}
  otherSubmitting.value = false
}

onMounted(async () => {
  const empId = userAuth.empCode || userAuth.userName
  training.loadCourses()
  training.loadSiteVisits()
  training.loadReviews(empId)
  training.loadMyTrainings(empId)
  training.loadMySiteVotes(empId)
  await training.loadMySuggestion(empId)
  if (training.mySuggestion) {
    otherVoted.value = true
    otherText.value  = training.mySuggestion.suggestion
  }
})

const headerStyle = computed(() => {
  const base = 'padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;'
  if (view.value === 'courses' && selectedCat.value?.key !== 'top') {
    const color = training.getCategoryInfo(selectedCat.value?.key)?.color || '#6366F1'
    return `background:linear-gradient(135deg,${color}55 0%,${color}99 40%,${color} 100%);${base}`
  }
  return `background:linear-gradient(135deg,#FFD6DC 0%,#FF8FA3 40%,#FF4D6D 100%);${base}`
})
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
.tr-loading { text-align: center; padding: 32px 0; font-size: 14px; color: #9CA3AF; }
.tr-empty   { text-align: center; padding: 32px 0; font-size: 14px; color: #9CA3AF; }

/* ── Category cards grid ── */
.tr-cat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
@media (min-width: 600px) {
  .tr-cat-grid { grid-template-columns: repeat(2, 1fr); }
}
.tr-cat-card {
  appearance: none;
  font-family: inherit;
  background: var(--cat-bg);
  border: 1.5px solid var(--cat-color);
  border-radius: 16px;
  padding: 16px 12px 14px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.tr-cat-card:active {
  transform: scale(0.96);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.tr-cat-icon { font-size: 28px; margin-bottom: 6px; line-height: 1; }
.tr-cat-name {
  font-size: 12px; font-weight: 800; color: #1A1235;
  line-height: 1.3; margin-bottom: 3px;
}
.tr-cat-tag {
  font-size: 10px; color: var(--cat-color);
  font-weight: 600; margin-bottom: 6px;
}
.tr-cat-count {
  font-size: 10px; font-weight: 700;
  background: var(--cat-color); color: white;
  padding: 2px 8px; border-radius: 10px;
  opacity: 0.85;
}

/* ── Top-rated shortcut ── */
.tr-top-shortcut {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border: 1.5px solid #FCD34D;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s;
  margin-top: 4px;
}
.tr-top-shortcut:active { transform: scale(0.98); }

/* ── Course card ── */
.tr-course-card {
  background: #fff;
  border: 1.5px solid #EDE9FE;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 2px 12px rgba(99,102,241,0.08);
  transition: transform 0.15s, box-shadow 0.15s;
}
.tr-course-card:active {
  transform: scale(0.985);
  box-shadow: 0 4px 18px rgba(99,102,241,0.16);
}
.tr-cc-accent {
  width: 4px;
  flex-shrink: 0;
  border-radius: 16px 0 0 16px;
}
.tr-cc-body {
  flex: 1;
  padding: 14px 14px 12px;
  min-width: 0;
}
.tr-cc-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.tr-cc-arrow {
  font-size: 22px;
  font-weight: 300;
  line-height: 1.1;
  flex-shrink: 0;
  margin-top: -1px;
}
.tr-cc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}
.tr-cc-instructor-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
}
.tr-cc-mini-rating {
  font-size: 11px;
  font-weight: 700;
  color: #F59E0B;
  white-space: nowrap;
}
.tr-course-title { font-size: 14px; font-weight: 800; color: #1A1235; line-height: 1.35; flex: 1; }
.tr-course-desc  { font-size: 12px; color: #6B6490; line-height: 1.6; }

/* ── Category badge on card ── */
.tr-cc-cat-badge {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.3px; opacity: 0.85;
}

/* card states */
.tr-course-card--static  { cursor: default; }
.tr-course-card--clickable { cursor: pointer; }
.tr-course-card--static:active  { transform: none; box-shadow: 0 2px 12px rgba(99,102,241,0.08); }

/* ── Courses grid ── */
.tr-courses-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 600px) {
  .tr-courses-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .tr-courses-grid .tr-course-card {
    flex-direction: column;
  }
  .tr-courses-grid .tr-cc-accent {
    width: 100%; height: 4px;
    border-radius: 14px 14px 0 0;
  }
  .tr-courses-grid .tr-cc-arrow {
    display: none;
  }
}

/* ── Sections ── */
.tr-section { margin-bottom: 24px; }
.tr-section-empty {
  padding: 14px 12px;
  font-size: 12px; color: #9CA3AF;
  background: #F9FAFB; border-radius: 10px;
  border: 1.5px dashed #E5E7EB;
  text-align: center;
}

/* Section header pill */
.tr-sec-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #F8FAFC;
}
.tr-sec-hd-left { display: flex; align-items: center; }
.tr-sec-hd-pill {
  font-size: 13px; font-weight: 800;
  padding: 4px 14px; border-radius: 20px;
  letter-spacing: 0.2px;
}
.tr-sec-hd-right { display: flex; align-items: center; gap: 6px; }
.tr-sec-hd-count {
  font-size: 12px; font-weight: 700; color: #6B7280;
  background: #E5E7EB; padding: 2px 10px; border-radius: 10px;
}
.tr-add-review-btn-sm {
  font-size: 11px; font-weight: 800; color: #4338CA;
  background: #EEF2FF; border: 1.5px solid #C7D2FE;
  border-radius: 10px; padding: 4px 10px; cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;
}
.tr-add-review-btn-sm:active { background: #E0E7FF; }

/* ── Site Visit voting ── */
.tr-site-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 600px) {
  .tr-site-list { grid-template-columns: repeat(2, 1fr); }
}

.tr-site-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  border: 2px solid transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}
.tr-site-card--voted {
  border-color: #38BDF8;
  box-shadow: 0 4px 24px rgba(56,189,248,0.25);
}
.tr-site-card:active { transform: scale(0.97); }

/* Hero (color set via inline style) */
.tr-site-hero {
  position: relative;
  padding: 20px 16px 18px;
  overflow: hidden;
}
.tr-site-hero-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%);
}
.tr-site-hero-content { position: relative; z-index: 1; }
.tr-site-hero-icon {
  font-size: 32px; line-height: 1;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}
.tr-site-hero-title {
  font-size: 15px; font-weight: 900;
  color: #fff; line-height: 1.35;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.tr-site-check {
  position: absolute; top: 12px; right: 14px;
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(4px);
  color: #fff; font-size: 14px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid rgba(255,255,255,0.5);
}

/* Body */
.tr-site-body { padding: 12px 16px 8px; flex: 1; }
.tr-site-desc {
  font-size: 12px; color: #4B5563;
  line-height: 1.6; margin-bottom: 8px;
}
.tr-site-meta-pill {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 700;
  color: #0369A1; background: #E0F2FE;
  padding: 3px 10px; border-radius: 20px;
}

/* Footer */
.tr-site-foot {
  padding: 10px 16px 14px;
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid #F0F9FF;
}
.tr-site-vote-info { display: flex; align-items: baseline; gap: 4px; }
.tr-site-vote-num  {
  font-size: 24px; font-weight: 900; line-height: 1;
}
.tr-site-vote-label { font-size: 11px; color: #9CA3AF; font-weight: 600; }
.tr-site-vote-btn {
  font-size: 12px; font-weight: 800;
  padding: 8px 18px; border-radius: 20px; cursor: pointer;
  border: 2px solid #0EA5E9; color: #0EA5E9;
  background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(14,165,233,0.2);
}
.tr-site-vote-btn--voted {
  background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
  color: #059669; border-color: #6EE7B7;
  box-shadow: 0 2px 8px rgba(5,150,105,0.15);
}
.tr-site-vote-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.tr-site-vote-btn:not(:disabled):active { transform: scale(0.94); }

/* ── Site card: อื่นๆ ── */
.tr-site-hero--other {
  background: linear-gradient(140deg, #94A3B8 0%, #64748Bcc 55%, #47556988 100%);
}
.tr-other-input {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  padding: 8px 10px; font-size: 13px; color: #374151;
  font-family: inherit; resize: none; outline: none;
  background: #F8FAFC;
  transition: border-color 0.15s;
}
.tr-other-input:focus { border-color: #94A3B8; background: #fff; }
.tr-other-input:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Course card v2 ── */
.tr-course-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 600px) {
  .tr-course-list { grid-template-columns: repeat(3, 1fr); }
}
.tr-course-card2 {
  display: flex; align-items: stretch;
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #EEF2FF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
  cursor: default;
  transition: transform 0.13s, box-shadow 0.13s;
}
.tr-course-card2--click { cursor: pointer; }
.tr-course-card2--click:active {
  transform: scale(0.985);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.tr-card2-bar {
  width: 5px;
  flex-shrink: 0;
}
.tr-card2-body {
  flex: 1; min-width: 0;
  padding: 13px 12px 12px;
}
.tr-card2-cat {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
  opacity: 0.85;
}
.tr-card2-title {
  font-size: 14px; font-weight: 800;
  color: #111827; line-height: 1.4;
  margin-bottom: 4px;
}
.tr-card2-desc {
  font-size: 12px; color: #6B7280;
  line-height: 1.55; margin-bottom: 8px;
}
.tr-card2-foot {
  display: flex; align-items: center;
  gap: 8px; flex-wrap: wrap;
}
.tr-card2-instructor {
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  white-space: nowrap;
}
.tr-card2-rating {
  font-size: 11px; font-weight: 800; color: #F59E0B;
  display: flex; align-items: center; gap: 2px;
}
.tr-card2-rating-count {
  font-weight: 400; color: #9CA3AF; font-size: 10px;
}
.tr-card2-arrow {
  font-size: 24px; font-weight: 300;
  flex-shrink: 0; align-self: center;
  padding-right: 12px; line-height: 1;
}

/* ── Add review btn ── */
.tr-add-review-btn {
  width: 100%; padding: 11px;
  border: 2px dashed #818CF8; border-radius: 14px;
  background: #F5F3FF; color: #4338CA; font-size: 13px; font-weight: 800;
  cursor: pointer; transition: background 0.12s;
}
.tr-add-review-btn:active { background: #EDE9FE; }

/* ── Review page ── */
.tr-review-page      { display: flex; flex-direction: column; gap: 0; }
.tr-rp-label         { font-size: 12px; font-weight: 800; color: #6B7280; letter-spacing: 0.4px; margin-bottom: 10px; }
.tr-rp-stars-label   { font-size: 13px; font-weight: 700; color: #F59E0B; margin-top: 6px; text-align: center; }
.tr-rp-charcount     { font-size: 10px; color: #9CA3AF; text-align: right; margin-top: 3px; margin-bottom: 20px; }

.tr-star-picker  { display: flex; gap: 10px; justify-content: center; }
.tr-star-pick    { font-size: 40px; color: #E5E7EB; cursor: pointer; transition: color 0.1s, transform 0.15s; line-height: 1; user-select: none; }
.tr-star-pick.active { color: #F59E0B; transform: scale(1.2); }

.tr-review-input {
  width: 100%; border: 1.5px solid #E5E7EB; border-radius: 12px;
  padding: 10px 12px; font-size: 13px; color: #374151;
  resize: none; outline: none; font-family: inherit;
  transition: border-color 0.15s; margin-top: 4px;
}
.tr-review-input:focus { border-color: #818CF8; }

.tr-submit-btn {
  font-size: 14px; font-weight: 800; color: white;
  background: linear-gradient(135deg, #818CF8, #6366F1);
  border: none; border-radius: 14px; padding: 14px; cursor: pointer;
  transition: opacity 0.15s; box-shadow: 0 4px 12px rgba(99,102,241,0.35);
}
.tr-submit-full  { width: 100%; }
.tr-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

/* ── Course picker ── */
.tr-search-input {
  width: 100%; border: 1.5px solid #E5E7EB; border-radius: 12px;
  padding: 10px 12px; font-size: 13px; color: #374151;
  outline: none; font-family: inherit; margin-bottom: 10px;
  transition: border-color 0.15s; box-sizing: border-box;
}
.tr-search-input:focus { border-color: #818CF8; }
.tr-course-pick-list {
  display: flex; flex-direction: column; gap: 6px;
  max-height: 340px; overflow-y: auto;
}
.tr-course-pick-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: #fff;
  border: 1.5px solid #E5E7EB; border-radius: 14px; cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.tr-course-pick-item:active { background: #F5F3FF; border-color: #818CF8; }
.tr-cpi-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.tr-cpi-cat   { font-size: 20px; flex-shrink: 0; }
.tr-cpi-title { font-size: 13px; font-weight: 700; color: #1A1235; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tr-cpi-tag   { font-size: 10px; color: #9CA3AF; margin-top: 1px; }
.tr-cpi-my    { font-size: 12px; color: #F59E0B; font-weight: 700; flex-shrink: 0; }
.tr-cpi-arrow { font-size: 18px; color: #D1D5DB; flex-shrink: 0; }

/* ── Individual review list ── */
.tr-review-list { display: flex; flex-direction: column; gap: 10px; }
.tr-review-item {
  background: #FAFAFA; border: 1.5px solid #E5E7EB;
  border-radius: 14px; padding: 12px 14px;
}
.tr-ri-top   { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.tr-ri-name  { font-size: 13px; font-weight: 700; color: #374151; }
.tr-ri-stars { display: flex; gap: 2px; }
.tr-ri-star        { font-size: 14px; color: #E5E7EB; line-height: 1; }
.tr-ri-star.filled { color: #F59E0B; }
.tr-ri-comment { font-size: 12px; color: #6B7280; line-height: 1.6; }

/* ── Selected course chip ── */
.tr-selected-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: #EDE9FE; color: #4338CA; font-size: 13px; font-weight: 700;
  padding: 8px 14px; border-radius: 20px; cursor: pointer;
  border: 1.5px solid #C4B5FD; max-width: 100%; word-break: break-word;
}
.tr-chip-clear { color: #818CF8; font-size: 12px; flex-shrink: 0; margin-left: 2px; }
</style>
