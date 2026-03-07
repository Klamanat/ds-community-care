import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/empathyService.js'
import { useUiStore } from './ui.js'

export const useEmpathyStore = defineStore('empathy', () => {
  const posts      = ref([])
  const isLoading  = ref(false)
  const lastFetched = ref(null)

  // Flat comment arrays keyed by postId — component does the nesting
  const postComments = reactive({})

  // ── loadPosts ──────────────────────────────────────────────────
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

  // ── addPost (kept for backward compat) ─────────────────────────
  async function addPost(payload) {
    const ui  = useUiStore()
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

  // ── ensurePost — find or create shell post, return postId ──────
  async function ensurePost(member, sndName) {
    const ui = useUiStore()

    // Check local cache first
    const local = posts.value.find(p =>
      (member.id && p.recEmployeeId === String(member.id)) ||
      p.recName === member.name
    )
    if (local) return local.id

    // Call GAS
    const result = await svc.ensurePost({
      recEmployeeId: member.id  || '',
      recName:  member.name,
      recRole:  member.role  || '',
      recImgUrl: member.imgUrl || '',
      sndName:  sndName || ui.currentUser?.name || 'ทีม'
    })

    if (result.isNew) {
      posts.value.unshift({
        id:            result.id,
        recEmployeeId: String(member.id || ''),
        recName:       result.recName,
        recRole:       result.recRole,
        recImg:        result.recImg,
        sndName:       sndName || ui.currentUser?.name,
        msg: '', tag: '', likeCount: 0, comments: [], react: '💝', createdAt: '', _liked: false
      })
    }
    return result.id
  }

  // ── loadComments — fetch and cache comments for one post ───────
  async function loadComments(postId, force = false) {
    if (!force && postComments[postId]) return
    try {
      const data = await svc.fetchComments(postId)
      postComments[postId] = data || []
    } catch {
      if (!postComments[postId]) postComments[postId] = []
    }
  }

  // ── addComment — supports parentId for replies ─────────────────
  async function addComment(postId, text, authorName, parentId = '') {
    const ui = useUiStore()
    if (!postComments[postId]) postComments[postId] = []

    const temp = { id: 'tmp_cm_' + Date.now(), postId, parentId: parentId || '', name: authorName, text, time: 'เมื่อกี้' }
    postComments[postId].push(temp)

    // Keep legacy post.comments in sync
    const post = posts.value.find(p => p.id === postId)
    if (post) post.comments = postComments[postId]

    try {
      const cm = await svc.addComment(postId, text, authorName, parentId)
      const idx = postComments[postId].findIndex(c => c.id === temp.id)
      if (idx !== -1) postComments[postId].splice(idx, 1, cm)
      if (post) post.comments = postComments[postId]
    } catch {
      postComments[postId] = postComments[postId].filter(c => c.id !== temp.id)
      if (post) post.comments = postComments[postId]
      ui.showToast('ส่งความคิดเห็นไม่สำเร็จ')
    }
  }

  // ── toggleLike ─────────────────────────────────────────────────
  async function toggleLike(postId) {
    const ui  = useUiStore()
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const wasLiked = post._liked
    post._liked  = !wasLiked
    post.likeCount = (post.likeCount || 0) + (post._liked ? 1 : -1)
    try {
      await svc.toggleLike(postId, ui.currentUser?.id || 'anonymous')
    } catch {
      post._liked  = wasLiked
      post.likeCount = (post.likeCount || 0) + (wasLiked ? 1 : -1)
    }
  }

  return { posts, isLoading, postComments, loadPosts, addPost, ensurePost, loadComments, addComment, toggleLike }
})
