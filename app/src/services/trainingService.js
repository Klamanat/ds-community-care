import { gasGet } from './api.js'

export async function fetchTrainings(category) {
  const r = await gasGet('getTrainings', category ? { category } : {})
  return r.data || []
}

export async function fetchMyTrainings(employeeId) {
  const r = await gasGet('getMyTrainings', { employeeId })
  return r.data || []
}

export async function registerTraining(trainingId, employeeId, employeeName) {
  const r = await gasGet('registerTraining', { trainingId, employeeId, employeeName })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function cancelRegistration(trainingId, employeeId) {
  const r = await gasGet('cancelRegistration', { trainingId, employeeId })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

function token() { return localStorage.getItem('admin_token') || '' }

export async function adminFetchTrainings() {
  const r = await gasGet('getTrainings')
  return r.data || []
}

export async function adminGetTrainingRegistrations(trainingId) {
  const r = await gasGet('adminGetTrainingRegistrations', { token: token(), trainingId })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data || []
}

export async function adminAddTraining(fields) {
  const r = await gasGet('adminAddTraining', { token: token(), ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminUpdateTraining(id, fields) {
  const r = await gasGet('adminUpdateTraining', { token: token(), id, ...fields })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}

export async function adminDeleteTraining(id) {
  const r = await gasGet('adminDeleteTraining', { token: token(), id })
  if (!r.ok) throw new Error(r.error || 'error')
  return r.data
}
