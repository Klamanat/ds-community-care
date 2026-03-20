import { supabase } from './supabase.js'

/** Upsert presence row — call on mount + every few minutes */
export async function pingPresence(employeeName, dept) {
  if (!employeeName) return
  await supabase.from('user_presence').upsert(
    { employee_name: employeeName, dept: dept || null, last_seen_at: new Date().toISOString() },
    { onConflict: 'employee_name' }
  )
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
