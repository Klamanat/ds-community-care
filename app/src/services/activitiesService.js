// activitiesService.js — Activities & attendance via Supabase

import { supabase } from './supabase.js'
import { uploadImage as edgeUpload } from './edgeFunctions.js'

function mapActivity(a) {
  return {
    id:           a.id,
    monthIdx:     a.month_idx    != null ? Number(a.month_idx) : null,
    name:         a.name         || '',
    emoji:        a.emoji        || '',
    date:         a.date         || '',
    dateEnd:      a.date_end     || '',
    loc:          a.loc          || '',
    desc:         a.desc         || '',
    steps:        a.steps        || '',
    joinUrl:      a.join_url     || '',
    joinOpen:     a.join_open    !== false,
    joinLabel:    a.join_label   || '',
    joinOpenAt:   a.join_open_at  || '',
    joinCloseAt:  a.join_close_at || '',
    feedbackUrl:  a.feedback_url || '',
    imgUrl:       a.img_url?.startsWith('drive:') ? '' : (a.img_url || ''),
    imgId:        a.img_id || (a.img_url?.startsWith('drive:') ? a.img_url.slice(6) : ''),
    createdAt:    a.created_at   || '',
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
      month_idx:     fields.monthIdx,
      name:          fields.name,
      emoji:         fields.emoji,
      date:          fields.date,
      date_end:      fields.dateEnd,
      loc:           fields.loc,
      desc:          fields.desc,
      steps:         fields.steps,
      join_url:      fields.joinUrl,
      join_open:     fields.joinOpen !== false,
      join_label:    fields.joinLabel,
      join_open_at:  fields.joinOpenAt,
      join_close_at: fields.joinCloseAt,
      feedback_url:  fields.feedbackUrl,
      img_url:       fields.imgUrl,
      img_id:        fields.imgId,
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
      name:          fields.name,
      emoji:         fields.emoji,
      date:          fields.date,
      date_end:      fields.dateEnd,
      loc:           fields.loc,
      desc:          fields.desc,
      join_open:     fields.joinOpen !== false,
      join_label:    fields.joinLabel,
      feedback_url:  fields.feedbackUrl,
      img_url:       fields.imgUrl,
      img_id:        fields.imgId,
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
