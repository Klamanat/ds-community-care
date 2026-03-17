// mentalService.js — Mental health advisors & consult requests via Supabase

import { supabase } from './supabase.js'

function mapAdvisor(a) {
  return {
    id:         a.id,
    name:       a.name        || '',
    role:       a.role        || '',
    employeeId: a.employee_id || '',
    imgId:      a.img_id      || '',
    imgUrl:     a.img_url     || '',
    order:      a.order       != null ? Number(a.order) : 0,
  }
}

function mapRequest(r) {
  return {
    id:                  r.id,
    counselorEmployeeId: r.counselor_employee_id || '',
    message:             r.message              || '',
    employeeId:          r.employee_id          || '',
    employeeName:        r.employee_name        || '',
    createdAt:           r.created_at           || '',
    isRead:              !!r.is_read,
    reply:               r.reply                || '',
    counselorName:       r.counselor_name       || '',
    repliedAt:           r.replied_at           || '',
  }
}

export async function fetchAdvisors() {
  const { data, error } = await supabase
    .from('mental_advisors')
    .select('*')
    .order('order')
  if (error) throw new Error(error.message)
  return (data || []).map(mapAdvisor)
}

export async function fetchCounselorRequests(counselorEmployeeId) {
  const { data, error } = await supabase
    .from('consult_requests')
    .select('*')
    .eq('counselor_employee_id', counselorEmployeeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapRequest)
}

export async function fetchSenderRequests(senderEmployeeId) {
  const { data, error } = await supabase
    .from('consult_requests')
    .select('*')
    .eq('employee_id', senderEmployeeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapRequest)
}

export async function submitConsultRequest(counselorEmployeeId, message, senderEmployeeId, senderName) {
  const { error } = await supabase
    .from('consult_requests')
    .insert({
      counselor_employee_id: counselorEmployeeId,
      message,
      employee_id:   senderEmployeeId,
      employee_name: senderName || '',
    })
  if (error) throw new Error(error.message)
}

export async function markConsultRead(id) {
  const { error } = await supabase
    .from('consult_requests')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addConsultReply(requestId, reply, counselorEmployeeId) {
  const { error } = await supabase
    .from('consult_requests')
    .update({
      reply,
      replied_at:           new Date().toISOString(),
      is_read:              true,
      counselor_employee_id: counselorEmployeeId,
    })
    .eq('id', requestId)
  if (error) throw new Error(error.message)
}
