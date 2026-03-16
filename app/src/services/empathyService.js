import { gasGet, gasPost } from './api.js'

export async function fetchPeople() {
  const r = await gasGet('getEmpathyPeople')
  return r.data   // [{ id, name, role, imgUrl, commentCount }]
}

export async function fetchPosts(userKey = '') {
  const params = {}
  if (userKey) params.userKey = userKey
  const r = await gasGet('getEmpathyPosts', params)
  return r.data
}

export async function createPost(p) {
  const rawImg  = p.recImgUrl || ''
  const safeImg = rawImg.startsWith('data:') ? '' : rawImg.slice(0, 300)
  const r = await gasGet('addEmpathyPost', {
    recEmployeeId: p.recEmpCode || p.recEmployeeId || '',
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
    recEmployeeId: p.recEmpCode || p.recEmployeeId || '',
    recName:  p.recName,
    recRole:  p.recRole  || '',
    recImgUrl: safeImg,
    sndName:  p.sndName  || 'ทีม'
  })
  return r.data   // { id, recName, recRole, recImg, isNew }
}

export async function fetchComments(postId, userKey = '') {
  const params = { postId }
  if (userKey) params.userKey = userKey
  const r = await gasGet('getEmpathyComments', params)
  return r.data   // [{ id, postId, parentId, name, text, time, likeCount, _liked? }]
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

export async function toggleCommentLike(commentId, userKey) {
  const r = await gasGet('toggleCommentLike', { commentId, userKey: userKey || 'anonymous' })
  return r.data   // { commentId, liked, likeCount }
}

export async function toggleChannelLike(channelId, userKey) {
  const r = await gasGet('toggleChannelLike', { channelId, userKey: userKey || 'anonymous' })
  return r.data   // { channelId, liked, likeCount }
}

export async function fetchChannelLike(channelId, userKey) {
  const r = await gasGet('getChannelLike', { channelId, userKey: userKey || 'anonymous' })
  return r.data   // { channelId, liked, likeCount }
}

export async function uploadEmpathyPhoto(base64, fileName) {
  const r = await gasPost('uploadImage', {
    base64,
    folderType: 'empathy',
    fileName: fileName || ('empathy_' + Date.now() + '.jpg'),
  })
  return r.data   // { url, id }
}

export async function setEmpathyPhoto(empCode, imgUrl) {
  const r = await gasGet('setEmpathyPhoto', { empCode, imgUrl })
  return r.data
}
