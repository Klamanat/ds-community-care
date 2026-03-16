import { gasGet } from './api.js'

// ── Storage ──────────────────────────────────────────────────────────
const LS_KEY  = 'dsc_imgcache'
const LS_TTL  = 60 * 60 * 1000  // 60 min
const BATCH_MS = 50              // collect ids for 50ms then fire ONE GAS request

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

// Debounce saves — avoids thrashing localStorage when many images load at once
let _saveTimer = null
function _scheduleSave() {
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    try {
      const data = {}
      _mem.forEach((b64, id) => { data[id] = b64 })
      localStorage.setItem(LS_KEY, JSON.stringify({ exp: Date.now() + LS_TTL, data }))
    } catch {}
  }, 500)
}

// Pre-load cache from localStorage immediately on module init
_loadLs()

// ── Public API ────────────────────────────────────────────────────────

/** Return cached base64 for imgId synchronously ('' if not cached) */
export function getCached(imgId) {
  return (imgId && _mem.get(imgId)) || ''
}

// ── Batch queue ───────────────────────────────────────────────────────
// Coalesces ALL fetchImages() calls within BATCH_MS into ONE GAS request.
// Before: 6 stores loading simultaneously → 6 separate GAS requests
// After:  all 6 calls within 50ms → 1 GAS request with all IDs merged

const _pending   = new Set()  // ids queued for the next batch
const _callbacks = []         // resolve fns waiting for batch result
let   _batchTimer = null

async function _flush() {
  _batchTimer = null
  const ids = [..._pending].filter(id => !_mem.has(id))
  const cbs = _callbacks.splice(0)
  _pending.clear()

  if (ids.length) {
    try {
      const r   = await gasGet('getImages', { imgIds: ids.join(',') })
      const map = r.data || {}
      Object.entries(map).forEach(([id, b64]) => { if (b64) _mem.set(id, b64) })
      _scheduleSave()
    } catch {}
  }

  cbs.forEach(fn => fn())
}

/**
 * Batch-fetch Drive images not yet in cache.
 * Updates _mem + localStorage, returns { imgId: base64 } map.
 */
export function fetchImages(imgIds) {
  const ids     = imgIds.filter(Boolean)
  const missing = ids.filter(id => !_mem.has(id))

  // All already cached — resolve synchronously
  if (!missing.length) {
    const result = {}
    ids.forEach(id => { if (_mem.has(id)) result[id] = _mem.get(id) })
    return Promise.resolve(result)
  }

  // Queue missing ids into the shared batch
  missing.forEach(id => _pending.add(id))
  if (!_batchTimer) _batchTimer = setTimeout(_flush, BATCH_MS)

  // Return a promise that resolves after the batch completes
  return new Promise(resolve => {
    _callbacks.push(() => {
      const result = {}
      ids.forEach(id => { if (_mem.has(id)) result[id] = _mem.get(id) })
      resolve(result)
    })
  })
}
