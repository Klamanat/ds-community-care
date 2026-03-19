// edgeFunctions.js — wrappers for Supabase Edge Functions that call Google Drive API
// Replaces: gasPost('uploadImage', ...) and gasGet('getImages', ...)

const BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Upload a base64 image to Google Drive via Edge Function.
 * @param {string} base64     Data URL or raw base64
 * @param {string} fileName   File name (e.g. 'photo.jpg')
 * @param {string} folderType 'empathy' | 'profiles' | 'activities' | 'announcements' | 'idp'
 * @returns {{ id: string, url: string }}
 */
export async function uploadImage(base64, fileName, folderType = 'empathy') {
  const res = await fetch(`${BASE}/upload-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({ base64, fileName, folderType }),
  })
  if (!res.ok) throw new Error(`upload-image: ${res.status}`)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error('upload-image: invalid response') }
  if (!data.ok) throw new Error(data.error || 'upload-image failed')
  return data.data   // { id, url }
}

/**
 * Delete one or more files from Supabase Storage via Edge Function.
 * Fire-and-forget: do not await unless you need confirmation.
 * @param {string[]} paths  Storage paths, e.g. ['activities/1710425_file.jpg']
 */
export async function deleteImage(paths) {
  if (!paths?.length) return
  const res = await fetch(`${BASE}/delete-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({ paths }),
  })
  if (!res.ok) throw new Error(`delete-image: ${res.status}`)
}

/**
 * Batch-fetch Drive images as base64 map via Edge Function.
 * Replaces gasGet('getImages', { imgIds: '...' })
 * @param {string[]} imgIds  Array of Drive file IDs
 * @returns {Record<string, string>}  { fileId: 'data:image/jpeg;base64,...' }
 */
export async function getImages(imgIds) {
  if (!imgIds?.length) return {}
  const qs  = new URLSearchParams({ imgIds: imgIds.join(',') })
  const res = await fetch(`${BASE}/get-images?${qs}`, {
    headers: { Authorization: `Bearer ${ANON}` },
  })
  if (!res.ok) throw new Error(`get-images: ${res.status}`)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error('get-images: invalid response') }
  if (!data.ok) throw new Error(data.error || 'get-images failed')
  return data.data   // { id: base64 }
}
