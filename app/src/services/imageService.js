import { gasGet } from './api.js'

// ── Storage ──────────────────────────────────────────────────────────
const LS_KEY = 'dsc_imgcache'
const LS_TTL = 60 * 60 * 1000  // 60 min

// In-memory map — populated on init from localStorage
const _mem = new Map()

function _loadLs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const { exp, data } = JSON.parse(raw)
    if (Date.now() > exp) { localStorage.removeItem(LS_KEY); return }
    Object.entries(data).forEach(([id, b64]) => { if (b64) _mem.set(id, b64) })
  } catch {}
}

function _saveLs() {
  try {
    const data = {}
    _mem.forEach((b64, id) => { data[id] = b64 })
    localStorage.setItem(LS_KEY, JSON.stringify({ exp: Date.now() + LS_TTL, data }))
  } catch {}
}

// Pre-load cache from localStorage immediately on module init
_loadLs()

// ── Public API ────────────────────────────────────────────────────────

/** Return cached base64 for imgId synchronously ('' if not cached) */
export function getCached(imgId) {
  return (imgId && _mem.get(imgId)) || ''
}

/**
 * Batch-fetch Drive images not yet in cache.
 * Updates _mem + localStorage, returns { imgId: base64 } map.
 */
export async function fetchImages(imgIds) {
  const missing = imgIds.filter(id => id && !_mem.has(id))
  if (missing.length) {
    try {
      const r = await gasGet('getImages', { imgIds: missing.join(',') })
      const map = r.data || {}
      Object.entries(map).forEach(([id, b64]) => { if (b64) _mem.set(id, b64) })
      _saveLs()
    } catch {}
  }
  const result = {}
  imgIds.forEach(id => { if (_mem.has(id)) result[id] = _mem.get(id) })
  return result
}
