import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '../services/empathyService.js'
import { useUiStore } from './ui.js'

export const useEmpathyStore = defineStore('empathy', () => {
  const posts = ref([])
  const isLoading = ref(false)
  const lastFetched = ref(null)

  async function loadPosts(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 60000) return
    isLoading.value = true
    try {
      const data = await svc.fetchPosts()
      posts.value = data
      lastFetched.value = Date.now()
    } catch {
      posts.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addPost(payload) {
    const ui = useUiStore()
    const temp = { ...payload, id: 'tmp_' + Date.now(), comments: [], likeCount: 0 }
    posts.value.unshift(temp)
    try {
      const created = await svc.createPost(payload)
      const idx = posts.value.findIndex(p => p.id === temp.id)
      if (idx !== -1) posts.value[idx] = created
      ui.showToast('ส่งคำชื่นชมสำเร็จ! 💝')
    } catch {
      posts.value = posts.value.filter(p => p.id !== temp.id)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function addComment(postId, text, authorName) {
    const ui = useUiStore()
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const temp = { id: 'tmp_cm_' + Date.now(), name: authorName, text, time: 'เมื่อกี้' }
    post.comments.push(temp)
    try {
      const cm = await svc.addComment(postId, text, authorName)
      const idx = post.comments.findIndex(c => c.id === temp.id)
      if (idx !== -1) post.comments[idx] = cm
    } catch {
      post.comments = post.comments.filter(c => c.id !== temp.id)
      ui.showToast('ส่งความคิดเห็นไม่สำเร็จ')
    }
  }

  async function toggleLike(postId) {
    const ui = useUiStore()
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const wasLiked = post._liked
    post._liked = !wasLiked
    post.likeCount = (post.likeCount || 0) + (post._liked ? 1 : -1)
    try {
      await svc.toggleLike(postId, ui.currentUser.id || 'anonymous')
    } catch {
      post._liked = wasLiked
      post.likeCount = (post.likeCount || 0) + (wasLiked ? 1 : -1)
    }
  }

  return { posts, isLoading, loadPosts, addPost, addComment, toggleLike }
})
