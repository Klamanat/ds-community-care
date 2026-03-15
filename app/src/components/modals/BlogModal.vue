<template>
  <BaseModal modal-id="modal-blog" sheet-class="modal-sheet--blog">

    <!-- ── Header ── -->
    <div class="bl-header" :style="headerStyle">
      <span class="bl-float" style="font-size:20px;top:16px;left:14px;animation-duration:2.4s;">📝</span>
      <span class="bl-float" style="font-size:16px;top:12px;left:48px;animation-duration:3.1s;animation-delay:0.4s;">✏️</span>
      <span class="bl-float" style="font-size:18px;top:18px;right:44px;animation-duration:2.7s;animation-delay:0.7s;">💬</span>
      <span class="bl-float" style="font-size:14px;top:10px;right:14px;animation-duration:2.2s;animation-delay:0.2s;">🌟</span>

      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>

      <div style="text-align:center;position:relative;z-index:1;margin-top:10px;">
        <button v-if="view === 'post'" class="bl-back-btn" @click="goBack">← กลับ</button>

        <div style="font-size:34px;margin-bottom:4px;">
          <span v-if="view === 'post'">{{ catInfo.label.split(' ')[0] }}</span>
          <span v-else>📝</span>
        </div>
        <div style="font-size:20px;font-weight:900;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.15);">
          <span v-if="view === 'post'">{{ selectedPost?.title }}</span>
          <span v-else>บล็อกภายใน</span>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:3px;">
          <span v-if="view === 'post'">✍️ {{ selectedPost?.authorName || 'ไม่ระบุชื่อ' }} · {{ formatDate(selectedPost?.createdAt) }}</span>
          <span v-else>{{ blog.posts.length }} โพสต์ · แชร์เรื่องราว ความรู้ ประสบการณ์</span>
        </div>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="modal-body-scroll" style="padding:16px;">

      <!-- ─ View: List ─ -->
      <div v-if="view === 'list'">

        <!-- Write button -->
        <button class="bl-write-toggle" @click="showForm = !showForm">
          <span>{{ showForm ? '✕ ปิดฟอร์ม' : '✏️ เขียนโพสต์ใหม่' }}</span>
        </button>

        <!-- Write form -->
        <transition name="bl-slide">
          <div v-if="showForm" class="bl-form-card">
            <div class="bl-form-lbl">หมวดหมู่</div>
            <div class="bl-cat-pills">
              <button
                v-for="cat in BLOG_CATEGORIES" :key="cat.key"
                class="bl-cat-pill"
                :class="formCat === cat.key ? 'bl-cat-pill--on' : ''"
                :style="formCat === cat.key
                  ? { background: cat.color, color: '#fff', borderColor: cat.color }
                  : { borderColor: cat.color, color: cat.color, background: cat.bg }"
                @click="formCat = cat.key"
              >{{ cat.label }}</button>
            </div>

            <div class="bl-form-lbl" style="margin-top:14px;">หัวข้อ</div>
            <input
              v-model="formTitle"
              class="bl-input"
              placeholder="หัวข้อบทความ..."
              maxlength="120"
            />

            <div class="bl-form-lbl" style="margin-top:12px;">เนื้อหา</div>
            <textarea
              v-model="formBody"
              class="bl-textarea"
              placeholder="เล่าเรื่องราว ความรู้ หรือประสบการณ์..."
              rows="5"
              maxlength="1000"
            ></textarea>
            <div class="bl-charcount">{{ formBody.length }}/1000</div>

            <button
              class="bl-submit-btn"
              :disabled="!formTitle.trim() || !formBody.trim() || submitting"
              @click="submitPost"
            >{{ submitting ? '⏳ กำลังโพสต์...' : '📤 โพสต์บทความ' }}</button>
          </div>
        </transition>

        <!-- Filter -->
        <div class="bl-filter-row">
          <button
            class="bl-filter-pill"
            :class="filterCat === null ? 'bl-filter-pill--on' : ''"
            @click="filterCat = null"
          >ทั้งหมด</button>
          <button
            v-for="cat in BLOG_CATEGORIES" :key="cat.key"
            class="bl-filter-pill"
            :class="filterCat === cat.key ? 'bl-filter-pill--on' : ''"
            :style="filterCat === cat.key
              ? { background: cat.color, color: '#fff', borderColor: cat.color }
              : {}"
            @click="filterCat = filterCat === cat.key ? null : cat.key"
          >{{ cat.label }}</button>
        </div>

        <!-- Loading skeletons -->
        <div v-if="blog.isLoading" class="bl-skeletons">
          <div v-for="i in 3" :key="i" class="bl-skeleton"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="!filteredPosts.length" class="bl-empty">
          <div class="bl-empty-ico">📭</div>
          <div class="bl-empty-txt">ยังไม่มีโพสต์{{ filterCat ? 'ในหมวดนี้' : '' }}</div>
          <div class="bl-empty-sub">กดปุ่ม "เขียนโพสต์ใหม่" เพื่อเริ่มแชร์เรื่องราว</div>
        </div>

        <!-- Post cards -->
        <div v-else class="bl-grid">
          <div
            v-for="post in filteredPosts" :key="post.id"
            class="bl-card"
            @click="openPost(post)"
          >
            <div class="bl-card-bar" :style="{ background: getCatInfo(post.category).color }"></div>
            <div class="bl-card-body">
              <div class="bl-card-cat"
                :style="{ color: getCatInfo(post.category).color, background: getCatInfo(post.category).bg }">
                {{ getCatInfo(post.category).label }}
              </div>
              <div class="bl-card-title">{{ post.title }}</div>
              <div class="bl-card-excerpt">{{ post.body }}</div>
              <div class="bl-card-foot">
                <span class="bl-card-author">{{ post.authorName || 'ไม่ระบุชื่อ' }}</span>
                <span class="bl-card-date">{{ formatDate(post.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ─ View: Full post ─ -->
      <div v-else-if="view === 'post' && selectedPost" class="bl-post-view">
        <div class="bl-post-cat"
          :style="{ color: catInfo.color, background: catInfo.bg }">
          {{ catInfo.label }}
        </div>
        <div class="bl-post-body">{{ selectedPost.body }}</div>
      </div>

    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useBlogStore, BLOG_CATEGORIES, getCatInfo } from '../../stores/blog.js'
import { useUserAuthStore } from '../../stores/userAuth.js'

const blog     = useBlogStore()
const userAuth = useUserAuthStore()

const view       = ref('list')
const showForm   = ref(false)
const filterCat  = ref(null)
const formCat    = ref('news')
const formTitle  = ref('')
const formBody   = ref('')
const submitting = ref(false)

const selectedPost = computed(() => blog.selectedPost)
const catInfo      = computed(() => selectedPost.value ? getCatInfo(selectedPost.value.category) : getCatInfo('other'))

const filteredPosts = computed(() => {
  const all = blog.posts
  if (!filterCat.value) return all
  return all.filter(p => p.category === filterCat.value)
})

const headerStyle = computed(() => {
  const base = 'padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;'
  if (view.value === 'post' && selectedPost.value) {
    const c = catInfo.value.color
    return `background:linear-gradient(135deg,${c}55 0%,${c}99 40%,${c} 100%);${base}`
  }
  return `background:linear-gradient(135deg,#667EEA 0%,#764BA2 100%);${base}`
})

function openPost(post) {
  blog.openPost(post)
  view.value = 'post'
}

function goBack() {
  view.value = 'list'
  blog.closePost()
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

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

onMounted(() => blog.loadPosts())
</script>

<style scoped>
/* ── Floating emoji ── */
.bl-float {
  position: absolute; opacity: 0.25;
  animation: floatY ease-in-out infinite;
}
@keyframes floatY {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

/* ── Header ── */
.bl-header { min-height: 150px; }
.bl-back-btn {
  position: absolute; top: 14px; left: 16px;
  background: rgba(255,255,255,0.2); border: none;
  color: #fff; font-size: 12px; font-weight: 700;
  padding: 5px 12px; border-radius: 12px; cursor: pointer;
}
.bl-back-btn:active { background: rgba(255,255,255,0.35); }

/* ── Write toggle ── */
.bl-write-toggle {
  width: 100%;
  background: linear-gradient(135deg, #818CF8, #6366F1);
  color: #fff; font-size: 13px; font-weight: 800;
  border: none; border-radius: 14px; padding: 12px;
  cursor: pointer; margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  transition: opacity 0.15s;
}
.bl-write-toggle:active { opacity: 0.85; }

/* ── Write form ── */
.bl-form-card {
  background: #fff;
  border: 1.5px solid #E0E7FF; border-radius: 16px;
  padding: 16px; margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(99,102,241,0.1);
}
.bl-form-lbl {
  font-size: 11px; font-weight: 800; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}
.bl-cat-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.bl-cat-pill {
  font-size: 11px; font-weight: 700;
  padding: 5px 12px; border-radius: 20px;
  border: 1.5px solid; cursor: pointer; transition: all 0.12s;
}
.bl-input {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #E5E7EB; border-radius: 10px;
  padding: 10px 12px; font-size: 14px; color: #111827;
  font-family: inherit; outline: none; transition: border-color 0.15s;
}
.bl-input:focus { border-color: #818CF8; }
.bl-textarea {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #E5E7EB; border-radius: 10px;
  padding: 10px 12px; font-size: 13px; color: #374151;
  font-family: inherit; resize: none; outline: none;
  transition: border-color 0.15s; line-height: 1.6;
}
.bl-textarea:focus { border-color: #818CF8; }
.bl-charcount {
  font-size: 10px; color: #9CA3AF; text-align: right;
  margin-top: 3px; margin-bottom: 12px;
}
.bl-submit-btn {
  width: 100%; font-size: 13px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, #818CF8, #6366F1);
  border: none; border-radius: 12px; padding: 11px; cursor: pointer;
  transition: opacity 0.15s; box-shadow: 0 3px 10px rgba(99,102,241,0.3);
}
.bl-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* form transition */
.bl-slide-enter-active, .bl-slide-leave-active {
  transition: all 0.25s ease; max-height: 500px; overflow: hidden;
}
.bl-slide-enter-from, .bl-slide-leave-to {
  opacity: 0; max-height: 0; margin-bottom: 0;
}

/* ── Filter ── */
.bl-filter-row {
  display: flex; flex-wrap: nowrap; overflow-x: auto;
  gap: 6px; padding-bottom: 6px; margin-bottom: 14px;
  scrollbar-width: none;
}
.bl-filter-row::-webkit-scrollbar { display: none; }
.bl-filter-pill {
  font-size: 11px; font-weight: 700;
  padding: 5px 12px; border-radius: 20px; white-space: nowrap;
  border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280;
  cursor: pointer; transition: all 0.12s; flex-shrink: 0;
}
.bl-filter-pill--on {
  background: #6366F1; color: #fff; border-color: #6366F1;
}

/* ── Skeletons ── */
.bl-skeletons { display: flex; flex-direction: column; gap: 10px; }
.bl-skeleton {
  height: 120px; border-radius: 14px;
  background: linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Empty ── */
.bl-empty { text-align: center; padding: 44px 0; }
.bl-empty-ico { font-size: 44px; margin-bottom: 10px; }
.bl-empty-txt { font-size: 14px; font-weight: 800; color: #374151; margin-bottom: 4px; }
.bl-empty-sub { font-size: 12px; color: #9CA3AF; }

/* ── Cards grid ── */
.bl-grid { display: flex; flex-direction: column; gap: 10px; }
.bl-card {
  display: flex; background: #fff;
  border-radius: 16px; border: 1.5px solid #EEF2FF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  overflow: hidden; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.bl-card:active { transform: scale(0.985); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.bl-card-bar { width: 5px; flex-shrink: 0; }
.bl-card-body {
  flex: 1; min-width: 0; padding: 13px 14px 12px;
  display: flex; flex-direction: column; gap: 5px;
}
.bl-card-cat {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px; align-self: flex-start;
}
.bl-card-title {
  font-size: 14px; font-weight: 800; color: #111827; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.bl-card-excerpt {
  font-size: 12px; color: #6B7280; line-height: 1.55; flex: 1;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.bl-card-foot {
  display: flex; align-items: center; justify-content: space-between; margin-top: 2px;
}
.bl-card-author { font-size: 11px; font-weight: 700; color: #374151; }
.bl-card-date   { font-size: 10px; color: #9CA3AF; }

/* ── Full post view ── */
.bl-post-view { padding-bottom: 24px; }
.bl-post-cat {
  display: inline-block; font-size: 11px; font-weight: 700;
  padding: 4px 14px; border-radius: 20px; margin-bottom: 16px;
}
.bl-post-body {
  font-size: 15px; color: #1F2937;
  line-height: 1.9; white-space: pre-wrap; word-break: break-word;
}
</style>
