import { gasGet, gasPost } from './api.js'

export async function fetchBlogPosts(category) {
  const r = await gasGet('getBlogPosts', category ? { category } : {})
  return r.data || []
}

export async function submitBlogPost(fields) {
  const r = await gasPost('addBlogPost', fields)
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

function token() { return localStorage.getItem('admin_token') || '' }

export async function adminGetBlogPosts() {
  const r = await gasGet('adminGetBlogPosts', { token: token() })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data || []
}

export async function adminDeleteBlogPost(id) {
  const r = await gasGet('adminDeleteBlogPost', { token: token(), id })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminUpdateBlogPost(id, fields) {
  const r = await gasGet('adminUpdateBlogPost', { token: token(), id, ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}
