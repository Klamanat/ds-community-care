// activitiesService.js — Activities & attendance via Supabase

import { supabase } from './supabase.js'
import { uploadImage as edgeUpload } from './edgeFunctions.js'

function mapActivity(a) {
  return {
    id:             a.id,
    monthIdx:       a.month_idx    != null ? Number(a.month_idx) : null,
    name:           a.name         || '',
    emoji:          a.emoji        || '',
    date:           a.date         || '',
    dateEnd:        a.date_end     || '',
    loc:            a.loc          || '',
    desc:           a.desc         || '',
    steps:          a.steps        || '',
    joinUrl:        a.join_url     || '',
    joinOpen:       a.join_open    !== false,
    joinLabel:      a.join_label   || '',
    joinOpenAt:     a.join_open_at  || '',
    joinCloseAt:    a.join_close_at || '',
    feedbackUrl:    a.feedback_url || '',
    imgUrl:         a.img_url?.startsWith('drive:') ? '' : (a.img_url || ''),
    imgId:          a.img_id || (a.img_url?.startsWith('drive:') ? a.img_url.slice(6) : ''),
    createdAt:      a.created_at   || '',
    ticketEnabled:  !!a.ticket_enabled,
    ticketTitle:    a.ticket_title   || '',
    ticketPrice:    a.ticket_price  != null ? Number(a.ticket_price)  : 0,
    ticketCapacity: a.ticket_capacity != null ? Number(a.ticket_capacity) : null,
    ticketNote:     a.ticket_note   || '',
    ticketOpenAt:   a.ticket_open_at || '',
  }
}

function mapTicket(t) {
  return {
    id:           t.id,
    activityId:   t.activity_id,
    employeeId:   t.employee_id,
    employeeName: t.employee_name,
    ticketNo:     t.ticket_no,
    qrToken:      t.qr_token,
    status:       t.status   || 'booked',
    quantity:     t.quantity != null ? Number(t.quantity) : 1,
    price:        t.price    || 0,
    slipUrl:      t.slip_url || '',
    createdAt:    t.created_at    || '',
    cancelledAt:  t.cancelled_at  || '',
    checkedInAt:  t.checked_in_at || '',
  }
}

export async function fetchAll() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map(mapActivity)
}

export async function fetchByMonth(monthIdx) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('month_idx', monthIdx)
    .order('date')
  if (error) throw new Error(error.message)
  return (data || []).map(mapActivity)
}

export async function addActivity(fields) {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      month_idx:        fields.monthIdx,
      name:             fields.name,
      emoji:            fields.emoji,
      date:             fields.date,
      date_end:         fields.dateEnd,
      loc:              fields.loc,
      desc:             fields.desc,
      steps:            fields.steps,
      join_url:         fields.joinUrl,
      join_open:        fields.joinOpen !== false,
      join_label:       fields.joinLabel,
      join_open_at:     fields.joinOpenAt,
      join_close_at:    fields.joinCloseAt,
      feedback_url:     fields.feedbackUrl,
      img_url:          fields.imgUrl,
      img_id:           fields.imgId,
      ticket_enabled:   fields.ticketEnabled  || false,
      ticket_title:     fields.ticketTitle    || '',
      ticket_price:     fields.ticketPrice    || 0,
      ticket_capacity:  fields.ticketCapacity || null,
      ticket_note:      fields.ticketNote     || '',
      ticket_open_at:   fields.ticketOpenAt ? new Date(fields.ticketOpenAt).toISOString() : null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapActivity(data)
}

