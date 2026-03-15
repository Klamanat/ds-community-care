import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '../services/blogService.js'
import { useUiStore } from './ui.js'

export const BLOG_CATEGORIES = [
  { key: 'news',  label: '📢 ข่าวสาร',      color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'tech',  label: '💡 เทคนิค',        color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'exp',   label: '🌟 ประสบการณ์',    color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'event', label: '🎉 กิจกรรม',       color: '#10B981', bg: '#ECFDF5' },
  { key: 'other', label: '💬 อื่นๆ',         color: '#6B7280', bg: '#F9FAFB' },
]

export function getCatInfo(key) {
  return BLOG_CATEGORIES.find(c => c.key === key) || BLOG_CATEGORIES[4]
}

export const useBlogStore = defineStore('blog', () => {
  const posts       = ref([])
  const isLoading   = ref(false)
  const lastFetched = ref(null)
  const selectedPost = ref(null)

  async function loadPosts(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 60000) return
    isLoading.value = true
    try {
      const data = await svc.fetchBlogPosts()
      posts.value = data || []
      lastFetched.value = Date.now()
    } catch {
      posts.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function submitPost(payload) {
    const ui  = useUiStore()
    const tmp = {
      ...payload,
      id: 'tmp_' + Date.now(),
      createdAt: new Date().toISOString(),
    }
    posts.value.unshift(tmp)
    try {
      const created = await svc.submitBlogPost(payload)
      const idx = posts.value.findIndex(p => p.id === tmp.id)
      if (idx !== -1) posts.value[idx] = created
      ui.showToast('โพสต์บล็อกสำเร็จ! 📝')
    } catch {
      posts.value = posts.value.filter(p => p.id !== tmp.id)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  function openPost(post) {
    selectedPost.value = post
  }

  function closePost() {
    selectedPost.value = null
  }

  return { posts, isLoading, selectedPost, loadPosts, submitPost, openPost, closePost }
})
