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
    passcode:       e.passcode !== undefined ? e.passcode : null,
  }
}

export async function getEmployees() {
  const { data, error } = await supabase.from('employees').select('*').order('name')
  if (error) throw new Error(error.message)
  return (data || []).map(mapEmp)
}

export async function addEmployee(fields) {
  const snakeFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [toSnake(k), v]))
  const { data, error } = await supabase.from('employees').insert(snakeFields).select().single()
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

export async function getAdminIdeas() {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(i => ({
    id:            i.id,
    category:      i.category      || '',
    title:         i.title         || '',
    detail:        i.detail        || '',
    submitterName: i.submitter_name || '',
    createdAt:     i.created_at    || '',
    status:        i.status        || 'pending',
  }))
}

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
  // Delete all comments and likes for this channel (post_id = emp_code)
  const [r1, r2] = await Promise.all([
    supabase.from('empathy_comments').delete().eq('post_id', channelId),
    supabase.from('channel_likes').delete().eq('channel_id', channelId),
  ])
  if (r1.error) throw new Error(r1.error.message)
  if (r2.error) throw new Error(r2.error.message)
}

// ── Announcement ──────────────────────────────────────────────

export async function saveAnnouncement(fields) {
  const rows = [
    { key: 'ann_enabled', value: (fields.enabled === true || String(fields.enabled).toUpperCase() === 'TRUE') ? 'true' : 'false' },
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

// ── Mental Advisors ───────────────────────────────────────────

function mapAdvisor(a) {
  return {
    id:         a.id,
    name:       a.name        || '',
    role:       a.role        || '',
    employeeId: a.employee_id || '',
    imgId:      a.img_id      || '',
    imgUrl:     a.img_url     || '',
    order:      a.order       != null ? Number(a.order) : 0,
    cardBgType:  a.card_bg_type  || '',
    cardBgValue: a.card_bg_value || '',
    cardBgId:    a.card_bg_id   || '',
    cardBgEmoji: a.card_bg_emoji || '',
  }
}

export async function getMentalAdvisors() {
  const { data, error } = await supabase
    .from('mental_advisors')
    .select('*')
    .order('order')
  if (error) throw new Error(error.message)
  return (data || []).map(mapAdvisor)
}

export async function addMentalAdvisor(fields) {
  const { data, error } = await supabase
    .from('mental_advisors')
    .insert({ name: fields.name, role: fields.role, employee_id: fields.employeeId, order: fields.order || 0, card_bg_type: fields.cardBgType || null, card_bg_value: fields.cardBgValue || null, card_bg_id: fields.cardBgId || null, card_bg_emoji: fields.cardBgEmoji || null })
    .select().single()
  if (error) throw new Error(error.message)
  return mapAdvisor(data)
}

export async function updateMentalAdvisor(id, fields) {
  const { data, error } = await supabase
    .from('mental_advisors')
    .update({ name: fields.name, role: fields.role, employee_id: fields.employeeId, order: fields.order || 0, card_bg_type: fields.cardBgType || null, card_bg_value: fields.cardBgValue || null, card_bg_id: fields.cardBgId || null, card_bg_emoji: fields.cardBgEmoji || null })
    .eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return mapAdvisor(data)
}

export async function deleteMentalAdvisor(id) {
  const { error } = await supabase.from('mental_advisors').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getConsultRequests() {
  const { data, error } = await supabase
    .from('consult_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(r => ({
    id:                 r.id,
    counselorEmployeeId: r.counselor_employee_id || '',
    message:            r.message               || '',
    employeeId:         r.employee_id           || '',
    employeeName:       r.employee_name         || '',
    createdAt:          r.created_at            || '',
    isRead:             !!r.is_read,
    reply:              r.reply                 || '',
    counselorName:      r.counselor_name        || '',
    repliedAt:          r.replied_at            || '',
  }))
}

// ── Generic (legacy compat) ───────────────────────────────────

const TABLE_MAP = {
  Employees:       'employees',
  Birthdays:       'employees',
  EmpathyComments: 'empathy_comments',
  ChannelLikes:    'channel_likes',
  EmpathyPhotos:   'empathy_photos',
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
  const snakeUpdates = Object.fromEntries(Object.entries(updates).map(([k, v]) => [toSnake(k), v]))
  const { data, error } = await supabase.from(tbl).update(snakeUpdates).eq(toSnake(keyCol), keyVal).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteRow(sheetName, keyCol, keyVal) {
  const tbl = TABLE_MAP[sheetName] || sheetName.toLowerCase()
  const { error } = await supabase.from(tbl).delete().eq(toSnake(keyCol), keyVal)
  if (error) throw new Error(error.message)
}
