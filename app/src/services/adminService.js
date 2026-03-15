import { gasGet, gasPost } from './api.js'

// Upload employee profile image to Google Drive (overwrites old file if exists)
// Returns { url, id }
export async function uploadProfileImage(employeeId, base64, fileName) {
  const r = await gasPost('adminUploadProfileImage', {
    token: token(), employeeId, base64, fileName: fileName || 'profile.jpg',
  })
  return r.data
}

// Use public endpoints so drive:fileId → base64 conversion is applied
export async function getEmployees() {
  const r = await gasGet('getEmployees', { noCache: 'true' })
  return r.data || []
}

export async function getBirthdays() {
  const r = await gasGet('getBirthdays')
  return r.data || []
}

export async function addBirthday(fields) {
  const r = await gasGet('adminAddBirthday', { token: token(), ...fields })
  return r.data
}

function token() {
  return localStorage.getItem('admin_token') || ''
}

export async function login(username, password) {
  const r = await gasPost('login', { username, password })
  return r.data // { token, name }
}

export async function getAll(sheetName) {
  const r = await gasGet('adminGetAll', { token: token(), sheetName })
  return r.data
}

export async function updateRow(sheetName, keyCol, keyVal, updates) {
  const r = await gasGet('adminUpdateRow', { token: token(), sheetName, keyCol, keyVal, ...updates })
  return r.data
}

export async function deleteRow(sheetName, keyCol, keyVal) {
  const r = await gasGet('adminDeleteRow', { token: token(), sheetName, keyCol, keyVal })
  return r.data
}

export async function addEmployee(fields) {
  const r = await gasGet('adminAddEmployee', { token: token(), ...fields })
  return r.data
}

export async function updateIdea(id, status) {
  const r = await gasGet('adminUpdateIdea', { token: token(), id, status })
  return r.data
}

export async function deletePost(postId) {
  const r = await gasGet('adminDeletePost', { token: token(), postId })
  return r.data
}

export async function deleteComment(commentId, postId) {
  const r = await gasGet('adminDeleteComment', { token: token(), commentId, postId: postId || '' })
  return r.data
}

export async function deleteChannel(channelId) {
  const r = await gasGet('adminDeleteChannel', { token: token(), channelId })
  return r.data
}

// ── Announcement ──────────────────────────────────────────────────

export async function saveAnnouncement(fields) {
  const r = await gasGet('saveAnnouncement', { token: token(), ...fields })
  if (!r.ok) throw new Error(r.error || 'บันทึกไม่สำเร็จ')
  return r.data
}

export async function uploadAnnouncementVideo(base64, fileName, mimeType) {
  const r = await gasPost('uploadAnnouncementVideo', {
    token: token(), base64, fileName: fileName || 'announcement.mp4', mimeType: mimeType || 'video/mp4',
  })
  if (!r.ok) throw new Error(r.error || 'อัปโหลดไม่สำเร็จ')
  return r.data
}
