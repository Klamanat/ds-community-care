import { gasGet, gasPost } from './api.js'

export async function checkPasswordSet(employeeId) {
  const data = await gasGet('userCheckPassword', { employeeId })
  return data.data.hasPassword
}

export async function setPassword(employeeId, password) {
  return gasPost('userSetPassword', { employeeId, password })
}

export async function login(employeeId, password) {
  const data = await gasPost('userLogin', { employeeId, password })
  return data.data  // { token, employeeId, name, role }
}
