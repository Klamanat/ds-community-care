// userAuthService.js — Employee auth via Supabase Auth
// Replaces GAS userCheckPassword / userLogin / userSetPassword

import { supabase } from './supabase.js'

// Email convention: {employeeId}@ds.internal
function toEmail(employeeId) {
  return `${String(employeeId).trim()}@ds.internal`
}

export async function checkPasswordSet(employeeId) {
  // Probe sign-in; "Invalid login credentials" → user exists (has password)
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(employeeId), password: '__probe__',
  })
  if (!error || error.message?.includes('Invalid login credentials')) return { hasPassword: true }
  return { hasPassword: false }
}

export async function setPassword(employeeId, password) {
  const { data, error } = await supabase.auth.signUp({
    email: toEmail(employeeId),
    password,
    options: { data: { employee_id: employeeId } },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function login(employeeId, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    toEmail(employeeId),
    password,
  })
  if (error) throw new Error(error.message)

  // Fetch employee profile
  const { data: emp } = await supabase
    .from('employees')
    .select('id, emp_code, name, role, dept, img_url, img_id, star_gang_slogan')
    .or(`id.eq.${employeeId},emp_code.eq.${employeeId}`)
    .maybeSingle()

  return {
    session:    data.session,
    employeeId: emp?.id || employeeId,
    name:       emp?.name || '',
    role:       emp?.role || '',
    dept:       emp?.dept || '',
    imgId:      emp?.img_id || '',
    imgUrl:     emp?.img_url || '',
    slogan:     emp?.star_gang_slogan || '',
  }
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
