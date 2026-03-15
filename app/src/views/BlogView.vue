<template>
  <div class="blog-wrap">

    <!-- Header -->
    <div class="blog-header">
      <span class="blog-hd-icon">📝</span>
      <div class="blog-hd-text">
        <div class="blog-hd-title">บล็อกภายใน</div>
        <div class="blog-hd-sub">{{ blog.posts.length }} โพสต์</div>
      </div>
      <button class="blog-write-btn" @click="toggleForm">
        {{ showForm ? '✕ ปิด' : '✏️ เขียน' }}
      </button>
    </div>

    <!-- Write form -->
    <transition name="blog-form-slide">
      <div v-if="showForm" class="blog-form-card">
        <div class="blog-form-title">✏️ เขียนโพสต์ใหม่</div>

        <!-- Category -->
        <div class="blog-form-label">หมวดหมู่</div>
        <div class="blog-cat-pills">
          <button
            v-for="cat in BLOG_CATEGORIES" :key="cat.key"
            class="blog-cat-pill"
            :class="formCat === cat.key ? 'blog-cat-pill--active' : ''"
            :style="formCat === cat.key
              ? { background: cat.color, color: '#fff', borderColor: cat.color }
              : { borderColor: cat.color, color: cat.color, background: cat.bg }"
            @click="formCat = cat.key"
          >{{ cat.label }}</button>
        </div>

        <!-- Title -->
        <div class="blog-form-label" style="margin-top:14px;">หัวข้อ</div>
        <input
          v-model="formTitle"
          class="blog-input"
          placeholder="หัวข้อบทความ..."
          maxlength="120"
        />

        <!-- Body -->
        <div class="blog-form-label" style="margin-top:12px;">เนื้อหา</div>
        <textarea
          v-model="formBody"
          class="blog-textarea"
          placeholder="เล่าเรื่องราว ความรู้ หรือประสบการณ์..."
          rows="6"
          maxlength="1000"
        ></textarea>
        <div class="blog-charcount">{{ formBody.length }}/1000</div>

        <button
          class="blog-submit-btn"
          :disabled="!formTitle.trim() || !formBody.trim() || submitting"
          @click="submitPost"
        >
          {{ submitting ? '⏳ กำลังโพสต์...' : '📤 โพสต์บทความ' }}
        </button>
      </div>
    </transition>

    <!-- Category filter -->
    <div class="blog-filter-wrap">
      <button
        class="blog-filter-pill"
        :class="filterCat === null ? 'blog-filter-pill--active' : ''"
        @click="filterCat = null"
      >ทั้งหมด</button>
      <button
        v-for="cat in BLOG_CATEGORIES" :key="cat.key"
        class="blog-filter-pill"
        :class="filterCat === cat.key ? 'blog-filter-pill--active' : ''"
        :style="filterCat === cat.key ? { background: cat.color, color: '#fff', borderColor: cat.color } : {}"
        @click="filterCat = filterCat === cat.key ? null : cat.key"
      >{{ cat.label }}</button>
    </div>

    <!-- Loading -->
    <div v-if="blog.isLoading" class="blog-loading">
      <div v-for="i in 4" :key="i" class="blog-skeleton"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredPosts.length" class="blog-empty">
      <div class="blog-empty-icon">📭</div>
      <div class="blog-empty-text">ยังไม่มีโพสต์{{ filterCat ? 'ในหมวดนี้' : '' }}</div>
      <div class="blog-empty-sub">เป็นคนแรกที่แชร์เรื่องราว!</div>
    </div>

    <!-- Posts grid -->
    <div v-else class="blog-grid">
      <div
        v-for="post in filteredPosts" :key="post.id"
        class="blog-card"
        @click="openPost(post)"
      >
        <!-- Category bar -->
        <div class="blog-card-bar" :style="{ background: getCatInfo(post.category).color }"></div>
        <div class="blog-card-body">
          <div class="blog-card-cat"
            :style="{ color: getCatInfo(post.category).color, background: getCatInfo(post.category).bg }">
            {{ getCatInfo(post.category).label }}
          </div>
          <div class="blog-card-title">{{ post.title }}</div>
          <div class="blog-card-excerpt">{{ post.body }}</div>
          <div class="blog-card-foot">
            <span class="blog-card-author">{{ post.authorName || 'ไม่ระบุชื่อ' }}</span>
            <span class="blog-card-date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBlogStore, BLOG_CATEGORIES, getCatInfo } from '../stores/blog.js'
import { useUserAuthStore } from '../stores/userAuth.js'
import { useUiStore } from '../stores/ui.js'
// BlogPostModal is registered globally in App.vue

const blog     = useBlogStore()
const userAuth = useUserAuthStore()
const ui       = useUiStore()

const showForm   = ref(false)
const filterCat  = ref(null)
const formCat    = ref('news')
const formTitle  = ref('')
const formBody   = ref('')
const submitting = ref(false)

const filteredPosts = computed(() => {
  if (!filterCat.value) return blog.posts
  return blog.posts.filter(p => p.category === filterCat.value)
})

function toggleForm() {
  showForm.value = !showForm.value
  if (!showForm.value) {
    formTitle.value = ''
    formBody.value  = ''
    formCat.value   = 'news'
  }
}

