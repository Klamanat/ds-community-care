// rewardService.js — Points & rewards via Supabase

import { supabase } from './supabase.js'

export async function fetchMyPoints(employeeName) {
  const { data, error } = await supabase.rpc('get_my_points', { p_emp_name: employeeName })
  if (error) throw new Error(error.message)
  return { total: data || 0 }
}

export async function fetchRewardRules() {
  const { data, error } = await supabase
    .from('point_rules')
    .select('*')
    .eq('active', true)
    .order('pts', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function postDailyCheckin(employeeName) {
  const { data, error } = await supabase.rpc('daily_checkin', { p_emp_name: employeeName })
  if (error) throw new Error(error.message)
  return { pts: data || 0 }
}

export async function adminAddRewardRule(_token, fields) {
  const { data, error } = await supabase.from('point_rules').insert(fields).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminUpdateRewardRule(_token, id, fields) {
  const { data, error } = await supabase.from('point_rules').update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminDeleteRewardRule(_token, id) {
  const { error } = await supabase.from('point_rules').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
