import { gasGet, gasPost } from './api.js'

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
