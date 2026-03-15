<template>
  <div>
    <!-- Write toggle -->
    <button class="bl-write-toggle" @click="blogShowForm = !blogShowForm">
      {{ blogShowForm ? '✕ ปิดฟอร์ม' : '✏️ เขียนโพสต์ใหม่' }}
    </button>

    <!-- Write form -->
    <transition name="bl-slide">
      <div v-if="blogShowForm" class="bl-form-card">
        <div class="bl-form-lbl">หมวดหมู่</div>
        <div class="bl-cat-pills">
          <button
            v-for="cat in BLOG_CATEGORIES" :key="cat.key"
            class="bl-cat-pill"
            :class="blogFormCat === cat.key ? 'bl-cat-pill--on' : ''"
            :style="blogFormCat === cat.key
              ? { background: cat.color, color: '#fff', borderColor: cat.color }
              : { borderColor: cat.color, color: cat.color, background: cat.bg }"
            @click="blogFormCat = cat.key"
          >{{ cat.label }}</button>
        </div>
        <div class="bl-form-lbl" style="margin-top:14px;">หัวข้อ</div>
        <input v-model="blogFormTitle" class="bl-input" placeholder="หัวข้อบทความ..." maxlength="120" />
        <div class="bl-form-lbl" style="margin-top:12px;">เนื้อหา</div>
        <textarea
          v-model="blogFormBody"
          class="bl-textarea"
          placeholder="เล่าเรื่องราว ความรู้ หรือประสบการณ์..."
          rows="5"
          maxlength="1000"
        ></textarea>
        <div class="bl-charcount">{{ blogFormBody.length }}/1000</div>
        <button
          class="bl-submit-btn"
          :disabled="!blogFormTitle.trim() || !blogFormBody.trim() || blogSubmitting"
          @click="submitBlogPost"
        >
          {{ blogSubmitting ? '⏳ กำลังโพสต์...' : '📤 โพสต์บทความ' }}
        </button>
      </div>
    </transition>

    <!-- Filter pills -->
    <div class="bl-filter-row">
      <button
        class="bl-filter-pill"
        :class="blogFilterCat === null ? 'bl-filter-pill--on' : ''"
        @click="blogFilterCat = null"
      >ทั้งหมด</button>
      <button
        v-for="cat in BLOG_CATEGORIES" :key="cat.key"
        class="bl-filter-pill"
        :class="blogFilterCat === cat.key ? 'bl-filter-pill--on' : ''"
        :style="blogFilterCat === cat.key ? { background: cat.color, color: '#fff', borderColor: cat.color } : {}"
        @click="blogFilterCat = blogFilterCat === cat.key ? null : cat.key"
      >{{ cat.label }}</button>
    </div>

    <!-- Loading -->
    <div v-if="blog.isLoading" class="bl-skeletons">
      <div v-for="i in 3" :key="i" class="bl-skeleton"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredPosts.length" class="tr-section-empty">
      ยังไม่มีโพสต์{{ blogFilterCat ? 'ในหมวดนี้' : '' }} — กด "เขียนโพสต์ใหม่" เพื่อเริ่มเลย!
    </div>

    <!-- Cards -->
    <div v-else class="bl-grid">
      <div
        v-for="post in visiblePosts" :key="post.id"
        class="bl-card"
        @click="$emit('open-post', post)"
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

      <!-- Load more -->
      <button v-if="hasMore" class="bl-load-more" @click="pageSize += PAGE_STEP">
        ดูเพิ่มเติม ({{ filteredPosts.length - visiblePosts.length }} โพสต์)
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBlogStore, BLOG_CATEGORIES, getCatInfo } from '../../../stores/blog.js'
import { useUserAuthStore }                          from '../../../stores/userAuth.js'

defineEmits(['open-post'])

const blog     = useBlogStore()
const userAuth = useUserAuthStore()

const blogShowForm   = ref(false)
const blogFormCat    = ref('news')
const blogFormTitle  = ref('')
const blogFormBody   = ref('')
const blogSubmitting = ref(false)
const blogFilterCat  = ref(null)

const PAGE_SIZE = 5
const PAGE_STEP = 5
const pageSize  = ref(PAGE_SIZE)

// Reset page when filter changes
watch(blogFilterCat, () => { pageSize.value = PAGE_SIZE })

const filteredPosts = computed(() => {
  const all = blog.posts  // already sorted newest-first by GAS
  if (!blogFilterCat.value) return all
  return all.filter(p => p.category === blogFilterCat.value)
})

const visiblePosts = computed(() => filteredPosts.value.slice(0, pageSize.value))
const hasMore      = computed(() => filteredPosts.value.length > pageSize.value)

async function submitBlogPost() {
  if (!blogFormTitle.value.trim() || !blogFormBody.value.trim() || blogSubmitting.value) return
  blogSubmitting.value = true
  await blog.submitPost({
    title:      blogFormTitle.value.trim(),
    body:       blogFormBody.value.trim(),
    category:   blogFormCat.value,
    authorName: userAuth.userName || 'ไม่ระบุชื่อ',
    authorId:   userAuth.empCode || userAuth.userName || 'unknown',
  })
  blogSubmitting.value = false
  blogShowForm.value   = false
  blogFormTitle.value  = ''
  blogFormBody.value   = ''
  blogFormCat.value    = 'news'
  pageSize.value       = PAGE_SIZE  // scroll back to top of list
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}
</script>

<style scoped>
@import './training.css';
</style>
