// trainingService.js — Trainings, site visits, IDP via Supabase

import { supabase } from './supabase.js'
import { uploadImage } from './edgeFunctions.js'

const TRAINING_TABLE = {
  annual:      'annual_trainings',
  idp:         'idp_trainings',
  external:    'external_trainings',
  compulsory:  'compulsory_trainings',
  superskills: 'superskills_trainings',
  leadership:  'leadership_trainings',
}

function tableFor(category) {
  return TRAINING_TABLE[category] || 'annual_trainings'
}

export async function fetchTrainings(category) {
  if (!category) {
    // Fetch all categories merged
    const all = await Promise.all(
      Object.entries(TRAINING_TABLE).map(async ([cat, tbl]) => {
        const { data } = await supabase.from(tbl).select('*').order('created_at', { ascending: false })
        return (data || []).map(r => ({ ...r, category: cat }))
      })
    )
    return all.flat()
  }
  const { data, error } = await supabase.from(tableFor(category)).select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(r => ({ ...r, category }))
}

export async function fetchMyTrainings(employeeId) {
  const { data, error } = await supabase
    .from('training_registrations')
    .select('training_id')
    .eq('employee_id', employeeId)
  if (error) throw new Error(error.message)
  return (data || []).map(r => r.training_id)
}

export async function registerTraining(trainingId, employeeId, employeeName) {
  const { error } = await supabase.from('training_registrations').insert({
    training_id:   trainingId,
    employee_id:   employeeId,
    employee_name: employeeName,
  })
  if (error) throw new Error(error.message)
}

export async function cancelRegistration(trainingId, employeeId) {
  const { error } = await supabase.from('training_registrations')
    .delete()
    .eq('training_id', trainingId)
    .eq('employee_id', employeeId)
  if (error) throw new Error(error.message)
}

export async function fetchReviews(trainingId) {
  let q = supabase.from('training_reviews').select('*').order('created_at', { ascending: false })
  if (trainingId) q = q.eq('training_id', trainingId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data || []
}

export async function submitReview(trainingId, employeeId, employeeName, stars, comment) {
  const { data, error } = await supabase.from('training_reviews').insert({
    training_id:   trainingId,
    employee_id:   employeeId,
    employee_name: employeeName,
    stars,
    comment,
  }).select().single()
  if (error) throw new Error(error.message)
  return data
}

// ── Site Visits ───────────────────────────────────────────────

export async function fetchSiteVisits() {
  const { data, error } = await supabase.from('site_visits').select('*').order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function voteSite(siteId, employeeId, employeeName) {
  const { error } = await supabase.from('site_votes').insert({ site_id: siteId, employee_id: employeeId, employee_name: employeeName })
  if (error) throw new Error(error.message)
}

export async function cancelSiteVote(siteId, employeeId) {
  const { error } = await supabase.from('site_votes').delete().eq('site_id', siteId).eq('employee_id', employeeId)
  if (error) throw new Error(error.message)
}

export async function fetchMySiteVotes(employeeId) {
  const { data, error } = await supabase.from('site_votes').select('site_id').eq('employee_id', employeeId)
  if (error) throw new Error(error.message)
  return (data || []).map(r => r.site_id)
}

export async function submitSiteSuggestion(employeeId, employeeName, suggestion) {
  const { error } = await supabase.from('site_suggestions').upsert({
    employee_id:   employeeId,
    employee_name: employeeName,
    description:   suggestion,
  }, { onConflict: 'employee_id' })
  if (error) throw new Error(error.message)
}

export async function fetchMySiteSuggestion(employeeId) {
  const { data } = await supabase.from('site_suggestions').select('description').eq('employee_id', employeeId).maybeSingle()
  return data ? { suggestion: data.description } : null
}

// ── IDP Posters & Videos ──────────────────────────────────────

export async function fetchIdpPosters() {
  const { data, error } = await supabase.from('idp_posters').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchIdpVideos() {
  const { data, error } = await supabase.from('idp_videos').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function adminUploadIdpImage(base64Data, _mimeType, fileName) {
  return uploadImage(base64Data, fileName || 'idp.jpg', 'idp')
}

export async function adminAddIdpPoster(fields) {
  const { data, error } = await supabase.from('idp_posters').insert(fields).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminUpdateIdpPoster(id, fields) {
  const { data, error } = await supabase.from('idp_posters').update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminDeleteIdpPoster(id) {
  const { error } = await supabase.from('idp_posters').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminAddIdpVideo(fields) {
  const { data, error } = await supabase.from('idp_videos').insert(fields).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminUpdateIdpVideo(id, fields) {
  const { data, error } = await supabase.from('idp_videos').update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminDeleteIdpVideo(id) {
  const { error } = await supabase.from('idp_videos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Admin: Training CRUD ──────────────────────────────────────

export { fetchTrainings as adminFetchTrainings, fetchSiteVisits as adminFetchSiteVisits }

export async function adminGetTrainingRegistrations(trainingId) {
  const { data, error } = await supabase.from('training_registrations').select('*').eq('training_id', trainingId)
  if (error) throw new Error(error.message)
  return data || []
}

export async function adminAddTraining(fields) {
  const { data, error } = await supabase.from(tableFor(fields.category)).insert(fields).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminUpdateTraining(id, fields) {
  const { data, error } = await supabase.from(tableFor(fields.category)).update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminDeleteTraining(id, category) {
  const { error } = await supabase.from(tableFor(category)).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminFetchSiteVotes() {
  const { data, error } = await supabase.from('site_votes').select('*')
  if (error) throw new Error(error.message)
  return data || []
}

export async function adminAddSiteVisit(fields) {
  const { data, error } = await supabase.from('site_visits').insert(fields).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminUpdateSiteVisit(id, fields) {
  const { data, error } = await supabase.from('site_visits').update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminDeleteSiteVisit(id) {
  const { error } = await supabase.from('site_visits').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminFetchSiteSuggestions() {
  const { data, error } = await supabase.from('site_suggestions').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}
