// userAuthService.js — Employee auth via empCode lookup in employees table

import { supabase } from './supabase.js'

/**
 * Login by empCode — looks up the employee in the employees table.
 * No password required (matches original GAS behaviour).
 */
export async function login(empCode) {
  const { data: emp, error } = await supabase
    .from('employees')
    .select('id, emp_code, name, role, dept, img_url, img_id, star_gang_slogan, in_team')
    .eq('emp_code', String(empCode).trim())
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!emp)  throw new Error('ไม่พบรหัสพนักงานนี้ กรุณาตรวจสอบอีกครั้ง')

  // Ensure a Supabase auth session exists so auth.role() = 'authenticated' for RLS policies
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) await supabase.auth.signInAnonymously().catch(() => {})

  const rawUrl = emp.img_url || ''
  const imgId  = emp.img_id  || (rawUrl.startsWith('drive:') ? rawUrl.slice(6) : '')
  const imgUrl = rawUrl.startsWith('drive:') ? '' : rawUrl

  return {
    id:      emp.id,
    empCode: emp.emp_code,
    name:    emp.name    || '',
    role:    emp.role    || '',
    dept:    emp.dept    || '',
    imgId,
    imgUrl,
    slogan:  emp.star_gang_slogan || '',
  }
}