export async function updateActivity(id, fields) {
  const { data, error } = await supabase
    .from('activities')
    .update({
      month_idx:        fields.monthIdx,
      name:             fields.name,
      emoji:            fields.emoji,
      date:             fields.date,
      date_end:         fields.dateEnd,
      loc:              fields.loc,
      desc:             fields.desc,
      steps:            fields.steps,
      join_url:         fields.joinUrl,
      join_open:        fields.joinOpen !== false,
      join_label:       fields.joinLabel,
      join_open_at:     fields.joinOpenAt,
      join_close_at:    fields.joinCloseAt,
      feedback_url:     fields.feedbackUrl,
      img_url:          fields.imgUrl,
      img_id:           fields.imgId,
      ticket_enabled:   fields.ticketEnabled  || false,
      ticket_title:     fields.ticketTitle    || '',
      ticket_price:     fields.ticketPrice    || 0,
      ticket_capacity:  fields.ticketCapacity || null,
      ticket_note:      fields.ticketNote     || '',
      ticket_open_at:   fields.ticketOpenAt ? new Date(fields.ticketOpenAt).toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapActivity(data)
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function joinActivity(activityId, activityName, employeeName, joinLabel) {
  // Check if already joined
  const { data: existing } = await supabase
    .from('activity_joins')
    .select('id')
    .eq('activity_id', activityId)
    .eq('employee_name', employeeName || 'ไม่ระบุชื่อ')
    .maybeSingle()

  if (existing) return { alreadyJoined: true }

  const { error } = await supabase.from('activity_joins').insert({
    activity_id:   activityId,
    activity_name: activityName,
    employee_name: employeeName || 'ไม่ระบุชื่อ',
    reward_type:   joinLabel || '',
  })
  if (error) throw new Error(error.message)

  const { count } = await supabase
    .from('activity_joins')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId)

  return { alreadyJoined: false, joinCount: count || 0 }
}

export async function uploadImage(base64, fileName, folderType = 'activities') {
  return edgeUpload(base64, fileName || 'image.jpg', folderType)
}

export async function getMyStamps(employeeName) {
  const { data, error } = await supabase
    .from('activity_joins')
    .select('*')
    .eq('employee_name', employeeName)
    .order('stamped_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function claimReward(activityId, employeeName, rewardType) {
  const { data, error } = await supabase
    .from('activity_joins')
    .update({ reward_claimed: true, reward_type: rewardType })
    .eq('activity_id', activityId)
    .eq('employee_name', employeeName)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Ticket system ──────────────────────────────────────────────────

export async function fetchTicketActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('ticket_enabled', true)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map(mapActivity)
}

export async function bookTicket(activityId, employeeId, employeeName, price, quantity = 1) {
  // Check capacity (sum of quantities, not row count)
  const { data: act } = await supabase
    .from('activities')
    .select('ticket_capacity')
    .eq('id', activityId)
    .single()

  if (act?.ticket_capacity != null) {
    const { data: rows } = await supabase
      .from('activity_tickets')
      .select('quantity')
      .eq('activity_id', activityId)
      .in('status', ['pending_slip', 'booked', 'checked_in'])
    const totalBooked = (rows || []).reduce((s, r) => s + (r.quantity || 1), 0)
    if (totalBooked + quantity > act.ticket_capacity) throw new Error('ที่นั่งไม่เพียงพอ')
  }

  // Generate ticket_no
  const { count: total } = await supabase
    .from('activity_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId)

  const ticketNo = `TKT-${String((total || 0) + 1).padStart(4, '0')}`
  const initStatus = (price && price > 0) ? 'pending_slip' : 'booked'

  // Revive cancelled row if exists (avoids UNIQUE constraint violation)
  const { data: prev } = await supabase
    .from('activity_tickets')
    .select('id')
    .eq('activity_id', activityId)
    .eq('employee_id', employeeId)
    .eq('status', 'cancelled')
    .maybeSingle()

  if (prev) {
    const { data, error } = await supabase
      .from('activity_tickets')
      .update({ status: initStatus, quantity, price: price || 0, ticket_no: ticketNo, slip_url: '', cancelled_at: null, checked_in_at: null })
      .eq('id', prev.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapTicket(data)
  }

  const { data, error } = await supabase
    .from('activity_tickets')
    .insert({ activity_id: activityId, employee_id: employeeId, employee_name: employeeName, ticket_no: ticketNo, price: price || 0, quantity, status: initStatus })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapTicket(data)
}

export async function uploadTicketSlip(ticketId, base64, fileName) {
  const res = await edgeUpload(base64, fileName || 'slip.jpg', 'slips')
  const { data, error } = await supabase
    .from('activity_tickets')
    .update({ slip_url: res.url, status: 'booked' })
    .eq('id', ticketId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapTicket(data)
}

export async function cancelTicket(ticketId) {
  const { error } = await supabase
    .from('activity_tickets')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (error) throw new Error(error.message)
}

export async function getMyTickets(employeeId) {
  const { data, error } = await supabase
    .from('activity_tickets')
    .select('*, activities(name, emoji, date, date_end, loc, ticket_note, ticket_price)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(t => ({
    ...mapTicket(t),
    activityName:  t.activities?.name     || '',
    activityEmoji: t.activities?.emoji    || '📅',
    activityDate:  t.activities?.date     || '',
    activityDateEnd: t.activities?.date_end || '',
    activityLoc:   t.activities?.loc      || '',
    ticketNote:    t.activities?.ticket_note  || '',
    ticketPrice:   t.activities?.ticket_price || 0,
  }))
}

export async function getMyTicketForActivity(activityId, employeeId) {
  const { data } = await supabase
    .from('activity_tickets')
    .select('*')
    .eq('activity_id', activityId)
    .eq('employee_id', employeeId)
    .neq('status', 'cancelled')
    .maybeSingle()
  return data ? mapTicket(data) : null
}

export async function getActivityTickets(activityId) {
  const { data, error } = await supabase
    .from('activity_tickets')
    .select('*')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map(mapTicket)
}

export async function getActivityBookedCount(activityId) {
  const { data } = await supabase
    .from('activity_tickets')
    .select('quantity')
    .eq('activity_id', activityId)
    .in('status', ['pending_slip', 'booked', 'checked_in'])
  return (data || []).reduce((s, r) => s + (r.quantity || 1), 0)
}

export async function verifyTicket(qrToken) {
  const { data, error } = await supabase
    .from('activity_tickets')
    .select('*, activities(name, emoji, date, loc)')
    .eq('qr_token', qrToken)
    .single()
  if (error || !data) return null
  return {
    ...mapTicket(data),
    activityName:  data.activities?.name  || '',
    activityEmoji: data.activities?.emoji || '📅',
    activityDate:  data.activities?.date  || '',
    activityLoc:   data.activities?.loc   || '',
  }
}

export async function checkInTicket(qrToken) {
  const { data, error } = await supabase
    .from('activity_tickets')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('qr_token', qrToken)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapTicket(data)
}
