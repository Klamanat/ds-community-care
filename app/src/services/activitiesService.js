import { gasGet, gasPost } from './api.js'

const token = () => localStorage.getItem('admin_token') || ''

// Dedup: if a fetch is already in-flight, return the same Promise
// Prevents 200 users opening the modal simultaneously from each firing a separate GAS call
const _inflight = {}
function dedupGet(key, fn) {
  if (_inflight[key]) return _inflight[key]
  const p = fn().finally(() => { delete _inflight[key] })
  _inflight[key] = p
  return p
}

export function fetchAll() {
  return dedupGet('getActivities', async () => {
    const r = await gasGet('getActivities')
    return r.data || []
  })
}

export async function fetchByMonth(monthIdx) {
  const r = await gasGet('getActivities', { monthIdx })
  return r.data || []
}

export async function addActivity(fields) {
  return gasPost('adminAddActivity', { token: token(), ...fields })
}

export async function updateActivity(id, fields) {
  return gasPost('adminUpdateActivity', { token: token(), id, ...fields })
}

export async function deleteActivity(id) {
  return gasGet('adminDeleteActivity', { token: token(), id })
}

export async function joinActivity(activityId, activityName, employeeName, joinLabel) {
  const r = await gasGet('joinActivity', { activityId, activityName, employeeName: employeeName || 'ไม่ระบุชื่อ', joinLabel: joinLabel || '' })
  return r.data   // { alreadyJoined, joinCount }
}

export async function uploadImage(base64, fileName, folderType = 'activities') {
  return gasPost('uploadImage', { base64, fileName: fileName || 'image.jpg', folderType })
}

export async function getMyStamps(employeeName) {
  const r = await gasGet('getMyStamps', { employeeName })
  return r.data || []
}

export async function claimReward(activityId, employeeName, rewardType) {
  const r = await gasGet('claimActivityReward', { activityId, employeeName, rewardType })
  return r.data
}
