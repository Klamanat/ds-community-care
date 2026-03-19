import { getImages as edgeGetImages } from './edgeFunctions.js'

// ── Constants ─────────────────────────────────────────────────────────
const STORAGE_BASE = (import.meta.env.VITE_SUPABASE_URL || '') + '/storage/v1/object/public/images/'
const LS_KEY   = 'dsc_imgcache_v3'   // v3: Drive-IDs only (no Storage paths)
const LS_TTL   = 60 * 60 * 1000      // 60 min
const BATCH_MS = 50                   // coalesce calls within 50ms → 1 request

// ── ID type helpers ───────────────────────────────────────────────────
function isStoragePath(id) { return !!id &&  id.includes('/') && !id.startsWith('http') }
function isFullUrl(id)     { return !!id &&  id.startsWith('http') }
function isDriveId(id)     { return !!id && !id.includes('/') && !id.startsWith('http') }

function encodeStoragePath(path) {
  return path.split('/').map(encodeURIComponent).join('/')
}

// ── In-memory cache — Drive IDs only ─────────────────────────────────
const _mem = new Map()

function _loadLs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const { exp, data } = JSON.parse(raw)
    if (Date.now() > exp) { localStorage.removeItem(LS_KEY); return }
    Object.entries(data).forEach(([id, val]) => {
      // Only cache Drive IDs — skip any Storage paths that leaked in
      if (val && isDriveId(id)) _mem.set(id, val)
    })
  } catch {}
}

let _saveTimer = null
function _scheduleSave() {
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    try {
      const data = {}
      _mem.forEach((val, id) => { data[id] = val })
      localStorage.setItem(LS_KEY, JSON.stringify({ exp: Date.now() + LS_TTL, data }))
    } catch {}
  }, 500)
}

_loadLs()

// ── Public API ────────────────────────────────────────────────────────

/**
 * Synchronously resolve an imgId to a displayable URL.
 * - Storage path  → builds fresh Supabase Storage public URL (never uses cache)
 * - Full URL       → returns as-is
 * - Drive ID       → returns cached value, or '' if not yet fetched
 */
export function getCached(imgId) {
  if (!imgId) return ''
  if (isFullUrl(imgId))     return imgId
  if (isStoragePath(imgId)) return STORAGE_BASE + encodeStoragePath(imgId)
  return _mem.get(imgId) || ''   // Drive ID
}

/** Force re-fetch a Drive image (bypass cache). Returns fresh value or ''. */
export async function forceRefreshImage(imgId) {
  if (!isDriveId(imgId)) return ''
  _mem.delete(imgId)
  try {
    const map = await edgeGetImages([imgId])
    const val = map[imgId]
    if (val) { _mem.set(imgId, val); _scheduleSave(); return val }
  } catch {}
  return ''
}

// ── Batch queue (Drive IDs only) ──────────────────────────────────────
const _pending   = new Set()
const _callbacks = []
let   _batchTimer = null

async function _flush() {
  _batchTimer = null
  const driveIds = [..._pending].filter(id => isDriveId(id) && !_mem.has(id))
  const cbs = _callbacks.splice(0)
  _pending.clear()

  if (driveIds.length) {
    try {
      const map = await edgeGetImages(driveIds)
      Object.entries(map).forEach(([id, val]) => { if (val) _mem.set(id, val) })
      _scheduleSave()
    } catch {}
    // Fallback: Drive thumbnail (works for "anyone with link" files)
    driveIds.forEach(id => {
      if (!_mem.has(id)) _mem.set(id, `https://drive.google.com/thumbnail?id=${id}&sz=w800`)
    })
  }

  cbs.forEach(fn => fn())
}

/**
 * Batch-resolve image IDs.
 * - Storage paths and full URLs resolve immediately (no network).
 * - Drive IDs are coalesced into a single Edge Function call.
 * Returns { imgId: url } map.
 */
export function fetchImages(imgIds) {
  const ids = imgIds.filter(Boolean)

  // Resolve non-Drive IDs immediately
  const resolved = {}
  ids.forEach(id => {
    if (isFullUrl(id))     resolved[id] = id
    if (isStoragePath(id)) resolved[id] = STORAGE_BASE + encodeStoragePath(id)
    if (isDriveId(id) && _mem.has(id)) resolved[id] = _mem.get(id)
  })

  const missing = ids.filter(id => isDriveId(id) && !_mem.has(id))
  if (!missing.length) return Promise.resolve(resolved)

  missing.forEach(id => _pending.add(id))
  if (!_batchTimer) _batchTimer = setTimeout(_flush, BATCH_MS)

  return new Promise(resolve => {
    _callbacks.push(() => {
      const result = { ...resolved }
      missing.forEach(id => { if (_mem.has(id)) result[id] = _mem.get(id) })
      resolve(result)
    })
  })
}
