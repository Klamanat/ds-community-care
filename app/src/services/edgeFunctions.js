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
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'upload-image failed')
  return data.data   // { id, url }
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
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'get-images failed')
  return data.data   // { id: base64 }
}
