import { gasGet } from './api.js'

export async function fetchPosts() {
  const r = await gasGet('getEmpathyPosts')
  return r.data
}

export async function createPost(p) {
  // Never pass base64 data URLs in the query string — they exceed GAS URL limits
  const rawImg = p.recImgUrl || ''
  const safeImg = rawImg.startsWith('data:') ? '' : rawImg.slice(0, 300)

  const r = await gasGet('addEmpathyPost', {
    recEmployeeId: p.recEmployeeId || '',
    recName: p.recName,
    recRole: p.recRole,
    recImgUrl: safeImg,
    sndName: p.sndName,
    msg: p.msg.slice(0, 500),
    tag: p.tag
  })
  return r.data
}

export async function addComment(postId, text, authorName) {
  const r = await gasGet('addComment', { postId, text: text.slice(0, 500), authorName })
  return r.data
}

export async function toggleLike(postId, userKey) {
  const r = await gasGet('toggleLike', { postId, userKey: userKey || 'anonymous' })
  return r.data
}
