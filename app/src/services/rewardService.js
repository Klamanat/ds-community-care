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

// ── Reward items (ของรางวัล) ──────────────────────────────────

function mapReward(r) {
  return {
    id:          r.id,
    name:        r.name        || '',
    description: r.description || '',
    ptsCost:     r.pts_cost    || 0,
    imageId:     r.image_id    || '',
    imageUrl:    r.image_url   || '',
    stock:       r.stock       ?? null,
    active:      r.active      !== false,
    createdAt:   r.created_at  || '',
  }
}

export async function fetchRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('pts_cost', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map(mapReward)
}

export async function adminFetchRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('pts_cost', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map(mapReward)
}

export async function adminAddReward(fields) {
  const { data, error } = await supabase.from('rewards').insert(fields).select().single()
  if (error) throw new Error(error.message)
  return mapReward(data)
}

export async function adminUpdateReward(id, fields) {
  const { data, error } = await supabase.from('rewards').update(fields).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return mapReward(data)
}

export async function adminDeleteReward(id) {
  const { error } = await supabase.from('rewards').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
