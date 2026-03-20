import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/empathyService.js'
import { fetchImages, getCached } from '../services/imageService.js'
import { useUiStore } from './ui.js'
import { useUserAuthStore } from './userAuth.js'
import { lsGet, lsSet, lsDel, stripBase64 } from '../utils/cache.js'

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
  const posts             = ref(lsGet('empathy_posts') || [])
  const isLoading         = ref(false)
  const lastFetched       = ref(null)
  const lastPeopleFetched = ref(null)

  // Flat comment arrays keyed by channelId — component does the nesting
  const postComments = reactive({})

  // Person-level likes in EmpathyModal thread view
  const channelLikes = reactive({})   // { [channelId]: { count: number, liked: boolean } }

  const praisedPeople = ref(lsGet('empathy_people') || [])

  // ── Hydrate channel likes from localStorage on init ─────────────
  const _init = _loadStored()
  if (_init.channels) Object.assign(channelLikes, _init.channels)

  // ── loadPosts — for EmpathyBoard (legacy cards) ───────────────
  async function loadPosts(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 30000) return // 30s
    isLoading.value = !posts.value.length
    const userKey = useUserAuthStore().userId || ''
    try {
      const data = await svc.fetchPosts(userKey)
      // Apply cached images immediately before lazy-fetch
      posts.value = data.map(p => p.recImgId ? { ...p, recImg: getCached(p.recImgId) || p.recImg || '' } : p)
      lastFetched.value = Date.now()
      lsSet('empathy_posts', stripBase64(data, 'recImg', 'imgUrl'), 60 * 1000)
      // Lazy-fetch Drive images after page renders
      const ids = [...new Set(data.map(p => p.recImgId).filter(Boolean))]
      if (ids.length) fetchImages(ids).then(map => {
        posts.value = posts.value.map(p => (p.recImgId && map[p.recImgId]) ? { ...p, recImg: map[p.recImgId] } : p)
      }).catch(() => {})
    } catch {} finally {
      isLoading.value = false
    }
  }

  // ── loadPeople — for EmpathyModal grid (from EmpathyComments) ─
  async function loadPeople(force = false) {
    if (!force && lastPeopleFetched.value && (Date.now() - lastPeopleFetched.value) < 60000) return
    try {
      const data = await svc.fetchPeople()
      if (!data?.length) return
      // Build merged items first, then dedup sessionOnly using the SAME id format
      // Deduplicate by empCode → name — one card per person
      const seenKey = new Set()
      const merged = []
      data.forEach(p => {
        const key = String(p.empCode || p.name || p.id).trim()
        if (seenKey.has(key)) return
        seenKey.add(key)
        merged.push({
          id:           String(p.id),
          empCode:      String(p.empCode || ''),
          name:         p.name,
          role:         p.role,
          imgUrl:       p.imgUrl || getCached(p.imgId) || '',
          imgId:        p.imgId  || '',
          commentCount: p.commentCount || 0,
        })
      })
      const serverIds = new Set(merged.map(p => String(p.id)))
      const serverKeys = new Set(merged.map(p => String(p.empCode || p.name).trim()))
      const sessionOnly = praisedPeople.value.filter(p => {
        if (serverIds.has(String(p.id))) return false
        if (serverKeys.has(String(p.empCode || p.name).trim())) return false
        return true
      })
      praisedPeople.value = [...merged, ...sessionOnly]
      lastPeopleFetched.value = Date.now()
      lsSet('empathy_people', stripBase64(merged, 'imgUrl'), 10 * 60 * 1000)
      // Fetch channel like counts — use empCode as key (matches selectPerson channelId)
      const userKey = useUserAuthStore().userId || ''
      const channelKeys = merged.map(p => p.empCode || p.id).filter(Boolean)
      if (channelKeys.length) svc.fetchChannelLikeCounts(channelKeys, userKey).then(map => {
        Object.entries(map).forEach(([k, val]) => { channelLikes[k] = val })
      }).catch(() => {})
      // Lazy-fetch Drive images after page renders
      const ids = [...new Set(merged.map(p => p.imgId).filter(Boolean))]
      if (ids.length) fetchImages(ids).then(map => {
        praisedPeople.value = praisedPeople.value.map(p => {
          if (!p.imgId || !map[p.imgId]) return p
          if (p.imgUrl) return p  // already has URL (e.g. Supabase Storage) — don't overwrite
          return { ...p, imgUrl: map[p.imgId] }
        })
      }).catch(() => {})
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
  async function loadComments(channelId) {
    const userKey = useUserAuthStore().userId || ''
    function sortByTime(arr) {
      return arr.slice().sort((a, b) => {
        const ta = a.time === 'เมื่อกี้' ? Infinity : (Date.parse(String(a.time || '').replace(' ', 'T')) || 0)
        const tb = b.time === 'เมื่อกี้' ? Infinity : (Date.parse(String(b.time || '').replace(' ', 'T')) || 0)
        return ta - tb
      })
    }
    // Hydrate from localStorage immediately (shows comments without waiting for GAS)
    if (!postComments[channelId]) {
      const cached = lsGet('dsc_cm_' + channelId)
      if (cached?.length) {
        postComments[channelId] = sortByTime(cached)
        _applyCommentLikes(postComments[channelId])
      }
    }
    // Skip GAS if already loaded in this session
    if (postComments[channelId]?.length > 0) return
    try {
      const arr = await svc.fetchComments(channelId, userKey)
      _applyCommentLikes(arr)
      arr.forEach(cm => {
        if (cm._liked !== undefined)
          _saveCommentLike(cm.id, { liked: !!cm._liked, count: cm.likeCount || 0 })
      })
      postComments[channelId] = sortByTime(arr)
      lsSet('dsc_cm_' + channelId, arr.map(c => ({ ...c, _liked: undefined })), 2 * 60 * 1000)
    } catch {
      if (!postComments[channelId]) postComments[channelId] = []
      _applyCommentLikes(postComments[channelId])
    }
  }

  // ── loadChannelLike — fetch channel like state from GAS when opening thread ─
  async function loadChannelLike(channelId) {
    const userKey = useUserAuthStore().userId || ''
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
    lsDel('empathy_people') // commentCount เปลี่ยน
    lastPeopleFetched.value = null // force re-fetch on next loadPeople

    // Optimistic: increment commentCount immediately in praisedPeople
    const person = praisedPeople.value.find(p =>
      String(p.id) === String(channelId) || String(p.empCode) === String(channelId)
    )
    if (person) person.commentCount = (person.commentCount || 0) + 1

    try {
      const cm = await svc.addComment(channelId, text, authorName, parentId)
      const idx = postComments[channelId].findIndex(c => c.id === temp.id)
      if (idx !== -1) postComments[channelId].splice(idx, 1, { ...cm, likeCount: 0, _liked: false })
      lsDel('dsc_cm_' + channelId)
    } catch {
      postComments[channelId] = postComments[channelId].filter(c => c.id !== temp.id)
      if (person) person.commentCount = Math.max(0, (person.commentCount || 0) - 1)
      ui.showToast('ส่งความคิดเห็นไม่สำเร็จ')
    }
  }

  // ── toggleCommentLike — EmpathyModal thread comments ──────────
  async function toggleCommentLike(channelId, commentId) {
    const comments = postComments[channelId]
    if (!comments) return
    const cm = comments.find(c => c.id === commentId)
    if (!cm) return

    // Optimistic
    cm._liked    = !cm._liked
    cm.likeCount = (cm.likeCount || 0) + (cm._liked ? 1 : -1)
    _saveCommentLike(commentId, { liked: cm._liked, count: cm.likeCount })

    try {
      const result = await svc.toggleCommentLike(commentId, useUserAuthStore().userId || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        cm._liked    = result.liked
        cm.likeCount = result.likeCount
        _saveCommentLike(commentId, { liked: result.liked, count: result.likeCount })
      }
    } catch { /* keep optimistic */ }
  }

  // ── toggleChannelLike — person-level like in EmpathyModal ─────
  async function toggleChannelLike(channelId) {
    if (!channelLikes[channelId]) channelLikes[channelId] = { count: 0, liked: false }
    const s = channelLikes[channelId]

    // Optimistic
    s.liked = !s.liked
    s.count += s.liked ? 1 : -1
    _saveChannelLike(channelId, { liked: s.liked, count: s.count })

    try {
      const result = await svc.toggleChannelLike(channelId, useUserAuthStore().userId || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        s.liked = result.liked
        s.count = result.likeCount
        _saveChannelLike(channelId, { liked: result.liked, count: result.likeCount })
      }
    } catch { /* keep optimistic */ }
  }

  // ── togglePostCommentLike — EmpDetailModal comments ───────────
  async function togglePostCommentLike(postId, commentId) {
    const post = posts.value.find(p => p.id === postId)
    if (!post?.comments) return
    const cm = post.comments.find(c => c.id === commentId)
    if (!cm) return

    // Optimistic
    cm._liked    = !cm._liked
    cm.likeCount = (cm.likeCount || 0) + (cm._liked ? 1 : -1)
    _saveCommentLike(commentId, { liked: cm._liked, count: cm.likeCount })

    try {
      const result = await svc.toggleCommentLike(commentId, useUserAuthStore().userId || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        cm._liked    = result.liked
        cm.likeCount = result.likeCount
        _saveCommentLike(commentId, { liked: result.liked, count: result.likeCount })
      }
    } catch { /* keep optimistic */ }
  }

  // ── toggleLike — post-level like (EmpathyBoard/EmpDetailModal) ─
  async function toggleLike(postId) {
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const wasLiked = post._liked
    post._liked    = !wasLiked
    post.likeCount = (post.likeCount || 0) + (post._liked ? 1 : -1)
    lsDel('empathy_posts') // invalidate — likeCount เปลี่ยนทันที
    try {
      const result = await svc.toggleLike(postId, useUserAuthStore().userId || 'anonymous')
      if (result && typeof result.likeCount === 'number') {
        post.likeCount = result.likeCount
        post._liked    = result.liked
      }
    } catch {
      post._liked    = wasLiked
      post.likeCount = (post.likeCount || 0) + (wasLiked ? 1 : -1)
    }
  }

  // ── updatePersonImg — update a person's imgUrl in praisedPeople ─
  function updatePersonImg(id, imgUrl) {
    const p = praisedPeople.value.find(p =>
      String(p.id) === String(id) || String(p.empCode) === String(id)
    )
    if (p) p.imgUrl = imgUrl
  }

  // ── addPost (legacy — kept for EmpathyBoard backward compat) ───
  async function addPost(payload) {
    const ui   = useUiStore()
    const temp = { ...payload, id: 'tmp_' + Date.now(), comments: [], likeCount: 0 }
    posts.value.unshift(temp)
    lsDel('empathy_posts')
    lsDel('empathy_people')
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

  // ── editComment ────────────────────────────────────────────────
  async function editComment(channelId, commentId, newText) {
    const comments = postComments[channelId]
    if (!comments) return
    const cm = comments.find(c => c.id === commentId)
    if (!cm) return
    const oldText = cm.text
    cm.text = newText          // optimistic
    lsDel('dsc_cm_' + channelId)
    try {
      await svc.updateComment(commentId, newText)
    } catch {
      cm.text = oldText        // revert
      useUiStore().showToast('แก้ไขไม่สำเร็จ')
    }
  }

  // ── removeComment ──────────────────────────────────────────────
  async function removeComment(channelId, commentId) {
    const comments = postComments[channelId]
    if (!comments) return
    const idx = comments.findIndex(c => c.id === commentId)
    if (idx === -1) return
    const removed = comments.splice(idx, 1)[0]
    lsDel('dsc_cm_' + channelId)
    // decrement commentCount on praisedPeople
    const person = praisedPeople.find(p => p.empCode === channelId || p.id === channelId)
    if (person) person.commentCount = Math.max(0, (person.commentCount || 1) - 1)
    try {
      await svc.deleteComment(commentId)
    } catch {
      comments.splice(idx, 0, removed)   // revert
      if (person) person.commentCount = (person.commentCount || 0) + 1
      useUiStore().showToast('ลบไม่สำเร็จ')
    }
  }

  return {
    posts, isLoading, postComments, praisedPeople, channelLikes,
    loadPosts, loadPeople, addPost, recordPraise, loadComments, loadChannelLike, addComment,
    toggleLike, toggleCommentLike, toggleChannelLike, togglePostCommentLike, updatePersonImg,
    editComment, removeComment,
  }
})
