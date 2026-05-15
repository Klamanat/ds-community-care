<template>
  <div>
    <AdminPageHeader title="📝 Blog Posts" sub="จัดการบล็อก">
      <button class="al-btn al-btn-primary" @click="load(true)">🔄 รีเฟรช</button>
    </AdminPageHeader>

    <main class="al-main">
      <div class="al-body">
        <div class="al-card">
          <div class="al-card-header">
            <span class="al-card-title">บล็อกทั้งหมด</span>
            <span class="al-badge al-badge-blue">{{ posts.length }} โพสต์</span>
          </div>

          <div v-if="loading" class="al-loading-skeletons">
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
          </div>
          <EmptyState v-else-if="!posts.length" title="ยังไม่มีโพสต์" sub="บล็อกจะแสดงที่นี่" />

          <div v-else>
            <div
              v-for="post in posts"
              :key="post.id"
              class="al-item fade-in"
              @click="handleRippleClick"
            >
              <div class="al-item-avatar">{{ getCatInfo(post.category).icon || '📝' }}</div>
              <div class="al-item-body">
                <div class="al-item-title">{{ post.title }}</div>
                <div class="al-item-sub">{{ getCatInfo(post.category).label }} · {{ post.authorName || '—' }}</div>
                <div class="al-item-meta">
                  <span class="al-badge al-badge-blue">{{ formatDate(post.createdAt) }}</span>
                </div>
              </div>
              <div class="al-item-actions" @click.stop>
                <button
                  class="al-btn al-btn-delete"
                  :disabled="deletingId === post.id"
                  @click="deletePost(post)"
                >{{ deletingId === post.id ? '⏳' : '🗑️ ลบ' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminPageHeader from './AdminPageHeader.vue'
import SkeletonCard from '../../shared/components/SkeletonCard.vue'
import EmptyState from '../../shared/components/EmptyState.vue'
import { useRipple } from '../../core/composables/useRipple.js'
import { useFadeIn } from '../../core/composables/useFadeIn.js'
import { adminGetBlogPosts, adminDeleteBlogPost } from '../../features/blog/blogService.js'
import { getCatInfo } from '../../features/blog/blog.store.js'

const { handleRippleClick } = useRipple()
useFadeIn('.fade-in')
const posts     = ref([])
const loading   = ref(true)
const deletingId = ref(null)

async function load(force = false) {
  loading.value = true
  posts.value = await adminGetBlogPosts(force)
  loading.value = false
}

async function deletePost(post) {
  if (!confirm(`ลบโพสต์ "${post.title}"?`)) return
  deletingId.value = post.id
  await adminDeleteBlogPost(post.id)
  posts.value = posts.value.filter(p => p.id !== post.id)
  deletingId.value = null
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

onMounted(() => load())
</script>

<style scoped>
@import './admin.css';
</style>