async function submitPost() {
  if (!formTitle.value.trim() || !formBody.value.trim() || submitting.value) return
  submitting.value = true
  await blog.submitPost({
    title:      formTitle.value.trim(),
    body:       formBody.value.trim(),
    category:   formCat.value,
    authorName: userAuth.userName || 'ไม่ระบุชื่อ',
    authorId:   userAuth.empCode || userAuth.userName || 'unknown',
  })
  submitting.value = false
  showForm.value   = false
  formTitle.value  = ''
  formBody.value   = ''
  formCat.value    = 'news'
}

function openPost(post) {
  blog.openPost(post)
  ui.openModal('modal-blog-post')
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

onMounted(() => blog.loadPosts())
</script>

<style scoped>
.blog-wrap {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

/* ── Header ── */
.blog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  border-radius: 20px;
  padding: 16px 18px;
  margin-bottom: 14px;
  box-shadow: 0 4px 20px rgba(102,126,234,0.35);
}
.blog-hd-icon  { font-size: 32px; line-height: 1; }
.blog-hd-text  { flex: 1; }
.blog-hd-title { font-size: 18px; font-weight: 900; color: #fff; }
.blog-hd-sub   { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 2px; }
.blog-write-btn {
  background: rgba(255,255,255,0.2);
  border: 1.5px solid rgba(255,255,255,0.4);
  color: #fff; font-size: 12px; font-weight: 800;
  padding: 8px 14px; border-radius: 12px; cursor: pointer;
  white-space: nowrap; transition: background 0.15s;
}
.blog-write-btn:active { background: rgba(255,255,255,0.35); }

/* ── Write form ── */
.blog-form-card {
  background: #fff;
  border: 1.5px solid #E0E7FF;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 4px 20px rgba(99,102,241,0.1);
}
.blog-form-title {
  font-size: 15px; font-weight: 900; color: #1A1235; margin-bottom: 14px;
}
.blog-form-label {
  font-size: 11px; font-weight: 800; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}
.blog-cat-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.blog-cat-pill {
  font-size: 11px; font-weight: 700;
  padding: 5px 12px; border-radius: 20px;
  border: 1.5px solid; cursor: pointer;
  transition: all 0.12s;
}
.blog-input {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #E5E7EB; border-radius: 10px;
  padding: 10px 12px; font-size: 14px; color: #111827;
  font-family: inherit; outline: none;
  transition: border-color 0.15s;
}
.blog-input:focus { border-color: #818CF8; }
.blog-textarea {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #E5E7EB; border-radius: 10px;
  padding: 10px 12px; font-size: 13px; color: #374151;
  font-family: inherit; resize: none; outline: none;
  transition: border-color 0.15s; line-height: 1.6;
}
.blog-textarea:focus { border-color: #818CF8; }
.blog-charcount {
  font-size: 10px; color: #9CA3AF; text-align: right; margin-top: 3px; margin-bottom: 14px;
}
.blog-submit-btn {
  width: 100%;
  font-size: 14px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, #818CF8, #6366F1);
  border: none; border-radius: 12px;
  padding: 12px; cursor: pointer;
  transition: opacity 0.15s;
  box-shadow: 0 4px 12px rgba(99,102,241,0.35);
}
.blog-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

/* form transition */
.blog-form-slide-enter-active,
.blog-form-slide-leave-active { transition: all 0.25s ease; max-height: 600px; overflow: hidden; }
.blog-form-slide-enter-from,
.blog-form-slide-leave-to    { opacity: 0; max-height: 0; margin-bottom: 0; }

/* ── Filter pills ── */
.blog-filter-wrap {
  display: flex; flex-wrap: nowrap; overflow-x: auto;
  gap: 6px; padding-bottom: 6px; margin-bottom: 14px;
  scrollbar-width: none;
}
.blog-filter-wrap::-webkit-scrollbar { display: none; }
.blog-filter-pill {
  font-size: 11px; font-weight: 700;
  padding: 5px 12px; border-radius: 20px; white-space: nowrap;
  border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280;
  cursor: pointer; transition: all 0.12s;
  flex-shrink: 0;
}
.blog-filter-pill--active {
  background: #6366F1; color: #fff; border-color: #6366F1;
}

/* ── Skeleton ── */
.blog-loading {
  display: grid; grid-template-columns: 1fr; gap: 12px;
}
@media (min-width: 600px) { .blog-loading { grid-template-columns: repeat(2, 1fr); } }
.blog-skeleton {
  height: 160px; border-radius: 16px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Empty ── */
.blog-empty { text-align: center; padding: 48px 0; }
.blog-empty-icon { font-size: 48px; margin-bottom: 12px; }
.blog-empty-text { font-size: 15px; font-weight: 800; color: #374151; margin-bottom: 4px; }
.blog-empty-sub  { font-size: 13px; color: #9CA3AF; }

/* ── Grid & Cards ── */
.blog-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 600px) {
  .blog-grid { grid-template-columns: repeat(2, 1fr); }
}
.blog-card {
  display: flex;
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #EEF2FF;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.blog-card:active {
  transform: scale(0.985);
  box-shadow: 0 4px 18px rgba(0,0,0,0.12);
}
.blog-card-bar {
  width: 5px;
  flex-shrink: 0;
}
.blog-card-body {
  flex: 1; min-width: 0;
  padding: 14px 14px 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.blog-card-cat {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  align-self: flex-start;
}
.blog-card-title {
  font-size: 14px; font-weight: 800;
  color: #111827; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.blog-card-excerpt {
  font-size: 12px; color: #6B7280; line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  flex: 1;
}
.blog-card-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 4px;
}
.blog-card-author { font-size: 11px; font-weight: 700; color: #374151; }
.blog-card-date   { font-size: 10px; color: #9CA3AF; }
</style>
