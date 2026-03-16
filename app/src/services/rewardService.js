// rewardService.js — Points & rewards via Supabase

import { supabase } from './supabase.js'

const LEVELS = [
  { level: 0, name: '🌱 Newcomer', min: 0,    next: 100,  nextName: '⭐ Member'   },
  { level: 1, name: '⭐ Member',   min: 100,  next: 300,  nextName: '🔥 Active'   },
  { level: 2, name: '🔥 Active',   min: 300,  next: 600,  nextName: '💎 Champion' },
  { level: 3, name: '💎 Champion', min: 600,  next: 1000, nextName: '👑 Legend'   },
  { level: 4, name: '👑 Legend',   min: 1000, next: null, nextName: null          },
]

export async function fetchMyPoints(employeeName) {
  const [{ data: total, error }, { data: hist }] = await Promise.all([
    supabase.rpc('get_my_points', { p_emp_name: employeeName }),
    supabase.from('points').select('*')
      .eq('employee_name', employeeName)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  if (error) throw new Error(error.message)
  const pts = total || 0
  const lv  = LEVELS.slice().reverse().find(l => pts >= l.min) || LEVELS[0]
  const history = (hist || []).map(h => ({
    id:           h.id,
    type:         h.type,
    subtype:      h.subtype || '',
    amount:       h.amount  || 0,
    desc:         h.desc    || '',
    createdAt:    h.created_at || '',
  }))
  return { total: pts, level: lv.level, levelName: lv.name, nextPts: lv.next, nextName: lv.nextName, history }
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
