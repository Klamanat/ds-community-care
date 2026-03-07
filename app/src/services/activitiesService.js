import { gasGet, gasPost } from './api.js'

const token = () => localStorage.getItem('admin_token') || ''

export async function fetchAll() {
  const r = await gasGet('getActivities')
  return r.data || []
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

export async function uploadImage(base64, fileName, folderType = 'activities') {
  return gasPost('uploadImage', { base64, fileName: fileName || 'image.jpg', folderType })
}
