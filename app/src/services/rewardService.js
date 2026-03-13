import { gasGet } from './api.js'

export async function fetchMyPoints(employeeName) {
  const res = await gasGet('getMyPoints', { employeeName })
  return res.data
}

export async function fetchRewardRules() {
  const res = await gasGet('getRewardRules', {})
  return res.data
}

export async function adminAddRewardRule(token, fields) {
  const res = await gasGet('adminAddRewardRule', { token, ...fields })
  return res.data
}

export async function adminUpdateRewardRule(token, id, fields) {
  const res = await gasGet('adminUpdateRewardRule', { token, id, ...fields })
  return res.data
}

export async function adminDeleteRewardRule(token, id) {
  const res = await gasGet('adminDeleteRewardRule', { token, id })
  return res.data
}

export async function postDailyCheckin(employeeName) {
  const res = await gasGet('dailyCheckin', { employeeName })
  return res.data
}
