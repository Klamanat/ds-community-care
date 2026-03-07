import { gasGet } from './api.js'

export async function fetchPosts() {
  const r = await gasGet('getEmpathyPosts')
  return r.data
}

export async function createPost(p) {
  const rawImg  = p.recImgUrl || ''
  const safeImg = rawImg.startsWith('data:') ? '' : rawImg.slice(0, 300)
  const r = await gasGet('addEmpathyPost', {
    recEmployeeId: p.recEmployeeId || '',
    recName:  p.recName,
    recRole:  p.recRole,
    recImgUrl: safeImg,
    sndName:  p.sndName,
    msg:      p.msg.slice(0, 500),
    tag:      p.tag
  })
  return r.data
}

// Find existing post for this person, or create a shell post — atomic on GAS side
export async function ensurePost(p) {
  const rawImg  = p.recImgUrl || ''
  const safeImg = rawImg.startsWith('data:') ? '' : rawImg.slice(0, 300)
  const r = await gasGet('ensurePost', {
    recEmployeeId: p.recEmployeeId || '',
    recName:  p.recName,
    recRole:  p.recRole  || '',
    recImgUrl: safeImg,
    sndName:  p.sndName  || 'ทีม'
  })
  return r.data   // { id, recName, recRole, recImg, isNew }
}

export async function fetchComments(postId) {
  const r = await gasGet('getEmpathyComments', { postId })
  return r.data   // [{ id, postId, parentId, name, text, time }]
}

export async function addComment(postId, text, authorName, parentId = '') {
  const r = await gasGet('addComment', {
    postId,
    text:       text.slice(0, 500),
    authorName,
    parentId:   parentId || ''
  })
  return r.data
}

export async function toggleLike(postId, userKey) {
  const r = await gasGet('toggleLike', { postId, userKey: userKey || 'anonymous' })
  return r.data
}
