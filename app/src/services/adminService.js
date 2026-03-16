// adminService.js — Admin operations via Supabase

import { supabase } from './supabase.js'
import { uploadImage } from './edgeFunctions.js'

// ── Auth ──────────────────────────────────────────────────────

export async function login(username, password) {
  const email = username.includes('@') ? username : `${username}@ds.internal`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  const role = data.user?.user_metadata?.role
  if (role !== 'admin') {
    await supabase.auth.signOut()
    throw new Error('ไม่มีสิทธิ์ admin')
  }
  return { name: data.user.user_metadata?.name || username }
}

// ── Images ────────────────────────────────────────────────────

export async function uploadProfileImage(employeeId, base64, fileName) {
  const result = await uploadImage(base64, fileName || 'profile.jpg', 'profiles')
  const { error } = await supabase
    .from('employees')
    .update({ img_id: result.id, img_url: result.url })
    .eq('id', employeeId)
  if (error) throw new Error(error.message)
  return result
}

// ── Employees ─────────────────────────────────────────────────

function mapEmp(e) {
  const imgId = e.img_id || (e.img_url?.startsWith('drive:') ? e.img_url.slice(6) : '')
  return {
    id:             e.id,
    empCode:        e.emp_code        || '',
    name:           e.name            || '',
    role:           e.role            || '',
    dept:           e.dept            || '',
    grad:           e.grad            || '',
    imgUrl:         e.img_url?.startsWith('drive:') ? '' : (e.img_url || ''),
    imgId,
    inTeam:         !!e.in_team,
    inStarGang:     !!e.in_star_gang,
    starGangName:   e.star_gang_name   || '',
    starGangRole:   e.star_gang_role   || '',
    starGangSlogan: e.star_gang_slogan || '',
    monthIdx:       e.month_idx   != null ? Number(e.month_idx)   : null,
    bdDate:         e.bd_date     || '',
    fallbackIdx:    e.fallback_idx != null ? Number(e.fallback_idx) : 0,
  }
}

export async function getEmployees() {
  const { data, error } = await supabase.from('employees').select('*').order('name')
  if (error) throw new Error(error.message)
  return (data || []).map(mapEmp)
}

export async function addEmployee(fields) {
  const { data, error } = await supabase.from('employees').insert(fields).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateEmployee(id, fields) {
  const { data, error } = await supabase.from('employees').update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteEmployee(id) {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Birthdays ─────────────────────────────────────────────────

export async function getBirthdays() {
  const { data, error } = await supabase
    .from('employees')
    .select('id,name,role,month_idx,bd_date,img_id,img_url')
    .not('bd_date', 'is', null)
    .order('month_idx')
  if (error) throw new Error(error.message)
  return (data || []).map(e => ({
    key:         `bday_${e.id}`,
    employeeId:  e.id,
    name:        e.name    || '',
    role:        e.role    || '',
    monthIdx:    e.month_idx != null ? Number(e.month_idx) : null,
    bdDate:      e.bd_date  || '',
    imgId:       e.img_id  || (e.img_url?.startsWith('drive:') ? e.img_url.slice(6) : ''),
    imgUrl:      e.img_url?.startsWith('drive:') ? '' : (e.img_url || ''),
  }))
}

export async function addBirthday(fields) {
  const { data, error } = await supabase
    .from('employees')
    .update({ bd_date: fields.bdDate, month_idx: fields.monthIdx })
    .eq('id', fields.employeeId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Ideas ─────────────────────────────────────────────────────

export async function updateIdea(id, status) {
  const { data, error } = await supabase
    .from('ideas')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Empathy ───────────────────────────────────────────────────

export async function deletePost(postId) {
  const { error } = await supabase.from('empathy_comments').delete().eq('id', postId)
  if (error) throw new Error(error.message)
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('empathy_replies').delete().eq('id', commentId)
  if (error) throw new Error(error.message)
}

export async function deleteChannel(channelId) {
  const { error } = await supabase.from('channels').delete().eq('id', channelId)
  if (error) throw new Error(error.message)
}

// ── Announcement ──────────────────────────────────────────────

export async function saveAnnouncement(fields) {
  const rows = [
    { key: 'ann_enabled', value: String(fields.enabled !== false) },
    { key: 'ann_id',      value: fields.id    || `ann_${Date.now()}` },
    { key: 'ann_title',   value: fields.title || '' },
    { key: 'ann_video',   value: fields.video || '' },
    { key: 'ann_desc',    value: fields.desc  || '' },
  ]
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

export async function uploadAnnouncementVideo(base64, fileName, _mimeType) {
  return uploadImage(base64, fileName || 'announcement.mp4', 'announcements')
}

// ── Generic (legacy compat) ───────────────────────────────────

const TABLE_MAP = {
  Employees:       'employees',
  Birthdays:       'employees',
  EmpathyComments: 'empathy_comments',
  Ideas:           'ideas',
  Activities:      'activities',
  BlogPosts:       'blog_posts',
  SiteVisits:      'site_visits',
  MentalAdvisors:  'mental_advisors',
  ConsultRequests: 'consult_requests',
}

function toSnake(camel) {
  return camel.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
}

export async function getAll(sheetName) {
  const tbl = TABLE_MAP[sheetName] || sheetName.toLowerCase()
  const { data, error } = await supabase.from(tbl).select('*')
  if (error) throw new Error(error.message)
  return data || []
}

export async function updateRow(sheetName, keyCol, keyVal, updates) {
  const tbl = TABLE_MAP[sheetName] || sheetName.toLowerCase()
  const { data, error } = await supabase.from(tbl).update(updates).eq(toSnake(keyCol), keyVal).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteRow(sheetName, keyCol, keyVal) {
  const tbl = TABLE_MAP[sheetName] || sheetName.toLowerCase()
  const { error } = await supabase.from(tbl).delete().eq(toSnake(keyCol), keyVal)
  if (error) throw new Error(error.message)
}
