import { gasGet, gasPost } from './api.js'

export async function fetchMonth(monthIdx) {
  const r = await gasGet('getBirthdays', { monthIdx })
  return (r.data || []).map(b => ({
    key:         b.key,
    employeeId:  b.employeeId,
    name:        b.name,
    role:        b.role,
    date:        b.date,
    monthIdx:    b.monthIdx,
    fallbackIdx: Number(b.fallbackIdx) || 0,
    photo:       b.imgUrl || '',
    imgId:       b.imgId  || '',
    wishes:      [],
  }))
}

export async function fetchWishes(birthdayKey) {
  const r = await gasGet('getBirthdayWishes', { birthdayKey })
  return (r.data || []).map(w => ({
    from:  w.fromName,
    avIdx: w.fromAvIdx,
    msg:   w.msg,
    time:  w.time,
  }))
}

/**
 * Persist a compressed base64 image for a birthday employee.
 * Uses POST because base64 strings exceed URL param length limits.
 */
export async function uploadPhoto(birthdayKey, imageBase64) {
  const r = await gasPost('uploadImage', {
    sheetName:   'Birthdays',
    keyCol:      'key',
    keyVal:      birthdayKey,
    imageBase64,
  })
  return r.data
}

export async function addWish(birthdayKey, msg, fromName, fromAvIdx) {
  const r = await gasGet('addBirthdayWish', {
    birthdayKey,
    msg: msg.slice(0, 500),
    fromName,
    fromAvIdx
  })
  return r.data
}
