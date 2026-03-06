import { gasGet } from './api.js'

export async function fetchPosts() {
  const r = await gasGet('getEmpathyPosts')
  return r.data
}

export async function createPost(p) {
  const r = await gasGet('addEmpathyPost', {
    recEmployeeId: p.recEmployeeId || '',
    recName: p.recName,
    recRole: p.recRole,
    recImgUrl: p.recImgUrl || '',
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
