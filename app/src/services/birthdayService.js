import { gasGet } from './api.js'

export async function fetchMonth(monthIdx) {
  const r = await gasGet('getBirthdays', { monthIdx })
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
