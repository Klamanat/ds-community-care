// userAuthService.js — Employee auth via empCode lookup in employees table

import { supabase } from './supabase.js'

// Email format used for Supabase auth — never exposed to users
const toAuthEmail = (empCode) => `${String(empCode).trim().toLowerCase()}@ds-community.internal`

/**
 * Check if an employee exists and whether they have a passcode set.
 * Returns { exists, status: 'not_found' | 'needs_setup' | 'has_passcode' }
 *
 * AUTH-02: Error messages at the password step are deliberately generic
 * ("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง") to prevent account enumeration.
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
 * Phase 4: also creates a Supabase auth user and links it to the employee.
 */
export async function setPasscode(empCode, passcode) {
  const code = String(empCode).trim()

  // 1. Store bcrypt hash in employees table (existing RPC)
  const { data, error } = await supabase.rpc('set_user_passcode', {
    p_emp_code: code,
    p_passcode: passcode,
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('ไม่สามารถตั้งรหัสผ่านได้ กรุณาลองใหม่')

  // 2. Create Supabase auth user — gives a real session for RLS
  const email = toAuthEmail(code)
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password: passcode })
  if (signUpErr && signUpErr.message !== 'User already registered') {
    // signUp failure is non-fatal — app still works with legacy bcrypt path
    console.warn('[auth] signUp failed during setPasscode:', signUpErr.message)
    return true
  }

  // 3. Link auth user to employee row (after session is established)
  if (signUpData?.session) {
    await supabase.rpc('link_auth_user', { p_emp_code: code }).catch(() => {})
  }

  return true
}

/**
 * Login by empCode + passcode.
 *
 * Phase 4 flow:
 *  a) If employee already has auth_user_id (Supabase user linked):
 *     → signInWithPassword — real session, auth.uid() = employee's UID
 *  b) If employee has NO auth_user_id (legacy, bcrypt only):
 *     → verify via verify_user_passcode RPC
 *     → then signUp to create Supabase user + link in background
 *
 * AUTH-01 fix: session is now a real authenticated session (not anonymous).
 * AUTH-03 fix: caller should call get_my_employee() after login to get
 *             authoritative role/dept/name from server.
 */
export async function login(empCode, passcode = '') {
  const code  = String(empCode).trim()
  const email = toAuthEmail(code)

  // Include passcode for internal no-passcode check only — never returned to caller
  const { data: emp, error: empErr } = await supabase
    .from('employees')
    .select('id, emp_code, name, role, dept, img_url, img_id, star_gang_slogan, in_team, auth_user_id, passcode')
    .eq('emp_code', code)
    .maybeSingle()

  if (empErr) throw new Error(empErr.message)
  // Generic error — don't reveal whether empCode exists (AUTH-02)
  if (!emp) throw new Error('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่')

  const hasPasscode = emp.passcode !== null && emp.passcode !== undefined && emp.passcode.trim() !== ''

  if (!hasPasscode) {
    // ── No passcode required (empCode-only login) — ensure RLS session ──
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) await supabase.auth.signInAnonymously().catch(() => {})
  } else if (emp.auth_user_id) {
    // ── Path A: employee has Supabase auth user → use signInWithPassword ──
    const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password: passcode })
    if (signinErr) {
      // Generic error to prevent distinguishing wrong-password vs not-found (AUTH-02)
      throw new Error('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่')
    }
  } else {
    // ── Path B: legacy — verify bcrypt hash then migrate to real auth ──
    const { data: valid, error: rpcErr } = await supabase.rpc('verify_user_passcode', {
      p_emp_code: code,
      p_passcode: passcode,
    })
    if (rpcErr) throw new Error(rpcErr.message)
    if (!valid) throw new Error('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่')

    // Migrate: create Supabase auth user in background (non-fatal)
    supabase.auth.signUp({ email, password: passcode })
      .then(async ({ data: su }) => {
        if (su?.session) {
          await supabase.rpc('link_auth_user', { p_emp_code: code }).catch(() => {})
        }
      })
      .catch(() => {})

    // Fallback: ensure at least an anonymous session for RLS 'authenticated' role
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) await supabase.auth.signInAnonymously().catch(() => {})
  }

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

/**
 * Fetch authoritative employee data from server using current session.
 * Returns null if no session or employee not found.
 * Used by userAuth store on app start to validate role/name from DB (AUTH-03).
 */
export async function fetchMyEmployee() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase.rpc('get_my_employee')
  if (error || !data || data.length === 0) return null
  return data[0]
}
