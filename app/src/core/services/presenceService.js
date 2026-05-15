import { supabase } from './supabase.js'

/** Upsert presence row — call on mount + every few minutes */
export async function pingPresence(employeeName, dept) {
  if (!employeeName) return
  const today = new Date().toISOString().slice(0, 10)
  await Promise.all([
    supabase.from('user_presence').upsert(
      { employee_name: employeeName, dept: dept || null, last_seen_at: new Date().toISOString() },
      { onConflict: 'employee_name' }
    ),
    supabase.from('user_presence_log').upsert(
      { date: today, employee_name: employeeName, dept: dept || null },
      { onConflict: 'date,employee_name', ignoreDuplicates: true }
    ),
  ])
}

/** Daily active user counts for the last N days */
export async function fetchDailyActiveUsers(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('user_presence_log')
    .select('date, employee_name')
    .gte('date', since)
    .order('date', { ascending: true })
  // group by date
  const map = {}
  ;(data || []).forEach(r => { map[r.date] = (map[r.date] || 0) + 1 })
  // fill all days (including zeros)
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: map[key] || 0 })
  }
  return result
}

/** Users seen within the last `minutes` minutes */
export async function fetchOnlineUsers(minutes = 5) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('user_presence')
    .select('employee_name, dept, last_seen_at')
    .gte('last_seen_at', since)
    .order('last_seen_at', { ascending: false })
  return data || []
}

/** Users seen within the last 24 h */
export async function fetchTodayUsers() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('user_presence')
    .select('employee_name, dept, last_seen_at')
    .gte('last_seen_at', since)
    .order('last_seen_at', { ascending: false })
  return data || []
}
