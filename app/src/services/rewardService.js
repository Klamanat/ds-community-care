import { gasGet } from './api.js'

export async function fetchMyPoints(employeeName) {
  const res = await gasGet('getMyPoints', { employeeName })
  return res.data
}

export async function fetchRewardRules() {
  const res = await gasGet('getRewardRules', {})
  return res.data
}

export async function adminUpdateRewardRule(token, id, fields) {
  const res = await gasGet('adminUpdateRewardRule', { token, id, ...fields })
  return res.data
}
