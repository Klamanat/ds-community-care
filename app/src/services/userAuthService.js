// userAuthService.js — Employee auth via empCode lookup in employees table

import { supabase } from './supabase.js'

/**
 * Check if an employee exists and whether they have a passcode set.
 * Returns { exists, status: 'not_found' | 'needs_setup' | 'has_passcode' }
 */
export async function checkEmployee(empCode) {
  const { data: emp } = await supabase
    .from('employees')
    .select('id, passcode')
    .eq('emp_code', String(empCode).trim())
    .maybeSingle()
  if (!emp) return { exists: false, status: 'not_found' }
  if (emp.passcode === null || emp.passcode === undefined) return { exists: true, status: 'no_passcode' }
  if (emp.passcode.trim() === '') return { exists: true, status: 'needs_setup' }
  return { exists: true, status: 'has_passcode' }
}

/**
 * Set passcode for first login (only works if passcode is NULL/empty).
 * Uses bcrypt via pgcrypto RPC.
 */
export async function setPasscode(empCode, passcode) {
  const { data, error } = await supabase.rpc('set_user_passcode', {
    p_emp_code: String(empCode).trim(),
    p_passcode: passcode,
  })
  if (error) throw new Error(error.message)
  return !!data
}

/**
 * Login by empCode + passcode (bcrypt verified via RPC).
 * If employee has no passcode (needs_setup), pass passcode='' to skip verification.
 */
export async function login(empCode, passcode = '') {
  const { data: emp, error } = await supabase
    .from('employees')
    .select('id, emp_code, name, role, dept, img_url, img_id, star_gang_slogan, in_team, passcode')
    .eq('emp_code', String(empCode).trim())
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!emp)  throw new Error('ไม่พบรหัสพนักงานนี้ กรุณาตรวจสอบอีกครั้ง')

  // If employee has a passcode hash, verify via bcrypt RPC
  if (emp.passcode !== null && emp.passcode !== undefined && emp.passcode.trim() !== '') {
    const { data: valid, error: rpcErr } = await supabase.rpc('verify_user_passcode', {
      p_emp_code: String(empCode).trim(),
      p_passcode: passcode,
    })
    if (rpcErr) throw new Error(rpcErr.message)
    if (!valid) throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่')
  }

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
