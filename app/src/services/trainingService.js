import { gasGet } from './api.js'

export async function fetchTrainings(category) {
  const r = await gasGet('getTrainings', category ? { category } : {})
  return r.data || []
}

export async function fetchMyTrainings(employeeId) {
  const r = await gasGet('getMyTrainings', { employeeId })
  return r.data || []
}

export async function registerTraining(trainingId, employeeId, employeeName) {
  const r = await gasGet('registerTraining', { trainingId, employeeId, employeeName })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function cancelRegistration(trainingId, employeeId) {
  const r = await gasGet('cancelRegistration', { trainingId, employeeId })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function fetchReviews() {
  const r = await gasGet('getTrainingReviews', {})
  return r.data || []
}

export async function submitReview(trainingId, employeeId, employeeName, stars, comment) {
  const r = await gasGet('submitTrainingReview', { trainingId, employeeId, employeeName, stars, comment })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

// ── Site Visit (แยก sheet) ─────────────────────────────────────────────────────

export async function fetchSiteVisits() {
  const r = await gasGet('getSiteVisits', {})
  return r.data || []
}

export async function voteSite(siteId, employeeId, employeeName) {
  const r = await gasGet('voteSite', { siteId, employeeId, employeeName })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function cancelSiteVote(siteId, employeeId) {
  const r = await gasGet('cancelSiteVote', { siteId, employeeId })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function fetchMySiteVotes(employeeId) {
  const r = await gasGet('getMySiteVotes', { employeeId })
  return r.data || []
}

export async function adminFetchSiteVotes() {
  const r = await gasGet('adminGetSiteVotes', { token: token() })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data || []
}

export async function adminAddSiteVisit(fields) {
  const r = await gasGet('adminAddSiteVisit', { token: token(), ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminUpdateSiteVisit(id, fields) {
  const r = await gasGet('adminUpdateSiteVisit', { token: token(), id, ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminDeleteSiteVisit(id) {
  const r = await gasGet('adminDeleteSiteVisit', { token: token(), id })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

// ── Site Suggestions (อื่นๆ) ──────────────────────────────────────────────────

export async function submitSiteSuggestion(employeeId, employeeName, suggestion) {
  const r = await gasGet('submitSiteSuggestion', { employeeId, employeeName, suggestion })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function fetchMySiteSuggestion(employeeId) {
  const r = await gasGet('getMySiteSuggestion', { employeeId })
  return r.data || null   // { suggestion: '...' } or null
}

export async function cancelSiteSuggestion(employeeId) {
  const r = await gasGet('submitSiteSuggestion', { employeeId, suggestion: '' })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

function token() { return localStorage.getItem('admin_token') || '' }

// ── Admin: Training (category-aware) ─────────────────────────────────────────

export async function adminFetchTrainings(category) {
  const params = category ? { category } : {}
  const r = await gasGet('getTrainings', params)
  return r.data || []
}

export async function adminFetchSiteVisits() {
  const r = await gasGet('getSiteVisits', {})
  return r.data || []
}

export async function adminGetTrainingRegistrations(trainingId) {
  const r = await gasGet('adminGetTrainingRegistrations', { token: token(), trainingId })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data || []
}

export async function adminAddTraining(fields) {
  // fields must include category
  const r = await gasGet('adminAddTraining', { token: token(), ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminUpdateTraining(id, fields) {
  // fields must include category
  const r = await gasGet('adminUpdateTraining', { token: token(), id, ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminDeleteTraining(id, category) {
  const r = await gasGet('adminDeleteTraining', { token: token(), id, category })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminFetchSiteSuggestions() {
  const r = await gasGet('adminGetSiteSuggestions', { token: token() })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data || []
}
