import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/empathyService.js'
import { useUiStore } from './ui.js'

// ── localStorage helpers ─────────────────────────────────────────────
const LIKES_KEY = 'ds_emp_likes'

function _loadStored() {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}') } catch { return {} }
}
function _saveStored(data) {
  try { localStorage.setItem(LIKES_KEY, JSON.stringify(data)) } catch {}
}
function _saveChannelLike(channelId, state) {
  const s = _loadStored()
  s.channels = s.channels || {}
  s.channels[channelId] = state
  _saveStored(s)
}
function _saveCommentLike(commentId, state) {
  const s = _loadStored()
  s.comments = s.comments || {}
  s.comments[commentId] = state
  _saveStored(s)
}
// Apply stored comment likes only where GAS didn't already set _liked
function _applyCommentLikes(comments) {
  const stored = _loadStored().comments || {}
  comments.forEach(cm => {
    if (cm._liked === undefined && stored[cm.id]) {
      cm._liked    = stored[cm.id].liked
      cm.likeCount = stored[cm.id].count
    }
  })
}

export const useEmpathyStore = defineStore('empathy', () => {
  const posts        = ref([])
  const isLoading    = ref(false)
  const lastFetched  = ref(null)

  // Flat comment arrays keyed by channelId — component does the nesting
  const postComments = reactive({})

  // Person-level likes in EmpathyModal thread view
  const channelLikes = reactive({})   // { [channelId]: { count: number, liked: boolean } }

  // People who have been praised (populated from posts + session activity)
  const praisedPeople = ref([])

  // ── Hydrate channel likes from localStorage on init ─────────────
  const _init = _loadStored()
  if (_init.channels) Object.assign(channelLikes, _init.channels)

  // ── loadPosts — for EmpathyBoard (legacy cards) ───────────────
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

  // ── loadPeople — for EmpathyModal grid (from EmpathyComments) ─
  async function loadPeople(force = false) {
    try {
      const data = await svc.fetchPeople()
      if (!data?.length) return
      const serverIds = new Set(data.map(p => String(p.id)))
      const sessionOnly = praisedPeople.value.filter(p => !serverIds.has(String(p.id)))
      praisedPeople.value = [
        ...data.map(p => ({
          id:           String(p.empCode || p.id),
          empCode:      String(p.empCode || ''),
          name:         p.name,
          role:         p.role,
          imgUrl:       p.imgUrl || '',
          commentCount: p.commentCount || 0,
        })),
        ...sessionOnly,
      ]
    } catch { }
  }

  // ── recordPraise — add/update session praise list (no GAS call) ─
  function recordPraise(member, channelId) {
    const uid = channelId || String(member.empCode || member.id || member.name).trim()
    const existing = praisedPeople.value.find(p => String(p.id).trim() === uid)
    if (existing) {
      existing.commentCount = (existing.commentCount || 0) + 1
    } else {
      praisedPeople.value.unshift({
        id:           uid,
        empCode:      member.empCode || '',
        name:         member.name,
        role:         member.role,
        imgUrl:       member.imgUrl || '',
        commentCount: 1,
      })
    }
  }

  // ── loadComments — fetch with userKey so GAS returns _liked per comment ─
  async function loadComments(channelId, force = false) {
    const ui      = useUiStore()
    const userKey = ui.currentUser?.id || ''
    if (!force && postComments[channelId]?.length > 0) return
    try {
      const arr = await svc.fetchComments(channelId, userKey)
      // Apply localStorage for comments GAS didn't return _liked for (no userKey)
      _applyCommentLikes(arr)
      // Sync GAS-confirmed likes back to localStorage
      arr.forEach(cm => {
        if (cm._liked !== undefined)
          _saveCommentLike(cm.id, { liked: !!cm._liked, count: cm.likeCount || 0 })
      })
      postComments[channelId] = arr
    } catch {
      if (!postComments[channelId]) postComments[channelId] = []
      _applyCommentLikes(postComments[channelId])
    }
  }

  // ── loadChannelLike — fetch channel like state from GAS when opening thread ─
  async function loadChannelLike(channelId) {
    const ui      = useUiStore()
    const userKey = ui.currentUser?.id || ''
    try {
      const result = await svc.fetchChannelLike(channelId, userKey)
      if (result) {
        channelLikes[channelId] = { count: result.likeCount, liked: !!result.liked }
        _saveChannelLike(channelId, { count: result.likeCount, liked: !!result.liked })
      }
    } catch { /* keep localStorage state */ }
  }

  // ── addComment — supports parentId for replies ─────────────────
  async function addComment(channelId, text, authorName, parentId = '') {
    const ui = useUiStore()
    if (!postComments[channelId]) postComments[channelId] = []

    const temp = { id: 'tmp_cm_' + Date.now(), postId: channelId, parentId: parentId || '', name: authorName, text, time: 'เมื่อกี้', likeCount: 0, _liked: false }
    postComments[channelId].push(temp)

    try {
      const cm = await svc.addComment(channelId, text, authorName, parentId)
      const idx = postComments[channelId].findIndex(c => c.id === temp.id)
      if (idx !== -1) postComments[channelId].splice(idx, 1, { ...cm, likeCount: 0, _liked: false })
    } catch {
      postComments[channelId] = postComments[channelId].filter(c => c.id !== temp.id)
      ui.showToast('ส่งความคิดเห็นไม่สำเร็จ')
    }
  }

  // ── toggleCommentLike — EmpathyModal thread comments ──────────
  async function toggleCommentLike(channelId, commentId) {
    const ui = useUiStore()
    const comments = postComments[channelId]
    if (!comments) return
    const cm = comments.find(c => c.id === commentId)
    if (!cm) return

    // Optimistic
    cm._liked    = !cm._liked
    cm.likeCount = (cm.likeCount || 0) + (cm._liked ? 1 : -1)
    _saveCommentLike(commentId, { liked: cm._liked, count: cm.likeCount })

    try {
      const result = await svc.toggleCommentLike(commentId, ui.currentUser?.id || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        cm._liked    = result.liked
        cm.likeCount = result.likeCount
        _saveCommentLike(commentId, { liked: result.liked, count: result.likeCount })
      }
    } catch { /* keep optimistic */ }
  }

  // ── toggleChannelLike — person-level like in EmpathyModal ─────
  async function toggleChannelLike(channelId) {
    const ui = useUiStore()
    if (!channelLikes[channelId]) channelLikes[channelId] = { count: 0, liked: false }
    const s = channelLikes[channelId]

    // Optimistic
    s.liked = !s.liked
    s.count += s.liked ? 1 : -1
    _saveChannelLike(channelId, { liked: s.liked, count: s.count })

    try {
      const result = await svc.toggleChannelLike(channelId, ui.currentUser?.id || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        s.liked = result.liked
        s.count = result.likeCount
        _saveChannelLike(channelId, { liked: result.liked, count: result.likeCount })
      }
    } catch { /* keep optimistic */ }
  }

  // ── togglePostCommentLike — EmpDetailModal comments ───────────
  async function togglePostCommentLike(postId, commentId) {
    const ui = useUiStore()
    const post = posts.value.find(p => p.id === postId)
    if (!post?.comments) return
    const cm = post.comments.find(c => c.id === commentId)
    if (!cm) return

    // Optimistic
    cm._liked    = !cm._liked
    cm.likeCount = (cm.likeCount || 0) + (cm._liked ? 1 : -1)
    _saveCommentLike(commentId, { liked: cm._liked, count: cm.likeCount })

    try {
      const result = await svc.toggleCommentLike(commentId, ui.currentUser?.id || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        cm._liked    = result.liked
        cm.likeCount = result.likeCount
        _saveCommentLike(commentId, { liked: result.liked, count: result.likeCount })
      }
    } catch { /* keep optimistic */ }
  }

  // ── toggleLike — post-level like (EmpathyBoard/EmpDetailModal) ─
  async function toggleLike(postId) {
    const ui   = useUiStore()
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const wasLiked = post._liked
    post._liked    = !wasLiked
    post.likeCount = (post.likeCount || 0) + (post._liked ? 1 : -1)
    try {
      const result = await svc.toggleLike(postId, ui.currentUser?.id || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        post.likeCount = result.likeCount
        post._liked    = result.liked
      }
    } catch {
      post._liked    = wasLiked
      post.likeCount = (post.likeCount || 0) + (wasLiked ? 1 : -1)
    }
  }

  // ── addPost (legacy — kept for EmpathyBoard backward compat) ───
  async function addPost(payload) {
    const ui   = useUiStore()
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

  return {
    posts, isLoading, postComments, praisedPeople, channelLikes,
    loadPosts, loadPeople, addPost, recordPraise, loadComments, loadChannelLike, addComment,
    toggleLike, toggleCommentLike, toggleChannelLike, togglePostCommentLike,
  }
})
