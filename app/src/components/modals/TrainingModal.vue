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
          <span v-else-if="view === 'blog-post'">📝</span>
          <span v-else-if="view === 'courses'">{{ selectedCat?.icon || '📚' }}</span>
          <span v-else>📚</span>
        </div>
        <div style="font-size:21px;font-weight:800;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.15);">
          <span v-if="view === 'review'">รีวิวหลักสูตร</span>
          <span v-else-if="view === 'blog-post'">{{ blogSelectedPost?.title }}</span>
          <span v-else-if="view === 'courses'">{{ selectedCat?.name || 'หลักสูตร' }}</span>
          <span v-else>Training & Development</span>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:3px;letter-spacing:0.5px;">
          <span v-if="view === 'review'">{{ reviewCourseTitle || 'เลือกหลักสูตร' }}</span>
          <span v-else-if="view === 'blog-post'">✍️ {{ blogSelectedPost?.authorName }} · {{ formatBlogDate(blogSelectedPost?.createdAt) }}</span>
          <span v-else-if="view === 'courses' && selectedCat?.key === 'blog'">{{ blog.posts.length }} โพสต์</span>
          <span v-else-if="view === 'courses'">{{ selectedCatCount }} {{ selectedCat?.key === 'site' ? 'สถานที่' : 'หลักสูตร' }}</span>
          <span v-else>หลักสูตรพัฒนาทักษะ 2026 🌱</span>
        </div>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="modal-body-scroll" style="padding:16px;">

      <!-- Category grid -->
      <TrCatsView
        v-if="view === 'cats'"
        @open-category="openCategory"
      />

      <!-- Courses view: delegate to per-category components -->
      <template v-else-if="view === 'courses'">
        <TrSiteView    v-if="selectedCat?.key === 'site'" />
        <TrIdpView     v-else-if="selectedCat?.key === 'idp'" />
        <TrBlogView    v-else-if="selectedCat?.key === 'blog'"   @open-post="onOpenPost" />
        <TrAnnualView  v-else-if="selectedCat?.key === 'annual'" :cat="selectedCat" @open-review="onOpenReview" />
        <TrCoursesView v-else :cat="selectedCat" />
      </template>

      <!-- Full blog post -->
      <div v-else-if="view === 'blog-post' && blogSelectedPost" class="bl-post-view">
        <!-- Author row -->
        <div class="bl-post-author-row">
          <div class="bl-post-av"
            :style="{ background: getBlogCatInfo(blogSelectedPost.category).color }">
            {{ (blogSelectedPost.authorName || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="bl-post-author-info">
            <div class="bl-post-author-name">{{ blogSelectedPost.authorName || 'ไม่ระบุชื่อ' }}</div>
            <div class="bl-post-author-date">{{ formatBlogDate(blogSelectedPost.createdAt) }}</div>
          </div>
          <div class="bl-post-cat-badge"
            :style="{ color: getBlogCatInfo(blogSelectedPost.category).color, background: getBlogCatInfo(blogSelectedPost.category).bg }">
            {{ getBlogCatInfo(blogSelectedPost.category).label }}
          </div>
        </div>

        <!-- Divider -->
        <div class="bl-post-divider"></div>

        <!-- Body -->
        <div class="bl-post-body">{{ blogSelectedPost.body }}</div>
      </div>

      <!-- Review page -->
      <TrReviewView
        v-else-if="view === 'review'"
        ref="reviewRef"
        @done="onReviewDone"
        @select-course="onSelectCourse"
      />

    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import BaseModal     from '../shared/BaseModal.vue'
import TrCatsView    from './training/TrCatsView.vue'
import TrSiteView    from './training/TrSiteView.vue'
import TrBlogView    from './training/TrBlogView.vue'
import TrIdpView     from './training/TrIdpView.vue'
import TrAnnualView  from './training/TrAnnualView.vue'
import TrCoursesView from './training/TrCoursesView.vue'
import TrReviewView  from './training/TrReviewView.vue'
import { useTrainingStore }                              from '../../stores/training.js'
import { useUserAuthStore }                              from '../../stores/userAuth.js'
import { useBlogStore, getCatInfo as getBlogCatInfo }   from '../../stores/blog.js'

const training = useTrainingStore()
const userAuth = useUserAuthStore()
const blog     = useBlogStore()

// ── Navigation state ──────────────────────────────────────────────────────
const view             = ref('cats')
const selectedCat      = ref(null)
const blogSelectedPost = ref(null)
const reviewCourseTitle = ref('')
const reviewRef        = ref(null)

const selectedCatCount = computed(() => {
  if (!selectedCat.value) return 0
  return (training.courses || []).filter(c => c.category === selectedCat.value.key).length
})

// ── Navigation handlers ───────────────────────────────────────────────────
function openCategory(cat) {
  selectedCat.value = cat
  view.value = 'courses'
}

function onOpenPost(post) {
  blogSelectedPost.value = post
  view.value = 'blog-post'
}

function onOpenReview(course, readOnly) {
  view.value = 'review'
  nextTick(() => reviewRef.value?.open(course, readOnly))
}

function onReviewDone() {
  reviewCourseTitle.value = ''
  view.value = 'cats'
  selectedCat.value = null
}

function onSelectCourse(course) {
  reviewCourseTitle.value = course?.title || ''
}

function goBack() {
  if (view.value === 'review') {
    reviewCourseTitle.value = ''
    view.value = 'courses'
  } else if (view.value === 'blog-post') {
    blogSelectedPost.value = null
    view.value = 'courses'
  } else {
    view.value = 'cats'
    selectedCat.value = null
  }
}

// ── Header style ──────────────────────────────────────────────────────────
const headerStyle = computed(() => {
  const base = 'padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;'
  if ((view.value === 'courses' || view.value === 'blog-post') && selectedCat.value?.key !== 'top') {
    const color = training.getCategoryInfo(selectedCat.value?.key)?.color || '#6366F1'
    return `background:linear-gradient(135deg,${color}55 0%,${color}99 40%,${color} 100%);${base}`
  }
  return `background:linear-gradient(135deg,#FFD6DC 0%,#FF8FA3 40%,#FF4D6D 100%);${base}`
})

// ── Helpers ───────────────────────────────────────────────────────────────
function formatBlogDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ── Data loading ──────────────────────────────────────────────────────────
onMounted(() => {
  const empId = userAuth.empCode || userAuth.userName
  training.loadCourses()
  training.loadSiteVisits()
  training.loadReviews(empId)
  training.loadMyTrainings(empId)
  training.loadMySiteVotes(empId)
  blog.loadPosts()
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

/* Blog post view */
.bl-post-view { padding-bottom: 32px; }

.bl-post-author-row {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px;
}
.bl-post-av {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.bl-post-author-info { flex: 1; min-width: 0; }
.bl-post-author-name {
  font-size: 14px; font-weight: 800; color: #111827;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bl-post-author-date { font-size: 11px; color: #9CA3AF; margin-top: 1px; }
.bl-post-cat-badge {
  font-size: 10px; font-weight: 700;
  padding: 4px 12px; border-radius: 20px; flex-shrink: 0;
  white-space: nowrap;
}

.bl-post-divider {
  height: 1px; background: #F3F4F6; margin-bottom: 20px;
}

.bl-post-body {
  background: #FAFAFA;
  border: 1.5px solid #F3F4F6;
  border-radius: 16px;
  padding: 20px 18px;
  font-size: 15px;
  color: #1F2937;
  line-height: 2.1;
  white-space: pre-wrap;
  word-break: break-word;
  letter-spacing: 0.02em;
  font-family: inherit;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.03);
}
</style>
